<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Upload, Search, CheckCircle2, ArrowLeft, Sparkles, ChevronDown } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { studio, blankAttributes, ensurePublishTask, submitPublish } from '@/services/studio';
import { currentUser } from '@/services/identity';
import { saveMedia } from '@/services/media';
import { uid, now } from '@/services/storage';
import type { Film, PublishTask } from '@/types/studio';
import { toast } from 'vue-sonner';
import FilmPreview from './FilmPreview.vue';
import FilmLibrary from './FilmLibrary.vue';
const preview = ref<Film | null>(null);
function filmFor(task: PublishTask) { return studio.value.films.find(f => f.id === task.filmId); }
function coverFor(task: PublishTask) { return `/images/creation-covers/cover-${(Array.from(task.filmId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3) + 1}.jpg`; }


function localTime(value: string) { return new Date(new Date(value).getTime()+8*3600000).toISOString().slice(0,16); }
function setTiming(task: PublishTask, mode: string) { task.scheduledAt = mode === 'now' ? '' : new Date(Date.now()+3600000).toISOString(); }
function setDate(task: PublishTask, value: string) { if (!value) return; task.scheduledAt = new Date(value+'+08:00').toISOString(); }
const props = defineProps<{ projectId: string }>();
const router = useRouter();
const route = useRoute();
const tab = computed({
  get: () => route.query.tab === 'configure' ? 'configure' : route.query.tab === 'records' ? 'records' : 'creations',
  set: (value: string) => { void router.replace({ query: { ...route.query, tab: value, task: undefined } }); },
});
const query = ref('');
const status = ref('all');
const selected = ref<string[]>([]);

const drafts = ref<PublishTask[]>([]);
const review = ref(false);
const consent = ref(false);
const busy = ref(false);
const error = ref('');
const suggestion = ref('');
const suggestionTask = ref('');
const detail = ref<PublishTask | null>(null);
const scheduleTask = ref('');
const scheduleTime = ref('');
const uploading = ref(false);

