<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Upload, Search, ArrowLeft, Sparkles, ChevronDown, Clock3, CalendarDays, Loader2, Heart, MessageCircle, Share2, Music2, House, UsersRound, Inbox, UserRound, Plus, X, GripVertical } from 'lucide-vue-next';
import { studio, blankAttributes, ensurePublishTask, submitPublish } from '@/services/studio';
import { currentUser } from '@/services/identity';
import { getMedia, saveMedia } from '@/services/media';
import { uid, now } from '@/services/storage';
import type { Film, PublishTask } from '@/types/studio';
import { toast } from 'vue-sonner';
import FilmPreview from './FilmPreview.vue';
import VideoManagement from './VideoManagement.vue';
import InfoTip from './InfoTip.vue';
const preview = ref<Film | null>(null);
function filmFor(task: PublishTask) { return studio.value.films.find(f => f.id === task.filmId); }
function coverFor(task: PublishTask) { return `/images/creation-covers/cover-${(Array.from(task.filmId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3) + 1}.jpg`; }


function localTime(value: string) { return new Date(new Date(value).getTime()+8*3600000).toISOString().slice(0,16); }
function setTiming(task: PublishTask, mode: string) { task.scheduledAt = mode === 'now' ? '' : new Date(Date.now()+3600000).toISOString(); }
function setDate(task: PublishTask, value: string) { if (!value) return; task.scheduledAt = new Date(value+'+08:00').toISOString(); }
function updateSchedulePart(task: PublishTask, part: 'date' | 'time', value: string) {
  if (!value) return;
  const current = task.scheduledAt ? localTime(task.scheduledAt) : localTime(new Date(Date.now() + 3600000).toISOString());
  const [date, time] = current.split('T');
  const next = part === 'date' ? `${value}T${time}` : `${date}T${value}`;
  setDate(task, next);
}
const props = defineProps<{ projectId: string }>();
const router = useRouter();
const route = useRoute();
const tab = computed({
  get: () => route.query.tab === 'configure' ? 'configure' : route.query.tab === 'records' ? 'records' : 'creations',
  set: (value: string) => { void router.replace({ query: { section: 'publish', tab: value, view: route.query.view, size: route.query.size } }); },
});

const drafts = ref<PublishTask[]>([]);
const busy = ref(false);
const error = ref('');
const writingTasks = ref<string[]>([]);
const uploading = ref(false);
const imageUrls = ref<Record<string, { id: string; url: string }[]>>({});
const imageSourceSelection = ref<Record<string, string>>({});
const musicSearch = ref<Record<string, string>>({});
const imageBusy = ref<Record<string, boolean>>({});
const bgmTracks = [
  { id: 'roxy-calm', name: 'Soft Morning', artist: 'Roxy Library' },
  { id: 'roxy-pop', name: 'Daily Glow', artist: 'Roxy Library' },
  { id: 'roxy-acoustic', name: 'Little Moments', artist: 'Roxy Library' },
  { id: 'roxy-beat', name: 'Fresh Start', artist: 'Roxy Library' },
];

