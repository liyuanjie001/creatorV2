<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Upload, Search, ArrowLeft, Sparkles, ChevronDown, Loader2, Heart, MessageCircle, Share2, Music2, House, UsersRound, Inbox, UserRound, Plus, X, GripVertical } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { studio, blankAttributes, ensurePublishTask, submitPublish } from '@/services/studio';
import { currentUser } from '@/services/identity';
import { getMedia, saveMedia } from '@/services/media';
import { uid, now } from '@/services/storage';
import type { Film, PublishTask } from '@/types/studio';
import { toast } from 'vue-sonner';
import FilmPreview from './FilmPreview.vue';
import VideoManagement from './VideoManagement.vue';
import InfoTip from './InfoTip.vue';
import SchedulePicker from './SchedulePicker.vue';
import { publishCaption, platformName, accountPlatform } from '@/services/accounts';
import AccountPicker from './AccountPicker.vue';
import AccountAuthorization from './AccountAuthorization.vue';
import type { TKAccount } from '@/types/studio';
const preview = ref<Film | null>(null);
function filmFor(task: PublishTask) { return studio.value.films.find(f => f.id === task.filmId); }
function coverFor(task: PublishTask) { return `/images/creation-covers/cover-${(Array.from(task.filmId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3) + 1}.jpg`; }


const scheduleValidity = ref<Record<string, boolean>>({});
function setTiming(task: PublishTask, mode: string) { task.scheduledAt = mode === 'now' ? '' : new Date(Date.now()+3600000).toISOString(); scheduleValidity.value[task.id] = true; }
function taskPlatform(task: PublishTask) { return accountPlatform(studio.value.accounts.find(a=>a.id===task.accountId)); }
function addConfiguration(task: PublishTask) {
  const film = filmFor(task);
  if (!film || project.value.archived || busy.value) return;
  const added = ensurePublishTask(film, undefined, true);
  void router.replace({query:{...route.query,task:[...drafts.value.map(t=>t.id),added.id]}});
}
const props = defineProps<{ projectId: string }>();
const router = useRouter();
const route = useRoute();
const tab = computed({
  get: () => route.query.tab === 'configure' ? 'configure' : route.query.tab === 'records' ? 'records' : route.query.tab === 'scheduled' ? 'scheduled' : 'creations',
  set: (value: string) => { void router.replace({ query: { section: 'publish', tab: value, view: route.query.view, size: route.query.size } }); },
});

const drafts = ref<PublishTask[]>([]);
const busy = ref(false);
const error = ref('');
const writingTasks = ref<string[]>([]);
const uploading = ref(false);
const uploadMenuOpen = ref(false);
const imageUrls = ref<Record<string, { id: string; url: string }[]>>({});
const imageBusy = ref<Record<string, boolean>>({});
const imagePickerTask = ref<PublishTask | null>(null);
const imagePickerItems = ref<{ id: string; url: string; title: string }[]>([]);
const imagePickerSelection = ref<string[]>([]);
const imagePickerSearch = ref('');