const project = computed(() => studio.value.projects.find(p => p.id === props.projectId)!);
const accounts = computed(() => studio.value.accounts.filter(a => project.value.accountIds.includes(a.id) && a.status === '已授权'));
const mutable = (task?: PublishTask) => !task || ['待配置', '发布失败', '已取消'].includes(task.status);
const tasks = computed(() => studio.value.tasks.filter(t => t.projectId === props.projectId && t.status !== '待配置' && t.title.toLowerCase().includes(query.value.toLowerCase()) && (status.value === 'all' || t.status === status.value)));
const batches = computed(() => [...new Set(tasks.value.map(t => t.batchId).filter(Boolean))].map(id => ({ id, tasks: tasks.value.filter(t => t.batchId === id) })));

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
function configure(ids: string[]) {
  drafts.value = ids.map(id => studio.value.films.find(f => f.id === id)).filter((f): f is Film => !!f).map(ensurePublishTask).filter(mutable).map(t => JSON.parse(JSON.stringify(t)));
  if (!drafts.value.length) { toast.info('所选成片已有执行中的任务'); return; }
  error.value = ''; review.value = false; consent.value = false;
  void router.push({ query: { ...route.query, tab: 'configure', task: drafts.value.map(t => t.id) } });
}
async function submit() {
  busy.value = true; error.value = '';
  try {
    await submitPublish(drafts.value);
    drafts.value.forEach(draft => { const task = studio.value.tasks.find(t => t.id === draft.id); if (task) Object.assign(task, draft); });
    selected.value = []; tab.value = 'records'; toast.success('发布任务已提交，等待平台确认（演示）');
  } catch (e) { error.value = (e as Error).message; review.value = false; }
  finally { busy.value = false; }
}
function retry(task: PublishTask) {
  configure([task.filmId]);
}
function backToCreations() { tab.value = 'creations'; }
watch(() => [route.query.tab, route.query.task], () => {
  if (tab.value !== 'configure') return;
  const ids = Array.isArray(route.query.task) ? route.query.task : [route.query.task];
  drafts.value = studio.value.tasks.filter(t => t.projectId === props.projectId && ids.includes(t.id) && mutable(t)).map(t => JSON.parse(JSON.stringify({ ...t, scheduledAt: t.status === '待配置' ? t.scheduledAt : '', error: '' })));
  review.value = false; consent.value = false; error.value = '';
}, { immediate: true });
watch(drafts, values => {
  for (const draft of values) {
    const task = studio.value.tasks.find(t => t.id === draft.id);
    if (task && mutable(task)) Object.assign(task, JSON.parse(JSON.stringify(draft)));
  }
}, { deep: true });
function cancel(task: PublishTask) { if (['待发布', '已排期'].includes(task.status)) task.status = '已取消'; }
function propose(task: PublishTask, kind: string) { suggestionTask.value = task.id; suggestion.value = kind === 'tags' ? '#好物分享 #品牌日常 #真实体验' : kind === 'expand' ? `${task.title}。从日常生活中的一个小细节，发现更轻松的使用体验。` : `换个角度看生活｜${task.title}`; }
function acceptSuggestion() { const task = drafts.value.find(d => d.id === suggestionTask.value); if (task) { if (suggestion.value.startsWith('#')) task.tags = suggestion.value; else task.title = suggestion.value; } suggestion.value = ''; }
function reschedule() { const task = studio.value.tasks.find(t => t.id === scheduleTask.value); const time = new Date(scheduleTime.value+'+08:00').getTime(); if (!task || !Number.isFinite(time) || time <= Date.now()) { toast.error('请选择未来时间'); return; } task.scheduledAt = new Date(time).toISOString(); task.dueAt = time; scheduleTask.value = ''; toast.success('排期已更新'); }
</script>
<template>
  <div class="space-y-5">

    <FilmLibrary v-if="tab === 'creations'" v-model:selected="selected" :project-id="projectId" @publish="configure">
      <template #navigation><nav aria-label="视频管理记录" class="inline-flex shrink-0 items-center gap-1 h-10 rounded-xl bg-slate-100 p-1"><button v-for="item in [{ key: 'creations', label: '创作记录' }, { key: 'records', label: '发布记录' }]" :key="item.key" type="button" :aria-pressed="tab === item.key" class="h-8 rounded-lg px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" :class="tab === item.key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'" @click="tab = item.key">{{ item.label }}</button></nav></template>
      <template #upload><label class="studio-primary cursor-pointer"><Upload class="h-4 w-4" />{{ uploading ? '上传中…' : '上传视频 / 图文' }}<input class="hidden" type="file" accept="video/*,image/*" multiple :disabled="uploading || project.archived" @change="upload"></label></template>
    </FilmLibrary>
    <div v-if="tab === 'records'" class="flex flex-wrap items-center gap-3"><nav aria-label="视频管理记录" class="inline-flex shrink-0 items-center gap-1 h-10 rounded-xl bg-slate-100 p-1"><button v-for="item in [{ key: 'creations', label: '创作记录' }, { key: 'records', label: '发布记录' }]" :key="item.key" type="button" :aria-pressed="tab === item.key" class="h-8 rounded-lg px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" :class="tab === item.key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'" @click="tab = item.key">{{ item.label }}</button></nav><div class="relative ml-auto w-56"><Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input v-model="query" class="studio-field pl-9" placeholder="搜索成片或发布文案"></div><select v-model="status" class="studio-field !w-40"><option value="all">全部发布状态</option><option v-for="item in ['待配置','待发布','已排期','发布中','发布成功','发布失败','已取消']" :key="item">{{ item }}</option></select><span class="ml-auto self-center text-[11px] text-slate-400">时区：Asia/Shanghai（UTC+8）</span></div>
    <div v-if="tab === 'records' && !project.accountIds.length" class="flex items-center justify-between rounded-xl bg-amber-50 p-4 text-xs text-amber-700">项目还没有关联帐号，请先到项目设置中选择。<button class="underline" @click="router.push({ query: { section: 'settings' } })">关联帐号 →</button></div>
    <template v-if="tab === 'records'"><div v-if="batches.length" class="flex flex-wrap gap-3"><div v-for="batch in batches.slice(0, 3)" :key="batch.id" class="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">批次 {{ batch.id.slice(0, 6) }} · 成功 {{ batch.tasks.filter(t => t.status === '发布成功').length }} / 失败 {{ batch.tasks.filter(t => t.status === '发布失败').length }} / 进行中 {{ batch.tasks.filter(t => ['待发布','已排期','发布中'].includes(t.status)).length }}</div></div><div class="overflow-auto rounded-2xl border border-slate-200"><table class="studio-table"><thead><tr><th>内容</th><th>发布帐号</th><th>发布状态</th><th>排期 / 提交时间</th><th>操作</th></tr></thead><tbody><tr v-for="task in tasks" :key="task.id"><td><button class="max-w-56 truncate text-left font-medium text-slate-800" @click="detail = task">{{ task.title }}</button><p class="mt-1 text-[10px] text-slate-400">{{ task.batchId.slice(0, 8) }} · 第 {{ task.attempt }} 次提交</p></td><td>{{ studio.accounts.find(a => a.id === task.accountId)?.handle ?? '已移除帐号' }}</td><td><span class="studio-badge" :class="task.status === '发布成功' ? '!bg-emerald-50 !text-emerald-600' : task.status === '发布失败' ? '!bg-rose-50 !text-rose-500' : ''">{{ task.status }}</span><p v-if="task.error" class="mt-2 max-w-48 text-[11px] text-rose-500">{{ task.error }}</p><p v-if="task.status === '发布中'" class="mt-1 text-[10px] text-slate-400">上传完成，等待平台确认</p></td><td>{{ new Date(task.scheduledAt || task.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) }}</td><td class="whitespace-nowrap"><button class="mr-3 text-sky-600" @click="detail = task">详情</button><button v-if="['发布失败','已取消'].includes(task.status)" class="mr-3 text-sky-600" @click="retry(task)">重新配置</button><button v-if="task.status === '已排期'" class="mr-3 text-sky-600" @click="scheduleTask = task.id">改期</button><button v-if="['待发布','已排期'].includes(task.status)" class="text-slate-400" @click="cancel(task)">取消</button></td></tr></tbody></table><p v-if="!tasks.length" class="py-16 text-center text-sm text-slate-400">暂无发布记录</p></div></template>
    <p v-if="tab !== 'configure'" class="text-[11px] text-slate-400">演示模式 · 支持预览、下载与发布配置；实际发布需接入 TikTok 官方服务</p>
  </div>
  <FilmPreview :film="preview" @close="preview=null" />
  <section v-if="tab === 'configure'" class="mx-auto max-w-[1100px] space-y-5" aria-label="发布配置页面">
    <div class="flex items-center gap-3"><button class="studio-btn !px-3" aria-label="返回创作记录" @click="backToCreations"><ArrowLeft class="h-4 w-4" />返回</button><span class="text-sm text-slate-400">视频管理 / {{ review ? '发布前确认' : '配置发布' }}</span></div>
    <div class="p-1 sm:p-3">
    <h2 class="text-lg font-semibold text-slate-800">{{ review ? '发布前确认' : '配置发布' }} · {{ drafts.length }} 条成片</h2><p class="mb-4 mt-2 text-xs text-slate-400">逐条确认帐号与发布内容，AI 助手帮你优化文案。修改自动保存。</p>
    <div v-if="!drafts.length" class="py-12 text-center text-sm text-slate-400">没有可配置的发布任务<button class="ml-3 text-sky-600" @click="backToCreations">返回创作记录</button></div><template v-if="drafts.length && !review"><section v-for="(task, index) in drafts" :key="task.id" class="my-4 overflow-hidden rounded-2xl bg-slate-50">
      <header class="flex items-center gap-3 bg-slate-100/80 px-5 py-3">
        <span class="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11a3fd] to-[#1769ff] px-2 text-lg font-bold tabular-nums text-white" :aria-label="`第 ${index + 1} 条视频`">{{ index + 1 }}</span>
        <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800" :title="filmFor(task)?.title">{{ filmFor(task)?.title }}</h3>
        <span class="shrink-0 text-xs text-slate-400">{{ filmFor(task)?.type }} · {{ filmFor(task)?.duration }}s</span>
      </header>
      <div class="grid gap-5 p-5 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div class="flex gap-3 sm:block">
          <button class="relative h-[150px] w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100" aria-label="预览待发布内容" @click="preview = filmFor(task) ?? null"><img :src="coverFor(task)" alt="视频封面示意" class="h-full w-full object-cover"><span class="absolute inset-x-0 bottom-0 bg-black/45 py-1.5 text-[11px] text-white">预览视频</span></button>
          <div class="block self-end sm:mt-2"><span class="studio-label">封面</span><div class="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-500">暂不支持选择封面</div><span class="mt-1 block text-[10px] text-slate-400">将使用视频默认封面</span></div>
        </div>
        <div class="min-w-0 space-y-3">
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 focus-within:border-sky-300">
            <div class="flex items-center justify-between px-3 pt-2.5"><label :for="`caption-${task.id}`" class="text-xs font-semibold text-slate-700">发布文案 <span class="text-sky-500">*</span></label><span class="text-[10px] text-slate-400">{{ task.title.length }}/2200</span></div>
            <textarea :id="`caption-${task.id}`" v-model="task.title" class="block h-[76px] w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-700 outline-none" maxlength="2200" placeholder="描述视频亮点，让更多人发现你的内容" />
            <div class="flex flex-wrap items-center gap-3 border-t border-slate-200/60 bg-white/70 px-3 py-2 text-xs"><span class="flex items-center gap-1 text-sky-600"><Sparkles class="h-3.5 w-3.5" />AI 助手</span><button class="text-slate-600 hover:text-sky-600" @click="propose(task, 'rewrite')">改写文案</button><button class="text-slate-600 hover:text-sky-600" @click="propose(task, 'expand')">扩写文案</button><button class="text-slate-600 hover:text-sky-600" @click="propose(task, 'tags')">推荐标签</button></div>
          </div>
          <input v-model="task.tags" class="studio-field !h-9 !text-xs" placeholder="# 添加话题标签" aria-label="话题标签">
          <div class="grid gap-3 min-[1100px]:grid-cols-3 sm:grid-cols-2">
            <label><span class="studio-label">发布帐号 *</span><select v-model="task.accountId" class="studio-field !h-9 !text-xs"><option value="">请选择帐号</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }} · {{ account.handle }}</option></select></label>
            <label><span class="studio-label">谁可以观看 *</span><select v-model="task.privacy" class="studio-field !h-9 !text-xs"><option value="">请选择可见范围</option><option value="PUBLIC_TO_EVERYONE">所有人</option><option value="MUTUAL_FOLLOW_FRIENDS">互相关注的好友</option><option value="SELF_ONLY">仅自己</option></select></label>
            <label><span class="studio-label">发布时间</span><select :value="task.scheduledAt ? 'scheduled' : 'now'" class="studio-field !h-9 !text-xs" @change="setTiming(task, ($event.target as HTMLSelectElement).value)"><option value="now">立即发布</option><option value="scheduled">定时发布 · UTC+8</option></select></label>
            <label v-if="task.scheduledAt" class="sm:col-span-2"><span class="studio-label">定时时间（北京时间）</span><input :value="localTime(task.scheduledAt)" type="datetime-local" class="studio-field !h-9" @change="setDate(task, ($event.target as HTMLInputElement).value)"></label>
          </div>
        </div>
      </div>
      <details class="group border-t border-white/80">
        <summary class="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs text-slate-500"><span>更多设置 <span class="ml-2 text-slate-400">互动权限 · 内容披露</span></span><ChevronDown class="h-3.5 w-3.5 transition-transform group-open:rotate-180" /></summary>
        <div class="space-y-4 px-5 pb-4 text-xs text-slate-600">
          <div class="flex flex-wrap items-center gap-5"><span class="w-16 text-slate-400">允许互动</span><label class="flex items-center gap-2"><input v-model="task.comments" type="checkbox">评论</label><template v-if="filmFor(task)?.type === '视频'"><label class="flex items-center gap-2"><input v-model="task.duet" type="checkbox">合拍</label><label class="flex items-center gap-2"><input v-model="task.stitch" type="checkbox">拼接</label></template><label v-else class="flex items-center gap-2"><input v-model="task.photoMusic" type="checkbox">自动添加图文音乐</label></div>
          <div class="flex flex-wrap items-center gap-5"><span class="w-16 text-slate-400">内容披露</span><label class="flex items-center gap-2"><input v-model="task.ai" type="checkbox">AI 生成内容</label><label class="flex items-center gap-2"><input v-model="task.commercial" type="checkbox">品牌 / 商业合作</label></div>
          <details class="text-[11px] text-slate-400"><summary class="cursor-pointer">演示测试</summary><label class="mt-2 flex items-center gap-2"><input v-model="task.simulateFailure" type="checkbox">模拟此条首次发布失败</label></details>
        </div>
      </details>
    </section><p v-if="error" role="alert" class="text-sm text-rose-500">{{ error }}</p><button class="studio-primary" @click="review = true">预览并确认发布</button></template><template v-else-if="drafts.length"><div class="space-y-3"><div v-for="task in drafts" :key="task.id" class="rounded-xl border p-4"><h3 class="font-semibold">{{ studio.accounts.find(a => a.id === task.accountId)?.handle ?? '未选择帐号' }}</h3><p class="my-2 whitespace-pre-wrap text-sm">{{ task.title }} {{ task.tags }}</p><p class="text-xs text-slate-400">{{ task.privacy || '未选择可见范围' }} · {{ task.scheduledAt ? new Date(task.scheduledAt).toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'}) : '立即发布' }} · {{ task.ai ? 'AI 内容' : '非 AI 内容' }} · {{ task.commercial ? '商业合作' : '无商业披露' }}</p></div></div><label class="my-5 flex items-center gap-2 text-sm text-slate-600"><input v-model="consent" type="checkbox">我已确认以上帐号、内容、可见范围与披露设置</label><div class="flex gap-3"><button class="studio-btn" @click="review = false">返回修改</button><button class="studio-primary" :disabled="!consent || busy" @click="submit">{{ busy ? '提交中…' : '确认提交发布' }}</button></div></template></div></section>
  <Dialog :open="!!suggestion" @update:open="!$event && (suggestion = '')"><DialogContent class="max-w-lg bg-white p-6"><DialogTitle>AI 文案建议</DialogTitle><DialogDescription>确认采用后才会替换原文案。</DialogDescription><textarea v-model="suggestion" class="studio-field h-32 py-3" /><button class="studio-primary" @click="acceptSuggestion">采用建议</button></DialogContent></Dialog>
  <Dialog :open="!!scheduleTask" @update:open="!$event && (scheduleTask = '')"><DialogContent class="max-w-md bg-white p-6"><DialogTitle>调整发布时间</DialogTitle><DialogDescription>请输入未来的北京时间。</DialogDescription><input v-model="scheduleTime" type="datetime-local" class="studio-field"><button class="studio-primary" @click="reschedule">保存排期</button></DialogContent></Dialog>
  <Dialog :open="!!detail" @update:open="!$event && (detail = null)"><DialogContent class="max-w-lg bg-white p-6"><DialogTitle>发布详情</DialogTitle><DialogDescription>每条任务仅对应一个平台帐号。</DialogDescription><div v-if="detail" class="space-y-4 text-sm text-slate-600"><p>{{ detail.title }} {{ detail.tags }}</p><p>状态：{{ detail.status }}</p><p>帐号：{{ studio.accounts.find(a => a.id === detail?.accountId)?.handle }}</p><p>内容 ID：{{ detail.platformId ?? '等待平台确认' }}</p><p v-if="detail.error" class="text-rose-500">{{ detail.error }}</p><button v-if="detail.status === '发布成功'" class="studio-primary" @click="detail = null; router.push({ query: { section: 'analytics' } })"><CheckCircle2 class="h-4 w-4" />查看数据</button></div></DialogContent></Dialog>
</template>
