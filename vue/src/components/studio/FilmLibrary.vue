<script setup lang="ts">
import { computed, ref, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Play, Send, Download, Pencil, LayoutGrid, List, Trash2, RotateCcw, Search } from 'lucide-vue-next';
import { studio, startGeneration, retryGeneration } from '@/services/studio';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import { downloadFile } from '@/services/storage';
import { toast } from 'vue-sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import type { Film } from '@/types/studio';
const emit = defineEmits<{ publish: [ids: string[]] }>();
const selected = defineModel<string[]>('selected', { default: () => [] });
const route = useRoute();
const view = computed({ get: () => route.query.view === 'list' ? 'list' : 'grid', set: (value: string) => { void router.replace({ query: { ...route.query, view: value } }); } });
const canPublish = (film: Film) => studio.value.films.some(f => f.id === film.id) && !studio.value.projects.find(p => p.id === props.projectId)?.archived && !studio.value.tasks.some(t => t.filmId === film.id && !['待配置', '发布失败', '已取消'].includes(t.status));
const props=defineProps<{projectId:string}>(); const router=useRouter(); const query=ref('');const preview=ref<Film|null>(null);const mediaUrl=ref('');
const deleting = ref(false);
const downloading = ref(false);
const searchOpen = ref(false);
const searchDraft = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
async function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) { searchDraft.value = query.value; await nextTick(); searchInput.value?.focus(); }
  else query.value = '';
}
const archived = computed(() => !!studio.value.projects.find(p => p.id === props.projectId)?.archived);
const chosen = computed(() => studio.value.films.filter(f => f.projectId === props.projectId && selected.value.includes(f.id)));
const publishable = computed(() => chosen.value.length > 0 && chosen.value.every(canPublish));
function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
async function downloadSelected() {
  downloading.value = true;
  try { for (const film of chosen.value) await download(film); }
  catch (error) { toast.error((error as Error).message); }
  finally { downloading.value = false; }
}
function deleteSelected() {
  if (archived.value) return;
  const ids = new Set(chosen.value.map(f => f.id));
  for (const task of studio.value.tasks) {
    if (ids.has(task.filmId) && ['待配置', '待发布', '已排期'].includes(task.status)) task.status = '已取消';
  }
  studio.value.films = studio.value.films.filter(f => !ids.has(f.id));
  selected.value = [];
  deleting.value = false;
  toast.success('已删除所选创作记录');
}
function creationStatus(film: Film) {
  if (studio.value.films.some(f => f.id === film.id)) return '成功';
  const job = studio.value.jobs.find(j => j.id === film.id);
  return job?.status === '等待中' ? '等待中' : job?.status === '生成中' ? '生成中' : '失败';
}
const statusClass = (film: Film) => ({ '成功': '!bg-emerald-50 !text-emerald-600', '生成中': '!bg-sky-50 !text-sky-600', '等待中': '!bg-amber-50 !text-amber-600', '失败': '!bg-rose-50 !text-rose-500' })[creationStatus(film)];
const films=computed(() => {
  const completed = studio.value.films.filter(f => f.projectId === props.projectId);
  const pending: Film[] = studio.value.jobs.filter(j => j.projectId === props.projectId && j.status !== '已完成' && !completed.some(f => f.id === j.id)).map(j => ({ ...j.film, id: j.id, createdAt: j.createdAt ?? new Date(j.dueAt - 5000).toISOString() }));
  return [...pending, ...completed].filter(f => f.title.toLowerCase().includes(query.value.toLowerCase()));
});
async function open(f:Film){if(creationStatus(f)!=='成功')return;if(mediaUrl.value)URL.revokeObjectURL(mediaUrl.value);mediaUrl.value='';preview.value=f;if(f.mediaIds[0]){try{const blob=await getMedia(currentUser.value!.id,f.mediaIds[0]);if(blob)mediaUrl.value=URL.createObjectURL(blob);else toast.error('本地媒体不存在，请重新上传');}catch(e){toast.error((e as Error).message);}}}
onBeforeUnmount(() => { if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value); });
function close(){preview.value=null;if(mediaUrl.value)URL.revokeObjectURL(mediaUrl.value);mediaUrl.value='';}
async function download(f:Film){if(f.mediaIds.length){for(const id of f.mediaIds){const blob=await getMedia(currentUser.value!.id,id);if(blob)downloadFile(f.title+(f.type==='视频'?'.mp4':'.png'),blob);else toast.error('媒体已丢失');}}else{downloadFile(`${f.title}-创作说明.txt`,new Blob([`演示成片（尚未连接视频生成服务）\n${f.title}\n${f.brief}\n${f.ratio} / ${f.duration}s / ${f.quality}`],{type:'text/plain'}));toast.info('已下载创作说明；原型生成结果不含真实视频文件');}}
function renameFilm(f: Film, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  if (!archived.value && value) f.title = value;
  input.value = f.title;
}
function publish(f:Film){emit('publish', [f.id]);}
function coverImage(f: Film) {
  const index = [...f.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3 + 1;
  return `/images/creation-covers/cover-${index}.jpg`;
}
function sourceLabel(f: Film) { return f.source === '本地上传' ? '本地上传' : f.reference ? '爆款复刻' : f.source === '专家创作' ? '专家模式' : '自由创作'; }
function modifyVideo(f: Film) {
  close();
  void router.push({ path: `/projects/${props.projectId}`, query: { section: 'gen', mode: 'normal', editFilm: f.id } });
}
function regenerate(f:Film){const {id: _id,createdAt: _date,...rest}=f;void _id;void _date;startGeneration({...rest,inPublishing:false});toast.success('已开始重新生成');}
</script>
<template><section><div class="mb-4 flex flex-wrap items-center justify-between gap-3" aria-label="创作记录工具栏"><slot name="navigation" /><div class="ml-auto flex flex-wrap items-center justify-end gap-3"><div v-if="selected.length" class="flex items-center gap-2">
  <template v-if="selected.length"><span class="whitespace-nowrap text-xs text-slate-500">已选 {{selected.length}} 项</span><button type="button" class="mr-2 whitespace-nowrap text-xs text-slate-500 transition-colors hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" @click="selected=[]">取消选择</button><button class="studio-btn !border-sky-400 !text-sky-600" :disabled="!publishable" @click="emit('publish', selected)"><Send class="h-4 w-4" />发布</button><button class="studio-btn" :disabled="downloading" @click="downloadSelected"><Download class="h-4 w-4" />{{downloading?'下载中…':'下载'}}</button><button class="studio-btn" :disabled="archived" @click="deleting=true"><Trash2 class="h-4 w-4" />删除</button></template>
</div><slot name="upload" /><div class="relative shrink-0">
  <div v-if="searchOpen" class="relative"><Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" /><input ref="searchInput" v-model="searchDraft" class="studio-field !w-64 !border-slate-300 !pl-9 placeholder:text-slate-500 focus:!border-slate-400 focus:!ring-slate-200" placeholder="搜索当前项目，回车搜索" aria-label="搜索成片名称" @keydown.enter="query=searchDraft.trim()" @keydown.esc="searchOpen=false;query='';searchDraft=''" @blur="!searchDraft.trim() && (searchOpen=false, query='')"></div>
  <button v-else class="studio-btn !gap-2 !border-slate-200 !px-4 !text-slate-800" aria-label="搜索创作记录" :aria-expanded="searchOpen" @click="toggleSearch"><Search class="h-4 w-4" />搜索</button>
</div><div class="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="创作记录展示方式"><button v-for="option in [{key:'grid',label:'缩略图视图',icon:LayoutGrid},{key:'list',label:'列表视图',icon:List}]" :key="option.key" :aria-label="option.label" :aria-pressed="view===option.key" :class="view===option.key?'bg-white text-sky-600 shadow-sm':'text-slate-400'" class="flex h-8 w-8 items-center justify-center rounded-lg" @click="view=option.key"><component :is="option.icon" class="h-4 w-4" /></button></div></div></div><div v-if="view==='grid'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
  <article v-for="f in films" :key="f.id" class="relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
    <div class="absolute inset-0 bg-slate-200"><img v-if="creationStatus(f)==='成功'" :src="coverImage(f)" alt="示例视频封面" class="absolute inset-0 h-full w-full object-cover" loading="lazy">
      <button class="absolute inset-0 flex items-center justify-center" :aria-label="`预览 ${f.title}`" :disabled="creationStatus(f)!=='成功'" @click="open(f)"></button>
      
      <div v-if="creationStatus(f)!=='成功'" class="pointer-events-none absolute inset-0 flex items-center justify-center pb-12 text-base font-medium tracking-wide text-slate-500" role="status">{{creationStatus(f)}}</div>
      <input v-model="selected" class="absolute right-3 top-3 h-4 w-4 accent-sky-500" type="checkbox" :value="f.id" :disabled="archived || creationStatus(f)!=='成功'" :aria-label="`选择 ${f.title}`">
    </div>
    <div class="absolute inset-x-0 bottom-0 px-3 pb-4 pt-14" :class="creationStatus(f)==='成功' ? 'bg-gradient-to-t from-slate-950/90 via-slate-950/65 to-transparent text-white' : 'text-slate-600'">
      <input :value="f.title" :aria-label="`修改视频名称 ${f.title}`" :disabled="archived" class="h-9 w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-current outline-none transition hover:border-white/30 hover:bg-white/10 focus:border-white/60 focus:bg-white/15 focus:ring-2 focus:ring-white/20" @change="renameFilm(f, $event)" @keydown.enter="($event.target as HTMLInputElement).blur()" @keydown.esc="($event.target as HTMLInputElement).value=f.title;($event.target as HTMLInputElement).blur()">
      <div class="mt-2 flex items-center gap-2 px-2 text-xs">
        <button v-if="creationStatus(f)==='成功'" class="studio-btn !h-8 !rounded-lg !border-white/50 !bg-white/15 !px-3 !text-xs !text-white hover:!bg-white/25" :disabled="!canPublish(f)" @click="publish(f)">去发布</button>
        <template v-else><button v-if="creationStatus(f)==='失败'" class="text-sky-600" @click="retryGeneration(f.id)">重试</button></template>
        <time class="ml-auto text-[11px] opacity-75">{{formatCreatedAt(f.createdAt)}}</time>
        <button class="shrink-0 text-current opacity-70 hover:opacity-100 disabled:opacity-40" :disabled="archived || creationStatus(f)!=='成功'" :aria-label="`删除 ${f.title}`" @click="selected=[f.id];deleting=true"><Trash2 class="h-3.5 w-3.5" /></button>
      </div>
    </div>
  </article>
</div><div v-else class="overflow-auto rounded-2xl border border-slate-200"><table class="studio-table" aria-label="创作记录列表"><thead><tr><th>选择</th><th>视频 / 图文</th><th>规格</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody><tr v-for="f in films" :key="f.id"><td><input v-model="selected" class="h-5 w-5 cursor-pointer align-middle accent-sky-500 disabled:cursor-not-allowed" type="checkbox" :value="f.id" :disabled="archived || creationStatus(f)!=='成功'" :aria-label="`选择 ${f.title}`"></td><td><div class="flex items-center gap-3"><button :aria-label="`预览 ${f.title}`" class="thumb-gradient flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white" @click="open(f)"><img :src="coverImage(f)" alt="示例视频封面" class="h-full w-full object-cover" loading="lazy"></button><div class="min-w-0"><input :value="f.title" :aria-label="`修改视频名称 ${f.title}`" :disabled="archived" class="h-9 w-full min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-200 hover:bg-slate-50 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" @change="renameFilm(f, $event)" @keydown.enter="($event.target as HTMLInputElement).blur()" @keydown.esc="($event.target as HTMLInputElement).value=f.title;($event.target as HTMLInputElement).blur()"><p class="mt-2 text-xs text-slate-400">{{sourceLabel(f)}}</p></div></div></td><td>{{f.type}} · {{f.ratio}} · {{f.duration}}s</td><td><span class="studio-badge" :class="statusClass(f)">{{creationStatus(f)}}</span><p v-if="studio.jobs.find(j=>j.id===f.id)?.status==='已取消'" class="mt-1 text-xs text-slate-400">已取消</p></td><td>{{formatCreatedAt(f.createdAt)}}</td><td><div v-if="creationStatus(f)==='成功'" class="flex items-center gap-3 whitespace-nowrap"><button class="studio-btn !h-8 !rounded-lg !border-sky-300 !px-3 !text-xs !text-sky-600" :disabled="!canPublish(f)" @click="publish(f)">去发布</button><button @click="download(f)">下载</button></div><div v-else class="whitespace-nowrap"><button v-if="creationStatus(f)==='失败'" class="text-sky-600" @click="retryGeneration(f.id)">重试生成</button></div></td></tr></tbody></table></div><div v-if="!films.length" class="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">还没有成片，前往自由创作开始第一次创作</div></section><Dialog :open="deleting" @update:open="deleting=$event"><DialogContent class="max-w-md bg-white"><DialogTitle>删除所选创作记录？</DialogTitle><DialogDescription>将删除 {{chosen.length}} 条本地创作记录，并取消关联的待发布或已排期任务。已有发布历史和 TikTok 内容会保留。</DialogDescription><div class="flex justify-end gap-3"><button class="studio-btn" @click="deleting=false">取消</button><button class="studio-primary" @click="deleteSelected">确认删除</button></div></DialogContent></Dialog><Dialog :open="!!preview" @update:open="!$event&&close()">
  <DialogContent class="flex h-[min(720px,82vh)] w-[92vw] max-w-[1120px] gap-0 overflow-hidden rounded-2xl bg-white p-0">
    <template v-if="preview">
      <div class="flex min-w-0 flex-1 items-center justify-center bg-slate-950 p-5" aria-label="媒体预览">
        <video v-if="mediaUrl && preview.type==='视频'" :src="mediaUrl" controls class="h-full max-h-full w-full rounded-xl object-contain" />
        <img v-else-if="mediaUrl" :src="mediaUrl" :alt="preview.title" class="h-full max-h-full w-full rounded-xl object-contain">
        <div v-else class="flex max-w-sm flex-col items-center gap-4 p-8 text-center text-slate-400"><Play class="h-12 w-12 text-slate-600" /><p class="text-sm">{{preview.source==='本地上传'?'媒体暂不可用，请重新上传':'生成效果演示'}}</p><p class="text-xs leading-6">{{preview.source==='本地上传'?'本地媒体文件未找到':'当前记录为创作方案，接入视频生成服务后可在此播放成片。'}}</p></div>
      </div>
      <aside class="flex w-[46%] min-w-[330px] max-w-[520px] flex-col border-l border-slate-100 bg-white" aria-label="创作详情">
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-7">
          <DialogTitle class="pr-6 text-lg font-semibold leading-7 text-slate-800">{{preview.title}}</DialogTitle>
          <DialogDescription class="mt-2 text-xs leading-6 text-slate-400">{{sourceLabel(preview)}} · {{formatCreatedAt(preview.createdAt)}}</DialogDescription>
          <div class="mt-4 flex flex-wrap gap-2"><span class="studio-badge">{{preview.source==='本地上传'?'已上传':'生成完成'}}</span><span class="studio-badge">{{preview.type}}</span><span class="studio-badge">{{preview.ratio}} · {{preview.duration}}s</span><span class="studio-badge">{{preview.quality}}</span></div>
          <h3 class="mb-3 mt-6 text-sm font-medium text-slate-500">创作提示词</h3>
          <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm leading-7 text-slate-600">
            <p class="whitespace-pre-wrap break-words">{{preview.brief || '暂无创作提示词'}}</p>
            <div v-for="product in studio.products.filter(p=>preview?.productIds.includes(p.id))" :key="product.id" class="mt-6 whitespace-pre-wrap break-words"><p class="font-medium">产品卡资料</p><p>产品名称：{{product.name}}</p><p v-if="product.desc">产品描述：{{product.desc}}</p><p v-if="product.sellingPoint">产品卖点：{{product.sellingPoint}}</p><p v-for="point in product.points" :key="point">－ {{point}}</p></div>
          </div>
          <div v-if="preview.reference" class="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-xs leading-6 text-slate-500"><p class="font-medium text-sky-600">爆款复刻参考 · {{preview.reference.source}}</p><p>{{preview.reference.title}}</p><p class="break-all">{{preview.reference.url}}</p></div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 bg-white p-5">
          <button class="studio-primary" @click="download(preview)"><Download class="h-4 w-4" />下载{{preview.type==='视频'?'视频':'图文'}}</button>
          <button class="studio-btn" :disabled="archived" @click="regenerate(preview)"><RotateCcw class="h-4 w-4" />重新生成</button>
          <button class="studio-btn" :disabled="archived" @click="modifyVideo(preview)"><Pencil class="h-4 w-4" />修改视频</button>
          <button class="studio-btn !border-rose-200 !text-rose-500" :disabled="archived" @click="selected=[preview.id];close();deleting=true"><Trash2 class="h-4 w-4" />删除</button>
        </div>
      </aside>
    </template>
  </DialogContent>
</Dialog></template>