const project = computed(() => studio.value.projects.find(p => p.id === props.projectId)!);
const accounts = computed(() => studio.value.accounts.filter(a => !a.deleted && project.value.accountIds.includes(a.id)));
const authAccount = ref<TKAccount | null>(null);
const authOpen = ref(false);
function openAccountAuth(account: TKAccount) { authAccount.value = account; authOpen.value = true; }
const mutable = (task?: PublishTask) => !task || ['待配置', '发布失败', '已取消'].includes(task.status);
async function upload(event: Event, kind: 'video' | 'image') {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  if (!files.length) return;
  uploading.value = true;
  uploadMenuOpen.value = false;
  try {
    const isVideo = files.every(f => f.type.startsWith('video/'));
    const isImage = files.every(f => f.type.startsWith('image/'));
    if ((kind === 'video' && !isVideo) || (kind === 'image' && !isImage)) throw new Error(kind === 'video' ? '请选择视频文件' : '请选择图片文件');
    const groups = isImage ? [files] : files.map(f => [f]);
    const uploadedIds: string[] = [];
    for (const groupFiles of groups) {
      const mediaIds: string[] = [];
      for (const file of groupFiles) mediaIds.push(await saveMedia(currentUser.value!.id, file));
      const film: Film = { id: uid(), projectId: props.projectId, title: groupFiles[0]!.name.replace(/\.[^.]+$/, ''), type: isVideo ? '视频' : '图文', source: '本地上传', createdAt: now(), duration: '15', ratio: '9:16', quality: '原始', brief: '本地上传媒体', productIds: [], version: 1, mediaIds, inPublishing: true, attributes: blankAttributes() };
      studio.value.films.unshift(film);
      ensurePublishTask(film);
      uploadedIds.push(film.id);
    }
    toast.success('上传完成，媒体已保存在本机浏览器');
    configure(uploadedIds);
  } catch (e) { toast.error((e as Error).message); }
  finally { uploading.value = false; (event.target as HTMLInputElement).value = ''; }
}
function configure(ids: string[], retryTaskId?: string) {
  drafts.value = ids.map(id => studio.value.films.find(f => f.id === id)).filter((f): f is Film => !!f).map(film => { const task = ensurePublishTask(film,retryTaskId); return mutable(task) ? task : ensurePublishTask(film,undefined,true); }).filter(mutable).map(t => { const copy = JSON.parse(JSON.stringify(t)) as PublishTask; const film = filmFor(copy); if (film?.type === '图文') copy.imageMediaIds ??= [...film.mediaIds]; return copy; });
  if (!drafts.value.length) { toast.info('所选成片已有执行中的任务'); return; }
  error.value = '';
  void router.push({ query: { ...route.query, tab: 'configure', from: tab.value, task: drafts.value.map(t => t.id) } });
}
async function submit() {
  if (busy.value || writingTasks.value.length || project.value.archived) return;
  if (drafts.value.some(t=>t.scheduledAt && scheduleValidity.value[t.id] === false)) { error.value='请修正排期时间或选择重复时间的 GMT 偏移'; return; }
  busy.value = true; error.value = '';
  try {
    await submitPublish(drafts.value);
    drafts.value.forEach(draft => { const task = studio.value.tasks.find(t => t.id === draft.id); if (task) Object.assign(task, draft); });
    tab.value = drafts.value.every(t=>t.status==='已排期') ? 'scheduled' : 'creations'; toast.success(drafts.value.every(t=>t.status==='已排期')?'定时发布任务已排期（演示）':'发布任务已提交，等待平台确认（演示）');
  } catch (e) { error.value = (e as Error).message; }
  finally { busy.value = false; }
}
function backToCreations() { void router.replace({ query: { ...route.query, tab: ['records','scheduled'].includes(String(route.query.from)) ? route.query.from : 'creations', task: undefined, from: undefined } }); }
watch(() => [route.query.tab, route.query.task], () => {
  if (tab.value !== 'configure') return;
  const ids = Array.isArray(route.query.task) ? route.query.task : [route.query.task];
  drafts.value = ids.map(id=>studio.value.tasks.find(t=>t.projectId===props.projectId && t.id===id)).filter((t): t is PublishTask => !!t && mutable(t)).map(t => { const copy = JSON.parse(JSON.stringify({ ...t, privacy: t.privacy || 'PUBLIC_TO_EVERYONE', scheduledAt: t.status === '待配置' ? t.scheduledAt : '', error: '' })) as PublishTask; const film = filmFor(copy); if (film?.type === '图文') copy.imageMediaIds ??= [...film.mediaIds]; return copy; });
  error.value = '';
}, { immediate: true });
watch(drafts, values => {
  for (const draft of values) {
    const task = studio.value.tasks.find(t => t.id === draft.id);
    if (task && mutable(task)) Object.assign(task, JSON.parse(JSON.stringify(draft)));
  }
}, { deep: true });
watch(() => drafts.value.map(t => `${t.id}:${(t.imageMediaIds ?? []).join(',')}`).join('|'), async () => {
  const urls: Record<string, { id: string; url: string }[]> = {};
  for (const task of drafts.value) {
    if (filmFor(task)?.type !== '图文') continue;
    const prior = imageUrls.value[task.id] ?? [];
    prior.forEach(item => URL.revokeObjectURL(item.url));
    const ids = task.imageMediaIds ?? filmFor(task)?.mediaIds ?? [];
    const blobs = await Promise.all(ids.map(id => getMedia(currentUser.value!.id, id)));
    urls[task.id] = ids.flatMap((id, index) => blobs[index] ? [{ id, url: URL.createObjectURL(blobs[index]!) }] : []);
  }
  imageUrls.value = urls;
}, { immediate: true });
onBeforeUnmount(() => {
  Object.values(imageUrls.value).flat().forEach(item => URL.revokeObjectURL(item.url));
  imagePickerItems.value.forEach(item => URL.revokeObjectURL(item.url));
});
async function openImagePicker(task: PublishTask) {
  imagePickerTask.value = task;
  imagePickerSelection.value = [];
  imagePickerSearch.value = '';
  const items: { id: string; url: string; title: string }[] = [];
  const works = studio.value.films.filter(f => f.projectId === props.projectId && f.type === '图文');
  for (const work of works) {
    for (const id of work.mediaIds) {
      const blob = await getMedia(currentUser.value!.id, id);
      if (blob) items.push({ id, url: URL.createObjectURL(blob), title: work.title });
    }
  }
  imagePickerItems.value.forEach(item => URL.revokeObjectURL(item.url));
  imagePickerItems.value = items;
}
function finishImagePicker() {
  const task = imagePickerTask.value;
  if (task && imagePickerSelection.value.length) {
    const current = task.imageMediaIds ??= [...(filmFor(task)?.mediaIds ?? [])];
    task.imageMediaIds = [...current, ...imagePickerSelection.value.filter(id => !current.includes(id))];
  }
  imagePickerTask.value = null;
}
function togglePickerImage(id: string) {
  imagePickerSelection.value = imagePickerSelection.value.includes(id)
    ? imagePickerSelection.value.filter(item => item !== id)
    : [...imagePickerSelection.value, id];
}
async function uploadFromPicker(event: Event) {
  const task = imagePickerTask.value;
  if (!task) return;
  await uploadTaskImages(task, event);
  imagePickerTask.value = null;
}
async function uploadTaskImages(task: PublishTask, event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
  if (!files.length) return;
  imageBusy.value[task.id] = true;
  try {
    const current = task.imageMediaIds ??= [...(filmFor(task)?.mediaIds ?? [])];
    const ids = await Promise.all(files.map(file => saveMedia(currentUser.value!.id, file)));
    task.imageMediaIds = [...current, ...ids];
  } catch (cause) { toast.error((cause as Error).message); }
  finally { imageBusy.value[task.id] = false; input.value = ''; }
}
function removeTaskImage(task: PublishTask, id: string) { task.imageMediaIds = (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).filter(item => item !== id); }
function moveTaskImage(task: PublishTask, from: string, to: string) {
  const ids = [...(task.imageMediaIds ?? filmFor(task)?.mediaIds ?? [])];
  const source = ids.indexOf(from); const target = ids.indexOf(to);
  if (source < 0 || target < 0 || source === target) return;
  ids.splice(target, 0, ids.splice(source, 1)[0]!); task.imageMediaIds = ids;
}
const captionFor = publishCaption;
function updateCaption(task: PublishTask, value: string) { task.caption = value.slice(0, 2200); }
function openPreview(task: PublishTask) {
  const film = filmFor(task);
  if (!film) return;
  preview.value = film.type === '图文' ? { ...film, mediaIds: [...(task.imageMediaIds ?? film.mediaIds)] } : film;
}
async function helpWrite(task: PublishTask) {
  const input = captionFor(task).trim();
  if (!input || writingTasks.value.includes(task.id)) return;
  writingTasks.value.push(task.id);
  try {
    await new Promise(resolve => setTimeout(resolve, 900));
    const body = input.replace(/#[^\s#]+/g, '').trim();
    const tags = input.match(/#[^\s#]+/g) ?? [];
    updateCaption(task, [body, '发现日常里的小惊喜，分享值得体验的美好。', [...new Set([...tags, '#好物分享', '#真实体验', '#生活灵感'])].join(' ')].filter(Boolean).join('\n'));
  } finally {
    writingTasks.value = writingTasks.value.filter(id => id !== task.id);
  }
}

</script>
<template>
  <AccountAuthorization :open="authOpen" :account="authAccount" @update:open="authOpen = $event" />
  <VideoManagement v-if="tab !== 'configure'" :project-id="projectId" :published="tab!=='creations'" :category="tab==='scheduled' ? 'scheduled' : tab==='records' ? 'published' : 'all'" @publish="configure">
    <template #upload>
      <div class="relative" @mouseenter="uploadMenuOpen = true" @mouseleave="uploadMenuOpen = false" @keydown.esc="uploadMenuOpen = false">
        <button type="button" class="studio-primary" aria-haspopup="menu" :aria-expanded="uploadMenuOpen" :disabled="uploading || project.archived" @click="uploadMenuOpen = true"><Upload class="h-4 w-4" />{{ uploading ? '上传中…' : tab === 'records' ? '发布本地作品' : '上传本地作品' }}<ChevronDown class="h-3.5 w-3.5" /></button>
        <div v-if="uploadMenuOpen && !uploading && !project.archived" role="menu" aria-label="上传作品类型" class="absolute right-0 top-full z-30 min-w-44 pt-2">
          <div class="rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            <label role="menuitem" tabindex="0" class="flex cursor-pointer items-center rounded-lg px-4 py-2.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600" @keydown.enter="($event.currentTarget as HTMLElement).querySelector('input')?.click()">视频<input class="hidden" type="file" accept="video/*" multiple :disabled="uploading || project.archived" @change="upload($event, 'video')"></label>
            <label role="menuitem" tabindex="0" class="flex cursor-pointer items-center rounded-lg px-4 py-2.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600" @keydown.enter="($event.currentTarget as HTMLElement).querySelector('input')?.click()">图集<input class="hidden" type="file" accept="image/*" multiple :disabled="uploading || project.archived" @change="upload($event, 'image')"></label>
          </div>
        </div>
      </div>
    </template>
  </VideoManagement>
  <Dialog :open="!!imagePickerTask" @update:open="!$event && (imagePickerTask = null)">
    <DialogContent class="flex max-h-[88vh] max-w-4xl flex-col overflow-hidden bg-white p-0">
      <header class="border-b border-slate-100 px-6 py-5">
        <DialogTitle class="text-base font-semibold text-slate-800">添加图片</DialogTitle>
        <DialogDescription class="mt-1 text-xs text-slate-400">从本地上传，或选择当前项目“我的作品”中的图片。</DialogDescription>
      </header>
      <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        <div>
          <h3 class="mb-2 text-xs font-semibold text-slate-700">本地上传</h3>
          <label class="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-600">
            <Upload class="h-5 w-5" />点击或拖拽图片至此处上传
            <input type="file" accept="image/*" multiple class="hidden" :disabled="!imagePickerTask || imageBusy[imagePickerTask.id]" @change="uploadFromPicker">
          </label>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-slate-800">我的作品（图片）</h3>
          <label class="relative"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input v-model="imagePickerSearch" class="studio-field !h-9 !w-56 !pl-9 !text-xs" placeholder="搜索素材" aria-label="搜索我的作品图片"></label>
        </div>
        <div v-if="imagePickerItems.filter(item => item.title.toLowerCase().includes(imagePickerSearch.toLowerCase())).length" class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <button v-for="item in imagePickerItems.filter(entry => entry.title.toLowerCase().includes(imagePickerSearch.toLowerCase()))" :key="item.id" type="button" class="overflow-hidden rounded-lg border text-left transition" :class="imagePickerSelection.includes(item.id) ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'" :aria-pressed="imagePickerSelection.includes(item.id)" @click="togglePickerImage(item.id)">
            <img :src="item.url" :alt="item.title" class="aspect-square w-full object-cover">
            <span class="block truncate px-2 py-2 text-xs text-slate-600">{{ item.title }}</span>
          </button>
        </div>
        <p v-else class="py-12 text-center text-sm text-slate-400">暂无可选图片，可从本地上传。</p>
      </div>
      <footer class="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <span class="text-xs text-slate-500">已选择 {{ imagePickerSelection.length }} 张</span>
        <div class="flex gap-2"><button type="button" class="studio-btn !h-9 !text-xs" @click="imagePickerTask = null">取消</button><button type="button" class="studio-primary !h-9 !text-xs" @click="finishImagePicker">完成</button></div>
      </footer>
    </DialogContent>
  </Dialog>
  <FilmPreview :film="preview" @close="preview=null" />
  <section v-if="tab === 'configure'" class="w-full space-y-5" aria-label="发布配置页面">
    <header class="flex items-start gap-3"><button class="studio-btn !px-3 !text-xs !font-normal" aria-label="返回上一个页面" @click="backToCreations"><ArrowLeft class="h-4 w-4" />返回</button><div><h1 class="text-lg font-normal text-slate-800">配置发布</h1><p class="mt-2 text-xs text-slate-400">共 {{ drafts.length }} 条成片 · 逐条确认帐号与发布内容，修改自动保存。</p></div></header>
    <div>
    <div v-if="!drafts.length" class="py-12 text-center text-sm text-slate-400">没有可配置的发布任务<button class="ml-3 text-sky-600" @click="backToCreations">返回创作记录</button></div><template v-if="drafts.length"><div v-for="(task, index) in drafts" :key="task.id" class="mb-4 mt-4 grid items-start gap-6 [&+div]:mt-9 md:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_280px]"><section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header class="flex items-center gap-3 bg-slate-100/80 px-5 py-3">
        <span v-if="drafts.length > 1 && filmFor(task)?.type !== '图文'" class="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11a3fd] to-[#1769ff] px-2 text-lg font-bold tabular-nums text-white" :aria-label="`第 ${index + 1} 条视频`">{{ index + 1 }}</span>
        <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800" :title="filmFor(task)?.title">{{ filmFor(task)?.title }}</h3><button type="button" class="shrink-0 text-xs text-sky-600" :disabled="project.archived || busy" @click="addConfiguration(task)">添加发布帐号</button>
        <span class="shrink-0 text-xs text-slate-400">{{ filmFor(task)?.type }}<template v-if="filmFor(task)?.type === '视频'"> · {{ filmFor(task)?.duration }}s</template><template v-else> · {{ (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).length }} 张图片</template></span>
      </header>
      <div class="p-5">
        <div class="order-1 min-w-0 space-y-[17px]">
          <section v-if="filmFor(task)?.type === '图文'" class="space-y-3 rounded-xl bg-slate-50 p-3" aria-label="图文图片与背景音乐">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div><h4 class="text-xs font-semibold text-slate-800">图文图片 <span class="font-normal text-slate-400">{{ (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).length }} 张 · 首张为封面</span></h4></div>
            </div>
            <div class="flex flex-wrap gap-3">
              <div v-for="(id, imageIndex) in (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? [])" :key="id" :data-media-id="id" draggable="true" class="group relative aspect-square w-24 cursor-grab overflow-hidden rounded-lg bg-slate-200 active:cursor-grabbing" :aria-label="`第 ${imageIndex + 1} 张图片`" @dragstart="($event.dataTransfer?.setData('text/plain', id))" @dragover.prevent @drop.prevent="moveTaskImage(task, $event.dataTransfer?.getData('text/plain') || '', id)">
                <img v-if="imageUrls[task.id]?.find(item => item.id === id)" :src="imageUrls[task.id]?.find(item => item.id === id)?.url" :alt="`图文图片 ${imageIndex + 1}`" class="h-full w-full object-cover">
                <span v-else class="grid h-full place-items-center px-1 text-center text-[10px] text-slate-500">媒体缺失</span>
                <span v-if="imageIndex === 0" class="absolute inset-x-0 bottom-0 bg-sky-600/90 py-1 text-center text-[9px] font-medium text-white">封面</span>
                <button type="button" class="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100" :aria-label="`移除第 ${imageIndex + 1} 张图片`" @click="removeTaskImage(task, id)"><X class="h-3 w-3" /></button>
                <GripVertical class="absolute left-1 top-1 h-3.5 w-3.5 text-white drop-shadow" />
              </div>
              <button type="button" class="grid aspect-square w-24 place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-sky-400 hover:text-sky-600" :aria-label="`添加图片 ${index + 1}`" @click="openImagePicker(task)"><Plus class="h-7 w-7" /></button>
            </div>
            <div class="pt-2">
              <h4 class="mb-2 text-xs font-semibold text-slate-800">背景音乐 <span class="font-normal text-slate-400">可选</span></h4>
              <button type="button" class="flex h-10 w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200" @click="toast.info('背景音乐选择暂未开放')"><Plus class="h-4 w-4" />选择音乐</button>
            </div>
          </section>
          <div><span class="studio-label">发布帐号<InfoTip text="请选择当前项目的在线帐号；登录过期时请先登录授权。" /></span><AccountPicker v-model="task.accountId" :accounts="accounts" :groups="studio.groups" :selected-account="studio.accounts.find(a => a.id === task.accountId)" :disabled="project.archived || !mutable(task) || busy" @authorize="openAccountAuth" /></div>
          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label :for="`caption-${task.id}`" class="text-xs font-medium text-slate-500">发布文案</label>
              <button type="button" class="inline-flex items-center gap-1.5 text-xs text-sky-600 disabled:cursor-not-allowed disabled:text-slate-400" :disabled="!captionFor(task).trim() || writingTasks.includes(task.id)" @click="helpWrite(task)"><Loader2 v-if="writingTasks.includes(task.id)" class="h-3.5 w-3.5 animate-spin" /><Sparkles v-else class="h-3.5 w-3.5" />{{ writingTasks.includes(task.id) ? '帮写中…' : 'AI 帮写' }}</button>
            </div>
            <div class="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-300 focus-within:ring-1 focus-within:ring-sky-300" :aria-busy="writingTasks.includes(task.id)">
              <textarea :id="`caption-${task.id}`" :value="captionFor(task)" :disabled="writingTasks.includes(task.id)" class="block h-[120px] w-full resize-y bg-transparent px-3 pt-3 text-sm leading-6 text-slate-700 outline-none disabled:opacity-60" maxlength="2200" placeholder="输入发布文案与 #话题，也可输入想法让 AI 帮写" @input="updateCaption(task, ($event.target as HTMLTextAreaElement).value)" />
              <div class="px-3 pb-2.5 text-right text-[10px] text-slate-400">{{ captionFor(task).length }}/2200</div>
            </div>
          </div>
          <div class="pt-4">
            <h4 class="mb-3 text-sm font-semibold text-slate-800">设置</h4>
            <div class="grid gap-x-3 gap-y-[17px] min-[1100px]:grid-cols-2">
              <label v-if="taskPlatform(task) === 'tiktok'"><span class="studio-label">谁可以观看<InfoTip text="发布后可见范围由此设置决定。" /></span><select v-model="task.privacy" class="studio-field !h-9 !text-xs"><option value="PUBLIC_TO_EVERYONE">所有人</option><option value="MUTUAL_FOLLOW_FRIENDS">互相关注的好友</option><option value="SELF_ONLY">仅自己</option></select></label>
              <fieldset class="min-[1100px]:col-span-2"><legend class="studio-label">什么时候发布<InfoTip text="按选择城市的当地时间排期；执行前检查帐号与内容状态。" /></legend><div class="flex flex-wrap items-center gap-4"><label class="flex items-center gap-2 text-xs"><input type="radio" :name="'timing-'+task.id" :checked="!task.scheduledAt" @change="setTiming(task,'now')">立即发布</label><label class="flex items-center gap-2 text-xs"><input type="radio" :name="'timing-'+task.id" :checked="!!task.scheduledAt" @change="setTiming(task,'scheduled')">定时发布</label></div><SchedulePicker v-if="task.scheduledAt" v-model="task.scheduledAt" v-model:time-zone="task.timeZone" class="mt-3" :disabled="project.archived || busy" @validity="scheduleValidity[task.id]=$event" /></fieldset>
            </div>
          </div>
        </div>
      </div>
      <details class="group border-t border-slate-100 open:border-t-0">
        <summary class="flex cursor-pointer list-none items-center justify-center gap-2 px-5 py-3 text-xs text-slate-600 group-open:hidden"><span>查看更多</span><ChevronDown class="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
        <div class="space-y-5 px-5 py-4 text-xs text-slate-600">
          <div v-if="taskPlatform(task) === 'tiktok'"><h5 class="mb-2 font-semibold text-slate-800">允许用户</h5><div class="flex flex-wrap gap-5"><label class="flex cursor-pointer items-center gap-2"><input v-model="task.comments" type="checkbox" class="h-4 w-4 accent-[#009bff]">评论</label><label v-if="filmFor(task)?.type === '视频'" class="flex cursor-pointer items-center gap-2"><input v-model="task.duet" type="checkbox" class="h-4 w-4 accent-[#009bff]">合拍</label></div><p class="mt-1 text-[10px] text-slate-400">允许观众评论；视频还可开启合拍。可按单条内容调整。</p></div>
          <div v-if="taskPlatform(task) === 'tiktok'" class="space-y-4">
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.commercial" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">内容披露 · 品牌 / 商业合作</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">当内容推广品牌、产品或服务时开启，向观众说明商业关系。</p></div>
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.ai" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">AI 生成内容</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">内容包含由 AI 生成或显著修改的逼真图像、音频或视频时开启。</p></div>
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.audienceControl" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">受众控制 · 仅限 18 岁及以上</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">开启后，视频仅向成年观众展示。</p></div>
          </div>
          <details class="text-[11px] text-slate-400"><summary class="cursor-pointer">演示测试</summary><label class="mt-2 flex items-center gap-2"><input v-model="task.simulateFailure" type="checkbox">模拟此条首次发布失败</label></details>
        </div>
        <button type="button" class="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-600" @click="($event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')">收起<ChevronDown class="h-3.5 w-3.5 rotate-180" /></button>
      </details>
    </section>
        <div class="w-full max-w-[280px] justify-self-center md:mt-[81px] md:justify-self-end"><p class="mb-2 text-center text-xs text-slate-500">{{ platformName(taskPlatform(task)) }} · 模拟预览</p>
          <button class="relative block aspect-[9/16] w-full overflow-hidden rounded-[28px] border-[5px] border-slate-900 bg-black text-left text-white shadow-lg" :aria-label="platformName(taskPlatform(task)) + ' 信息流预览，点击查看视频'" @click="openPreview(task)">
            <img v-if="filmFor(task)?.type === '视频'" :src="coverFor(task)" alt="视频画面预览" class="absolute inset-0 h-full w-full object-cover">
            <img v-else-if="imageUrls[task.id]?.[0]" :src="imageUrls[task.id]?.[0]?.url" alt="图文首图封面预览" class="absolute inset-0 h-full w-full object-cover">
            <div v-else class="absolute inset-0 flex items-center justify-center px-5 text-center text-xs text-white/70">{{ (task.imageMediaIds ?? []).length ? '图文图片不可用' : '添加图片后预览' }}</div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70"></div>
            <div class="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3 text-[9px] font-semibold"><span>9:41</span><span>●●● ▰</span></div>
            <div v-if="taskPlatform(task) === 'tiktok'" class="absolute inset-x-0 top-9 flex items-center justify-center gap-3 text-[10px] text-white/75"><span>Following</span><span class="border-b border-white pb-1 font-bold text-white">For You</span><Search class="absolute right-3 h-3.5 w-3.5" /></div>
            <div class="absolute bottom-8 left-2.5 right-9 space-y-1.5"><p class="truncate text-[10px] font-semibold">{{ accounts.find(account => account.id === task.accountId)?.handle || '@your_account' }}</p><p class="line-clamp-3 whitespace-pre-line text-[9px] leading-3">{{ captionFor(task) || '视频文案与话题标签将在此显示' }}</p><div class="flex items-center gap-1 text-[8px]"><Music2 class="h-2.5 w-2.5" />{{ task.bgm?.name || (filmFor(task)?.type === '图文' ? '未添加背景音乐' : `原声 · ${accounts.find(account => account.id === task.accountId)?.handle || '原创声音'}`) }}</div></div>
            <div class="absolute bottom-12 right-1.5 flex flex-col items-center gap-3"><span class="grid h-7 w-7 place-items-center rounded-full border border-white/60 bg-black/25 text-[8px]">{{ (accounts.find(account => account.id === task.accountId)?.name || 'R').slice(0, 1) }}</span><span class="flex flex-col items-center"><Heart class="h-4 w-4 fill-white" /><small class="mt-0.5 text-[7px]">—</small></span><span class="flex flex-col items-center"><MessageCircle class="h-4 w-4 fill-white" /><small class="mt-0.5 text-[7px]">—</small></span><Share2 class="h-4 w-4" /></div>
            <div v-if="taskPlatform(task) === 'tiktok'" class="absolute inset-x-0 bottom-0 flex items-center justify-around bg-black/85 px-2 py-2"><House class="h-3 w-3" /><UsersRound class="h-3 w-3" /><span class="grid h-4 w-5 place-items-center rounded border border-white"><Plus class="h-3 w-3" /></span><Inbox class="h-3 w-3" /><UserRound class="h-3 w-3" /></div>
          </button>
        </div>
    </div><p v-if="error" role="alert" class="text-sm text-rose-500">{{ error }}</p><button class="studio-primary" :disabled="project.archived || busy || writingTasks.length > 0 || drafts.some(t=>t.scheduledAt && scheduleValidity[t.id] === false)" @click="submit">{{ busy ? '提交中…' : drafts.every(task => !!task.scheduledAt) ? '定时发布' : drafts.every(task => !task.scheduledAt) ? '立即发布' : '提交发布' }}</button></template></div></section>



</template>

<style scoped>
.schedule-input::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 0;
  width: 28px;
  height: 100%;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