const project = computed(() => studio.value.projects.find(p => p.id === props.projectId)!);
const accounts = computed(() => studio.value.accounts.filter(a => !a.deleted && project.value.accountIds.includes(a.id) && a.status === '已授权'));
const mutable = (task?: PublishTask) => !task || ['待配置', '发布失败', '已取消'].includes(task.status);
async function upload(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  if (!files.length) return;
  uploading.value = true;
  try {
    const isVideo = files.every(f => f.type.startsWith('video/'));
    const isImage = files.every(f => f.type.startsWith('image/'));
    if (!isVideo && !isImage) throw new Error('请一次上传视频，或一次上传图片组成图文');
    const groups = isImage ? [files] : files.map(f => [f]);
    for (const groupFiles of groups) {
      const mediaIds: string[] = [];
      for (const file of groupFiles) mediaIds.push(await saveMedia(currentUser.value!.id, file));
      const film: Film = { id: uid(), projectId: props.projectId, title: groupFiles[0]!.name.replace(/\.[^.]+$/, ''), type: isVideo ? '视频' : '图文', source: '本地上传', createdAt: now(), duration: '15', ratio: '9:16', quality: '原始', brief: '本地上传媒体', productIds: [], version: 1, mediaIds, inPublishing: true, attributes: blankAttributes() };
      studio.value.films.unshift(film);
      ensurePublishTask(film);
    }
    toast.success('上传完成，媒体已保存在本机浏览器');
  } catch (e) { toast.error((e as Error).message); }
  finally { uploading.value = false; (event.target as HTMLInputElement).value = ''; }
}
function configure(ids: string[], taskIds: string[] = []) {
  drafts.value = ids.map(id => studio.value.films.find(f => f.id === id)).filter((f): f is Film => !!f).map(f => { const task = studio.value.tasks.find(t => t.filmId === f.id && taskIds.includes(t.id) && mutable(t)); return task ?? ensurePublishTask(f); }).filter(mutable).map(t => { const copy = JSON.parse(JSON.stringify(t)) as PublishTask; const film = filmFor(copy); if (film?.type === '图文') copy.imageMediaIds ??= [...film.mediaIds]; return copy; });
  if (!drafts.value.length) { toast.info('所选成片已有执行中的任务'); return; }
  error.value = '';
  void router.push({ query: { ...route.query, tab: 'configure', from: tab.value, task: drafts.value.map(t => t.id) } });
}
async function submit() {
  if (busy.value || writingTasks.value.length) return;
  busy.value = true; error.value = '';
  try {
    await submitPublish(drafts.value);
    drafts.value.forEach(draft => { const task = studio.value.tasks.find(t => t.id === draft.id); if (task) Object.assign(task, draft); });
    tab.value = 'records'; toast.success(drafts.value.every(t=>t.status==='已排期')?'定时发布任务已排期（演示）':'发布任务已提交，等待平台确认（演示）');
  } catch (e) { error.value = (e as Error).message; }
  finally { busy.value = false; }
}
function backToCreations() { void router.replace({ query: { ...route.query, tab: route.query.from === 'records' ? 'records' : 'creations', task: undefined, from: undefined } }); }
watch(() => [route.query.tab, route.query.task], () => {
  if (tab.value !== 'configure') return;
  const ids = Array.isArray(route.query.task) ? route.query.task : [route.query.task];
  drafts.value = studio.value.tasks.filter(t => t.projectId === props.projectId && ids.includes(t.id) && mutable(t)).map(t => { const copy = JSON.parse(JSON.stringify({ ...t, privacy: t.privacy || 'PUBLIC_TO_EVERYONE', scheduledAt: t.status === '待配置' ? t.scheduledAt : '', error: '' })) as PublishTask; const film = filmFor(copy); if (film?.type === '图文') copy.imageMediaIds ??= [...film.mediaIds]; return copy; });
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
onBeforeUnmount(() => Object.values(imageUrls.value).flat().forEach(item => URL.revokeObjectURL(item.url)));
function addWorkImages(task: PublishTask) {
  const film = studio.value.films.find(f => f.id === imageSourceSelection.value[task.id]);
  if (!film || film.type !== '图文') return;
  const ids = task.imageMediaIds ??= [...(filmFor(task)?.mediaIds ?? [])];
  const next = film.mediaIds.filter(id => !ids.includes(id));
  if (!next.length) { toast.info('这些图片已添加'); return; }
  task.imageMediaIds = [...ids, ...next];
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
async function uploadBgm(task: PublishTask, event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  if (!file.type.startsWith('audio/')) { toast.error('请选择音频文件'); input.value = ''; return; }
  try { task.bgm = { source: 'local', name: file.name, mediaId: await saveMedia(currentUser.value!.id, file) }; }
  catch (cause) { toast.error((cause as Error).message); }
  finally { input.value = ''; }
}
function captionFor(task: PublishTask) { return [task.title, task.tags].filter(Boolean).join('\n'); }
function updateCaption(task: PublishTask, value: string) { task.title = value.slice(0, 2200); }
function openPreview(task: PublishTask) {
  const film = filmFor(task);
  if (!film) return;
  preview.value = film.type === '图文' ? { ...film, mediaIds: [...(task.imageMediaIds ?? film.mediaIds)] } : film;
}
async function helpWrite(task: PublishTask) {
  const input = task.title.trim();
  if (!input || writingTasks.value.includes(task.id)) return;
  writingTasks.value.push(task.id);
  try {
    await new Promise(resolve => setTimeout(resolve, 900));
    const body = input.replace(/#[^\s#]+/g, '').trim();
    updateCaption(task, `${body}\n发现日常里的小惊喜，分享值得体验的美好。`);
    const tags = [task.tags, input].join(' ').match(/#[^\s#]+/g) ?? [];
    task.tags = [...new Set([...tags, '#好物分享', '#真实体验', '#生活灵感'])].join(' ');
  } finally {
    writingTasks.value = writingTasks.value.filter(id => id !== task.id);
  }
}

</script>
<template>
  <VideoManagement v-if="tab !== 'configure'" :project-id="projectId" :published="tab==='records'" @publish="configure">
    <template #upload><label class="studio-primary cursor-pointer"><Upload class="h-4 w-4" />{{uploading?'上传中…':'上传视频 / 图文'}}<input class="hidden" type="file" accept="video/*,image/*" multiple :disabled="uploading||project.archived" @change="upload"></label></template>
  </VideoManagement>
  <FilmPreview :film="preview" @close="preview=null" />
  <section v-if="tab === 'configure'" class="w-full space-y-5" aria-label="发布配置页面">
    <header class="flex items-start gap-3"><button class="studio-btn !px-3 !text-xs !font-normal" aria-label="返回上一个页面" @click="backToCreations"><ArrowLeft class="h-4 w-4" />返回</button><div><h1 class="text-lg font-normal text-slate-800">配置发布</h1><p class="mt-2 text-xs text-slate-400">共 {{ drafts.length }} 条成片 · 逐条确认帐号与发布内容，修改自动保存。</p></div></header>
    <div>
    <div v-if="!drafts.length" class="py-12 text-center text-sm text-slate-400">没有可配置的发布任务<button class="ml-3 text-sky-600" @click="backToCreations">返回创作记录</button></div><template v-if="drafts.length"><div v-for="(task, index) in drafts" :key="task.id" class="mb-4 mt-4 grid items-start gap-6 [&+div]:mt-9 md:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_280px]"><section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header class="flex items-center gap-3 bg-slate-100/80 px-5 py-3">
        <span class="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11a3fd] to-[#1769ff] px-2 text-lg font-bold tabular-nums text-white" :aria-label="`第 ${index + 1} 条视频`">{{ index + 1 }}</span>
        <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800" :title="filmFor(task)?.title">{{ filmFor(task)?.title }}</h3>
        <span class="shrink-0 text-xs text-slate-400">{{ filmFor(task)?.type }}<template v-if="filmFor(task)?.type === '视频'"> · {{ filmFor(task)?.duration }}s</template><template v-else> · {{ (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).length }} 张图片</template></span>
      </header>
      <div class="p-5">
        <div class="order-1 min-w-0 space-y-[17px]">
          <section v-if="filmFor(task)?.type === '图文'" class="space-y-3 rounded-xl bg-slate-50 p-3" aria-label="图文图片与背景音乐">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div><h4 class="text-xs font-semibold text-slate-800">图文图片 <span class="font-normal text-slate-400">{{ (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).length }} 张 · 首张为封面</span></h4></div>
              <div class="flex items-center gap-2">
                <select v-model="imageSourceSelection[task.id]" class="studio-field !h-8 !w-40 !bg-white !text-xs" :aria-label="`从作品选择图片 ${index + 1}`">
                  <option value="">从作品选择</option>
                  <option v-for="work in studio.films.filter(item => item.projectId === projectId && item.type === '图文' && item.id !== filmFor(task)?.id && item.mediaIds.length)" :key="work.id" :value="work.id">{{ work.title }} · {{ work.mediaIds.length }} 张</option>
                </select>
                <button type="button" class="studio-btn !h-8 !px-2.5 !text-xs" @click="addWorkImages(task)"><Plus class="h-3.5 w-3.5" />添加</button>
                <label class="studio-btn !h-8 !cursor-pointer !px-2.5 !text-xs"><Upload class="h-3.5 w-3.5" />{{ imageBusy[task.id] ? '上传中' : '本地上传' }}<input type="file" accept="image/*" multiple class="hidden" :disabled="imageBusy[task.id]" @change="uploadTaskImages(task, $event)"></label>
              </div>
            </div>
            <div v-if="(task.imageMediaIds ?? filmFor(task)?.mediaIds ?? []).length" class="flex flex-wrap gap-2">
              <div v-for="(id, imageIndex) in (task.imageMediaIds ?? filmFor(task)?.mediaIds ?? [])" :key="id" draggable="true" class="group relative h-24 w-[68px] cursor-grab overflow-hidden rounded-lg bg-slate-200 active:cursor-grabbing" :aria-label="`第 ${imageIndex + 1} 张图片`" @dragstart="($event.dataTransfer?.setData('text/plain', id))" @dragover.prevent @drop.prevent="moveTaskImage(task, $event.dataTransfer?.getData('text/plain') || '', id)">
                <img v-if="imageUrls[task.id]?.find(item => item.id === id)" :src="imageUrls[task.id]?.find(item => item.id === id)?.url" :alt="`图文图片 ${imageIndex + 1}`" class="h-full w-full object-cover">
                <span v-else class="grid h-full place-items-center px-1 text-center text-[10px] text-slate-500">媒体缺失</span>
                <span v-if="imageIndex === 0" class="absolute inset-x-0 bottom-0 bg-sky-600/90 py-1 text-center text-[9px] font-medium text-white">封面</span>
                <button type="button" class="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100" :aria-label="`移除第 ${imageIndex + 1} 张图片`" @click="removeTaskImage(task, id)"><X class="h-3 w-3" /></button>
                <GripVertical class="absolute left-1 top-1 h-3.5 w-3.5 text-white drop-shadow" />
              </div>
            </div>
            <p v-else class="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400">添加一张或多张图片，可拖动调整顺序。第一张图片将作为封面。</p>
            <div class="border-t border-slate-200 pt-3">
              <div class="flex flex-wrap items-center gap-2">
                <Music2 class="h-4 w-4 text-sky-600" /><span class="text-xs font-semibold text-slate-700">背景音乐 <span class="font-normal text-slate-400">可选</span></span>
                <select class="studio-field !h-8 !min-w-44 !bg-white !text-xs" :value="task.bgm?.source === 'library' ? task.bgm.id : ''" :aria-label="`选择背景音乐 ${index + 1}`" @change="(task.bgm = ($event.target as HTMLSelectElement).value ? { source: 'library', id: ($event.target as HTMLSelectElement).value, name: bgmTracks.find(track => track.id === ($event.target as HTMLSelectElement).value)?.name || '' } : undefined)">
                  <option value="">从模拟曲库选择</option>
                  <option v-for="track in bgmTracks.filter(track => `${track.name} ${track.artist}`.toLowerCase().includes((musicSearch[task.id] || '').toLowerCase()))" :key="track.id" :value="track.id">{{ track.name }} · {{ track.artist }}</option>
                </select>
                <input v-model="musicSearch[task.id]" class="studio-field !h-8 !w-28 !bg-white !text-xs" placeholder="搜索曲库" :aria-label="`搜索背景音乐 ${index + 1}`">
                <label class="studio-btn !h-8 !cursor-pointer !px-2.5 !text-xs"><Upload class="h-3.5 w-3.5" />上传音频<input type="file" accept="audio/*" class="hidden" @change="uploadBgm(task, $event)"></label>
                <span v-if="task.bgm" class="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] text-slate-600"><Music2 class="h-3 w-3 text-sky-600" /><span class="max-w-44 truncate">{{ task.bgm.name }}</span><button type="button" aria-label="移除背景音乐" class="text-slate-400 hover:text-slate-700" @click="task.bgm = undefined"><X class="h-3 w-3" /></button></span>
              </div>
              <p class="mt-1.5 text-[10px] text-slate-400">曲库为演示数据；也可上传本地音频。未选择音乐仍可发布。</p>
            </div>
          </section>
          <label><span class="studio-label">发布帐号<InfoTip text="请选择项目内已授权的 TikTok 帐号，此项必填。" /></span><select v-model="task.accountId" required class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-sky-300"><option value="">请选择帐号</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }} · {{ account.handle }}</option></select></label>
          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label :for="`caption-${task.id}`" class="text-xs font-medium text-slate-500">发布文案</label>
              <button type="button" class="inline-flex items-center gap-1.5 text-xs text-sky-600 disabled:cursor-not-allowed disabled:text-slate-400" :disabled="!task.title.trim() || writingTasks.includes(task.id)" @click="helpWrite(task)"><Loader2 v-if="writingTasks.includes(task.id)" class="h-3.5 w-3.5 animate-spin" /><Sparkles v-else class="h-3.5 w-3.5" />{{ writingTasks.includes(task.id) ? '帮写中…' : 'AI 帮写' }}</button>
            </div>
            <div class="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-300 focus-within:ring-1 focus-within:ring-sky-300" :aria-busy="writingTasks.includes(task.id)">
              <textarea :id="`caption-${task.id}`" :value="task.title" :disabled="writingTasks.includes(task.id)" class="block h-[120px] w-full resize-y bg-transparent px-3 pt-3 text-sm leading-6 text-slate-700 outline-none disabled:opacity-60" maxlength="2200" placeholder="描述视频亮点，也可输入想法让 AI 帮写" @input="updateCaption(task, ($event.target as HTMLTextAreaElement).value)" />
              <div class="px-3 pb-2.5 text-right text-[10px] text-slate-400">{{ task.title.length }}/2200</div>
            </div>
          </div>
          <label class="block"><span class="studio-label">话题标签</span><input v-model="task.tags" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-1 focus:ring-sky-300" placeholder="# 添加话题标签" aria-label="话题标签"></label>
          <div class="pt-4">
            <h4 class="mb-3 text-sm font-semibold text-slate-800">设置</h4>
            <div class="grid gap-x-3 gap-y-[17px] min-[1100px]:grid-cols-2">
              <label><span class="studio-label">谁可以观看<InfoTip text="发布后可见范围由此设置决定。" /></span><select v-model="task.privacy" class="studio-field !h-9 !text-xs"><option value="PUBLIC_TO_EVERYONE">所有人</option><option value="MUTUAL_FOLLOW_FRIENDS">互相关注的好友</option><option value="SELF_ONLY">仅自己</option></select></label>
              <fieldset class="min-[1100px]:col-span-2"><legend class="studio-label">什么时候发布<InfoTip text="定时发布使用北京时间；帐号授权和内容状态会在发布前检查。" /></legend><div class="flex flex-wrap items-center gap-4"><label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="radio" :name="`timing-${task.id}`" :checked="!task.scheduledAt" class="accent-[#009bff]" @change="setTiming(task, 'now')">立即发布</label><label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="radio" :name="`timing-${task.id}`" :checked="!!task.scheduledAt" class="accent-[#009bff]" @change="setTiming(task, 'scheduled')">定时发布</label></div><div v-if="task.scheduledAt" class="mt-3 flex flex-wrap gap-2"><div class="relative w-36"><Clock3 class="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" /><input :value="localTime(task.scheduledAt).slice(11,16)" type="time" aria-label="发布时间（北京时间）" class="schedule-input h-9 w-full min-w-0 rounded-lg border-0 bg-slate-100 pl-9 pr-7 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-sky-300" @change="updateSchedulePart(task, 'time', ($event.target as HTMLInputElement).value)"><ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" /></div><div class="relative w-40"><CalendarDays class="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" /><input :value="localTime(task.scheduledAt).slice(0,10)" type="date" aria-label="发布日期（北京时间）" class="schedule-input h-9 w-full min-w-0 rounded-lg border-0 bg-slate-100 pl-9 pr-7 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-sky-300" @change="updateSchedulePart(task, 'date', ($event.target as HTMLInputElement).value)"><ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" /></div></div></fieldset>
            </div>
          </div>
        </div>
      </div>
      <details class="group border-t border-slate-100 open:border-t-0">
        <summary class="flex cursor-pointer list-none items-center justify-center gap-2 px-5 py-3 text-xs text-slate-600 group-open:hidden"><span>查看更多</span><ChevronDown class="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
        <div class="space-y-5 px-5 py-4 text-xs text-slate-600">
          <div><h5 class="mb-2 font-semibold text-slate-800">允许用户</h5><div class="flex flex-wrap gap-5"><label class="flex cursor-pointer items-center gap-2"><input v-model="task.comments" type="checkbox" class="h-4 w-4 accent-[#009bff]">评论</label><label v-if="filmFor(task)?.type === '视频'" class="flex cursor-pointer items-center gap-2"><input v-model="task.duet" type="checkbox" class="h-4 w-4 accent-[#009bff]">合拍</label></div><p class="mt-1 text-[10px] text-slate-400">允许观众评论；视频还可开启合拍。可按单条内容调整。</p></div>
          <div class="space-y-4">
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.commercial" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">内容披露 · 品牌 / 商业合作</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">当内容推广品牌、产品或服务时开启，向观众说明商业关系。</p></div>
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.ai" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">AI 生成内容</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">内容包含由 AI 生成或显著修改的逼真图像、音频或视频时开启。</p></div>
            <div><label class="flex cursor-pointer items-center gap-3"><span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-slate-300 transition has-[:checked]:bg-[#009bff]"><input v-model="task.audienceControl" type="checkbox" class="peer sr-only"><span class="ml-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4"></span></span><span class="font-medium text-slate-800">受众控制 · 仅限 18 岁及以上</span></label><p class="ml-12 mt-1 text-[10px] text-slate-400">开启后，视频仅向成年观众展示。</p></div>
          </div>
          <details class="text-[11px] text-slate-400"><summary class="cursor-pointer">演示测试</summary><label class="mt-2 flex items-center gap-2"><input v-model="task.simulateFailure" type="checkbox">模拟此条首次发布失败</label></details>
        </div>
        <button type="button" class="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-600" @click="($event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')">收起<ChevronDown class="h-3.5 w-3.5 rotate-180" /></button>
      </details>
    </section>
        <div class="w-full max-w-[280px] justify-self-center md:mt-[81px] md:justify-self-end">
          <button class="relative block aspect-[9/16] w-full overflow-hidden rounded-[28px] border-[5px] border-slate-900 bg-black text-left text-white shadow-lg" aria-label="TikTok 信息流预览，点击查看视频" @click="openPreview(task)">
            <img v-if="filmFor(task)?.type === '视频'" :src="coverFor(task)" alt="视频画面预览" class="absolute inset-0 h-full w-full object-cover">
            <img v-else-if="imageUrls[task.id]?.[0]" :src="imageUrls[task.id]?.[0]?.url" alt="图文首图封面预览" class="absolute inset-0 h-full w-full object-cover">
            <div v-else class="absolute inset-0 flex items-center justify-center px-5 text-center text-xs text-white/70">{{ (task.imageMediaIds ?? []).length ? '图文图片不可用' : '添加图片后预览' }}</div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70"></div>
            <div class="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3 text-[9px] font-semibold"><span>9:41</span><span>●●● ▰</span></div>
            <div class="absolute inset-x-0 top-9 flex items-center justify-center gap-3 text-[10px] text-white/75"><span>Following</span><span class="border-b border-white pb-1 font-bold text-white">For You</span><Search class="absolute right-3 h-3.5 w-3.5" /></div>
            <div class="absolute bottom-8 left-2.5 right-9 space-y-1.5"><p class="truncate text-[10px] font-semibold">{{ accounts.find(account => account.id === task.accountId)?.handle || '@your_account' }}</p><p class="line-clamp-3 whitespace-pre-line text-[9px] leading-3">{{ captionFor(task) || '视频文案与话题标签将在此显示' }}</p><div class="flex items-center gap-1 text-[8px]"><Music2 class="h-2.5 w-2.5" />{{ task.bgm?.name || (filmFor(task)?.type === '图文' ? '未添加背景音乐' : `原声 · ${accounts.find(account => account.id === task.accountId)?.handle || '原创声音'}`) }}</div></div>
            <div class="absolute bottom-12 right-1.5 flex flex-col items-center gap-3"><span class="grid h-7 w-7 place-items-center rounded-full border border-white/60 bg-black/25 text-[8px]">{{ (accounts.find(account => account.id === task.accountId)?.name || 'R').slice(0, 1) }}</span><span class="flex flex-col items-center"><Heart class="h-4 w-4 fill-white" /><small class="mt-0.5 text-[7px]">—</small></span><span class="flex flex-col items-center"><MessageCircle class="h-4 w-4 fill-white" /><small class="mt-0.5 text-[7px]">—</small></span><Share2 class="h-4 w-4" /></div>
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-around bg-black/85 px-2 py-2"><House class="h-3 w-3" /><UsersRound class="h-3 w-3" /><span class="grid h-4 w-5 place-items-center rounded border border-white"><Plus class="h-3 w-3" /></span><Inbox class="h-3 w-3" /><UserRound class="h-3 w-3" /></div>
          </button>
        </div>
    </div><p v-if="error" role="alert" class="text-sm text-rose-500">{{ error }}</p><button class="studio-primary" :disabled="busy || writingTasks.length > 0" @click="submit">{{ busy ? '提交中…' : drafts.every(task => !!task.scheduledAt) ? '定时发布' : drafts.every(task => !task.scheduledAt) ? '立即发布' : '提交发布' }}</button></template></div></section>



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
