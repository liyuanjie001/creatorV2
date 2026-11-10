<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, LayoutGrid, List, Clock3, FileText, Send, Download, RotateCcw, Pencil, Trash2, ChartNoAxesCombined, CalendarClock, CalendarX, Image as ImageIcon } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui';
import {
  studio,
  retryGeneration,
  cancelPublishTask,
  reschedulePublishTask,
  startGeneration,
  ensureDemoProjectContent,
} from '@/services/studio';
import {
  categorizedVideoRows,
  rowPlatforms,
  videoActions,
  type VideoAction,
  dateTime,
  publishStatusLabel,
  scheduledDateTime,
  duration,
  cover,
  privacyName,
  metrics,
  metricReason,
  mediaTypeName,
  workPublishStatus,
  type VideoRow,
} from '@/services/videoManagement';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import type { StudioState } from '@/types/studio';
import { downloadFile, writeJSON } from '@/services/storage';
import { toast } from 'vue-sonner';
import VideoInfo from './VideoInfo.vue';
import VideoStatus from './VideoStatus.vue';
import VideoDetails from './VideoDetails.vue';
import VideoActionMenu from './VideoActionMenu.vue';
import SchedulePicker from './SchedulePicker.vue';
import { platforms, platformName } from '@/services/accounts';
import FilterHeader from './FilterHeader.vue';
const props = defineProps<{ projectId: string; published: boolean; category?: 'all'|'scheduled'|'published' }>();
const emit = defineEmits<{ publish: [ids: string[], retryTaskId?: string] }>();
const route = useRoute();
const router = useRouter();
function param(key: string, fallback = '') {
  return typeof route.query[key] === 'string' ? (route.query[key] as string) : fallback;
}
function setParam(key: string, value: string) {
  void router.replace({
    query: { ...route.query, [key]: value || undefined, page: key === 'view' ? route.query.page : undefined },
  });
}
function paramValues(key: string) { return [...new Set(param(key).split(',').filter(Boolean).map(v => key === 'generation' && ['等待中','等待生成'].includes(v) ? '生成中' : key === 'publication' && v === '已发布' ? '发布成功' : v))]; }
const openFilter = ref('');
const filterDraft = ref<string[]>([]);
const filterGroups = computed(() => {
  const publication = (props.published ? ['待发布','定时发布','发布中','发布成功','发布失败','已取消'] : ['未发布','待发布','定时发布','发布中','发布成功','发布失败','已取消']).map(value => ({value,label:value}));
  const metricRanges = [
    { value: '0-999', label: '<1K', min: 0, max: 999 },
    { value: '1000-9999', label: '1K–10K', min: 1000, max: 9999 },
    { value: '10000-99999', label: '10K–100K', min: 10000, max: 99999 },
    { value: '100000-', label: '>100K', min: 100000, max: Infinity },
  ];
  const platformFilter = {key:'platform',label:'平台',options:platforms.map(p=>({value:p.value,label:p.label}))};
  return props.published
    ? [
        platformFilter,
        { key: 'type', label: '类型', options: [{ value: '视频', label: '视频' }, { value: '图集', label: '图集' }] },
        { key: 'account', label: '帐号', options: studio.value.accounts.filter(a => studio.value.projects.find(p => p.id === props.projectId)?.accountIds.includes(a.id)).map(a => ({ value: a.id, label: a.handle })) },
        { key: 'publication', label: '发布状态', options: publication },
        { key: 'privacy', label: '可见范围', options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'].map(value => ({ value, label: privacyName(value) })) },
        ...(['views', 'likes', 'comments'] as const).map(key => ({ key, label: ({ views: '播放量', likes: '点赞', comments: '评论' } as const)[key], options: metricRanges.map(({ value, label }) => ({ value, label })) })),
      ]
    : [
        { key: 'type', label: '类型', options: [{ value: '视频', label: '视频' }, { value: '图集', label: '图集' }, { value: '脚本拆解', label: '脚本拆解' }] },
        { key: 'source', label: '创作方式', options: ['自由创作', '专家模式', '爆款复刻', '本地上传', '脚本拆解'].map(value => ({ value, label: value })) },
        { key: 'generation', label: '生成状态', options: [{ value: '生成中', label: '生成中' }, { value: '生成失败', label: '生成失败' }, { value: '生成成功', label: '生成成功' }] },
        { key: 'publication', label: '发布状态', options: publication },
      ];
});
function toggleFilter(key: string) {
  if (openFilter.value === key) { openFilter.value = ''; return; }
  openFilter.value = key;
  filterDraft.value = paramValues(key);
}
function toggleFilterValue(value: string) {
  filterDraft.value = filterDraft.value.includes(value)
    ? filterDraft.value.filter(item => item !== value)
    : [...filterDraft.value, value];
}
function applyFilter(key: string) {
  setParam(key, filterDraft.value.join(','));
  openFilter.value = '';
}
function clearFilter(key: string) {
  filterDraft.value = [];
  setParam(key, '');
  openFilter.value = '';
}
function filterByKey(key: string) {
  return filterGroups.value.find((filter) => filter.key === key);
}
const view = computed(() => (param('view', 'list') === 'grid' ? 'grid' : 'list'));
const searchDraft = ref(param('q'));
const searchInput = ref<HTMLInputElement | null>(null);
const projectName = computed(() => studio.value.projects.find((p) => p.id === props.projectId)?.name ?? '当前项目');
const selected = ref<string[]>([]);
const details = ref<VideoRow | null>(null);
const deleting = ref(false);
const cancelling = ref(false);
const busy = ref(false);
const scheduleId = ref('');
const schedule = ref('');
const scheduleZone = ref('Asia/Shanghai');
const scheduleValid = ref(true);
const archived = computed(() => !!studio.value.projects.find((p) => p.id === props.projectId)?.archived);
watch(() => props.projectId, ensureDemoProjectContent, { immediate: true });
const rows = computed(() => categorizedVideoRows(studio.value, props.projectId, props.category ?? (props.published ? 'published':'all')));
watch(rows, (value) => {
  if (details.value) {
    const updated = value.find((r) => r.id === details.value?.id);
    if (updated) details.value = updated;
  }
});
const filtered = computed(() =>
  rows.value
    .filter((row) => {
      const q = param('q').toLowerCase();
      const sources = paramValues('source');
      const generations = paramValues('generation');
      const publications = paramValues('publication');
      const types = paramValues('type');
      const accounts = paramValues('account');
      const privacy = paramValues('privacy');
      const metricMatches = (key: 'views' | 'likes' | 'comments') => {
        const selectedRanges = paramValues(key);
        if (!selectedRanges.length) return true;
        const value = metrics(row)?.[key];
        if (value === undefined) return false;
        return selectedRanges.some(range => {
          const [minText, maxText] = range.split('-');
          const min = Number(minText);
          const max = maxText ? Number(maxText) : Infinity;
          return value >= min && value <= max;
        });
      };
      const publicationMatches = (value: string) => workPublishStatus(row) === value;
      return (
        (!q ||
          `${row.title} ${row.film?.brief || ''} ${studio.value.accounts.find((a) => a.id === (row.task?.accountId || row.content?.accountId))?.handle || ''}`
            .toLowerCase()
            .includes(q)) &&
        (!props.published || !paramValues('platform').length || rowPlatforms(studio.value,row,!props.published).some(p=>paramValues('platform').includes(p))) &&
        (!sources.length || sources.includes(row.source)) &&
        (!types.length || types.includes(mediaTypeName(row))) &&
        (!generations.length || generations.includes(row.generation)) &&
        (!publications.length || publications.some(publicationMatches)) &&
        (!accounts.length || accounts.includes(row.task?.accountId || row.content?.accountId || '')) &&
        (!privacy.length || privacy.includes(row.task?.privacy || '')) &&
        metricMatches('views') && metricMatches('likes') && metricMatches('comments')
      );
    })
    .sort((a, b) => {
      if ((a.publishStatus === '已排期') !== (b.publishStatus === '已排期'))
        return a.publishStatus === '已排期' ? -1 : 1;
      if (a.publishStatus === '已排期')
        return (a.task?.scheduledAt || '').localeCompare(b.task?.scheduledAt || '');
      const sort = param('sort', 'date');
      return ['views', 'likes', 'comments'].includes(sort)
        ? (metrics(b)?.[sort as 'views' | 'likes' | 'comments'] ?? -1) -
            (metrics(a)?.[sort as 'views' | 'likes' | 'comments'] ?? -1)
        : b.date.localeCompare(a.date);
    }),
);
const size = computed(() => (param('size') === '50' ? 50 : 20));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)));
const page = computed(() => Math.min(pages.value, Math.max(1, Number(param('page', '1')) || 1)));
const pageRows = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value));
const chosen = computed(() => rows.value.filter((r) => selected.value.includes(r.id)));
const missingMedia = ref<Record<string, boolean>>({});
const imageCovers = ref<Record<string, string>>({});
let mediaRevision = 0;
watch(
  () => [props.projectId, rows.value.map((r) => `${r.film?.id}:${r.film?.mediaIds.join(',')}`).join('|')],
  async () => {
    const revision = ++mediaRevision;
    const missing: Record<string, boolean> = {};
    const covers: Record<string, string> = {};
    Object.values(imageCovers.value).forEach(url => URL.revokeObjectURL(url));
    await Promise.all(
      rows.value
        .filter((r) => r.film?.source === '本地上传' || r.film?.type === '图文' || r.content?.type === '图文')
        .map(async (row) => {
          try {
            const mediaIds = row.content?.imageMediaIds ?? row.task?.imageMediaIds ?? row.film?.mediaIds ?? [];
            const key = row.film?.id || row.content?.id || row.id;
            const blobs = await Promise.all(mediaIds.map((id) => getMedia(currentUser.value!.id, id)));
            missing[key] = !mediaIds.length || blobs.some((b) => !b);
            if ((row.film?.type === '图文' || row.content?.type === '图文') && blobs[0]) covers[key] = URL.createObjectURL(blobs[0]);
          } catch {
            missing[row.film?.id || row.content?.id || row.id] = true;
          }
        }),
    );
    if (revision === mediaRevision) { missingMedia.value = missing; imageCovers.value = covers; }
    else Object.values(covers).forEach(url => URL.revokeObjectURL(url));
  },
  { immediate: true },
);
onBeforeUnmount(() => { mediaRevision++; Object.values(imageCovers.value).forEach(url => URL.revokeObjectURL(url)); });
watch(
  () => [props.projectId, props.published, props.category],
  () => {
    selected.value = [];
    details.value = null;
  },
);
watch(
  () => route.query.q,
  () => {
    searchDraft.value = param('q');
  },
);
watch(
  () =>
    JSON.stringify(
      ['platform', 'q', 'type', 'source', 'generation', 'publication', 'account', 'privacy', 'sort', 'page', 'size'].map(
        (key) => route.query[key],
      ),
    ),
  () => {
    selected.value = [];
  },
);
function actions(row: VideoRow) { return videoActions(studio.value, row, props.published, !!missingMedia.value[row.film?.id || '']); }
const detailPrimaryIds = ['publish', 'download', 'regenerate'];
const actionIcons = { publish: Send, download: Download, regenerate: RotateCcw, modify: Pencil, delete: Trash2, retry: RotateCcw, analytics: ChartNoAxesCombined, reschedule: CalendarClock, cancel: CalendarX };
function reason(row: VideoRow, id: VideoAction['id']) { return actions(row).find(a => a.id === id)?.reason ?? '当前状态不支持此操作'; }
const downloadReason = (row: VideoRow) => reason(row, 'download');
const canPublishReason = (row: VideoRow) => reason(row, 'publish');
const deleteReason = (row: VideoRow) => reason(row, 'delete');
function runAction(row: VideoRow, action: VideoAction) {
  if (action.reason || busy.value) return;
  switch (action.id) {
    case 'publish': publish([row]); break;
    case 'retry': retryGeneration(row.job!.id); break;
    case 'download': void download([row]); break;
    case 'regenerate': regenerate(row); break;
    case 'modify': modify(row); break;
    case 'analytics': analytics(row); details.value = null; break;
    case 'reschedule': openSchedule(row); break;
    case 'cancel': selected.value = [row.id]; details.value = null; cancelling.value = true; break;
    case 'delete': selected.value = [row.id]; details.value = null; deleting.value = true; break;
  }
}
const publishBlocked = computed(() => chosen.value.map(canPublishReason).find(Boolean) || '');
const downloadBlocked = computed(() => chosen.value.map(downloadReason).find(Boolean) || '');
const deleteBlocked = computed(() => chosen.value.map(deleteReason).find(Boolean) || '');
const cancelBlocked = computed(() =>
  archived.value
    ? '项目已归档'
    : chosen.value.some((r) => r.task?.status !== '已排期')
      ? '只能批量取消已排期任务'
      : '',
);
const affected = computed(
  () =>
    studio.value.tasks.filter(
      (t) =>
        chosen.value.some((r) => r.film?.id === t.filmId) &&
        ['待配置', '待发布', '已排期'].includes(t.status),
    ).length,
);
function rename(row: VideoRow, value: string) {
  if (archived.value) return;
  const name = value.trim();
  if (!name) return;
  if (row.job) row.job.film.title = name;
  else if (row.film) row.film.title = name;
}
function publish(rows: VideoRow[]) {
  const reason = rows.map(canPublishReason).find(Boolean);
  if (reason) {
    toast.info(reason);
    return;
  }
  emit(
    'publish',
    rows.map((r) => r.film!.id),
    rows.length === 1 && rows[0]?.task?.status === '发布失败' ? rows[0].task.id : rows.length === 1 ? 'new' : undefined,
  );
  details.value = null;
}
async function download(rows: VideoRow[]) {
  if (busy.value) return;
  busy.value = true;
  try {
    for (const row of rows) {
      const reason = downloadReason(row);
      if (reason) throw new Error(reason);
      const film = row.film!;
      if (film.mediaIds.length) {
        const blobs = await Promise.all(film.mediaIds.map((id) => getMedia(currentUser.value!.id, id)));
        if (blobs.some((b) => !b)) throw new Error('本地媒体已丢失，请重新上传');
        blobs.forEach((blob, i) =>
          downloadFile(
            `${film.title.slice(0, 100)}${blobs.length > 1 ? `-${i + 1}` : ''}${film.type === '视频' ? '.mp4' : '.png'}`,
            blob!,
          ),
        );
      } else {
        downloadFile(
          `${film.title.slice(0, 100)}-创作说明.txt`,
          new Blob([`${film.title}\n${film.brief}`], { type: 'text/plain' }),
        );
        toast.info('演示成片下载为创作说明，尚无真实视频文件');
      }
    }
  } catch (e) {
    toast.error((e as Error).message);
  } finally {
    busy.value = false;
  }
}
function remove() {
  if (deleteBlocked.value) return;
  const next: StudioState = JSON.parse(JSON.stringify(studio.value));
  for (const row of chosen.value) {
    if (row.film) {
      for (const task of next.tasks.filter(t=>t.filmId===row.film!.id)) {
        if (['待配置','待发布','已排期'].includes(task.status)) {
          task.status='已取消'; task.demoPreview=false; task.updatedAt=new Date().toISOString();
        }
      }
      for (const content of next.content.filter(c=>c.filmId===row.film!.id)) content.projectIds=content.projectIds.filter(id=>id!==props.projectId);
      next.films=next.films.filter(f=>f.id!==row.film!.id);
      next.jobs=next.jobs.filter(j=>j.id!==row.film!.id);
    } else if (row.content) {
      const content=next.content.find(c=>c.id===row.content!.id);
      if (content) content.projectIds=content.projectIds.filter(id=>id!==props.projectId);
    }
  }
  if (!writeJSON('chuhai-studio-v1:'+(currentUser.value?.id ?? 'guest'),next)) { toast.error('删除保存失败，请重试'); return; }
  studio.value=next;
  selected.value=[]; deleting.value=false; details.value=null;
  toast.success('已移除本地记录，平台内容与发布历史保留');
}
function cancelRows() {
  try {
    for (const row of chosen.value) if (row.task) cancelPublishTask(row.task.id);
    selected.value = [];
    cancelling.value = false;
    toast.success('已取消定时发布');
  } catch (e) {
    toast.error((e as Error).message);
  }
}
function openSchedule(row: VideoRow) {
  if (!row.task) return;
  scheduleId.value = row.task.id;
  schedule.value = row.task.scheduledAt;
  scheduleZone.value = row.task.timeZone || 'Asia/Shanghai';
  scheduleValid.value = true;
}
function saveSchedule() {
  try {
    reschedulePublishTask(scheduleId.value, schedule.value, scheduleZone.value);
    scheduleId.value = '';
    toast.success('排期已更新');
  } catch (e) {
    toast.error((e as Error).message);
  }
}
function analytics(row: VideoRow) {
  void router.push({ query: { section: 'analytics', report: 'content', content: row.content?.id } });
}
function regenerate(row: VideoRow) {
  if (!row.film || archived.value) return;
  const { id, createdAt, ...film } = row.film;
  void id;
  void createdAt;
  startGeneration({ ...film, inPublishing: false });
  details.value = null;
  toast.success('生成任务已提交');
}
function modify(row: VideoRow) {
  void router.push({
    path: `/projects/${props.projectId}`,
    query: { section: 'gen', mode: 'normal', editFilm: row.film?.id },
  });
}
function togglePage() {
  const ids = pageRows.value.map((r) => r.id);
  selected.value = ids.every((id) => selected.value.includes(id))
    ? selected.value.filter((id) => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])];
}
</script>
<template>
  <section class="space-y-4" aria-label="我的作品内容">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">我的作品</h1>
        <p class="mt-2 text-xs text-slate-400">{{ projectName }} · {{ published ? '查看已提交的发布任务及平台状态' : '管理视频与图文作品，配置帐号、文案和发布时间' }}</p>
      </div>
    </header>
    <nav class="flex gap-2 border-b border-slate-100 pb-3" aria-label="作品分类"><button v-for="item in [{key:'creations',label:'全部'},{key:'scheduled',label:'定时发布'},{key:'records',label:'已发布'}]" :key="item.key" type="button" class="studio-tab" :class="(category ?? (published?'published':'all')) === ({creations:'all',scheduled:'scheduled',records:'published'} as Record<string,string>)[item.key] && 'studio-active'" @click="router.replace({query:{section:'publish',tab:item.key,view:route.query.view}})">{{ item.label }}</button></nav>
    <div class="flex flex-wrap items-center gap-2 rounded-xl p-3">
      <nav v-if="published" class="flex flex-wrap gap-1" aria-label="发布平台分类">
        <button v-for="item in [{value:'',label:'全部平台'},{value:'tiktok',label:'TikTok'},{value:'instagram',label:'Instagram'},{value:'facebook',label:'Facebook'}]" :key="item.value || 'all'" type="button" class="studio-tab" :class="param('platform') === item.value && 'studio-active'" :aria-pressed="param('platform') === item.value" @click="setParam('platform',item.value)">{{ item.label }}</button>
      </nav>
      <div class="flex flex-wrap items-center gap-2" data-testid="video-search-upload">
      <label class="relative w-full sm:w-56">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref="searchInput"
          v-model="searchDraft"
          class="studio-field !h-10 !w-full !rounded-lg !bg-white !pl-9 !text-xs"
          placeholder="搜索视频、文案或帐号"
          aria-label="搜索视频"
          @keydown.enter="setParam('q', searchDraft.trim())"
          @keydown.esc="searchDraft = ''; setParam('q', '')"
        />
      </label>
      <slot name="upload" />
      </div>
      <div v-if="selected.length" class="flex min-h-10 flex-wrap items-center gap-2" aria-label="批量操作">
        <span role="separator" aria-orientation="vertical" class="mx-1 h-6 w-px shrink-0 bg-slate-200"></span>
        <span v-if="!published" :title="publishBlocked || '发布所选作品'">
          <button type="button" class="h-10 whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-4 text-xs font-medium text-sky-600 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300" aria-label="发布所选作品" :title="publishBlocked || '发布所选作品'" :disabled="!!publishBlocked || busy" @click="publish(chosen)">
            发布
          </button>
        </span>
        <span :title="downloadBlocked || '下载所选作品'">
          <button type="button" class="h-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300" aria-label="下载所选作品" :title="downloadBlocked || '下载所选作品'" :disabled="!!downloadBlocked || busy" @click="download(chosen)">
            下载
          </button>
        </span>
        <span v-if="!published" :title="deleteBlocked || '删除所选作品'">
          <button type="button" class="h-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300" aria-label="删除所选作品" :title="deleteBlocked || '删除所选作品'" :disabled="!!deleteBlocked || busy" @click="deleting = true">
            删除
          </button>
        </span>
        <span v-else :title="cancelBlocked || '取消所选排期'">
          <button type="button" class="h-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300" aria-label="取消所选排期" :title="cancelBlocked || '取消所选排期'" :disabled="!!cancelBlocked || busy" @click="cancelling = true">
            取消排期
          </button>
        </span>
        <span class="ml-1 whitespace-nowrap text-xs text-slate-500">已选 {{ selected.length }} 项</span>
        <button type="button" class="whitespace-nowrap text-xs text-slate-500 hover:text-sky-600" @click="selected = []">取消选择</button>
      </div>
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
      <div class="flex h-10 rounded-lg border border-slate-200 bg-white p-1" aria-label="视频展示方式">
        <button
          v-for="item in [
            { key: 'list', icon: List, label: '列表视图' },
            { key: 'grid', icon: LayoutGrid, label: '缩略图视图' },
          ]"
          :key="item.key"
          class="grid h-8 w-8 place-items-center rounded-md"
          :class="view === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'"
          :aria-label="item.label"
          :aria-pressed="view === item.key"
          @click="setParam('view', item.key)"
        >
          <component :is="item.icon" class="h-4 w-4" />
        </button>
      </div>
      </div>
    </div>
    <div
      v-if="view === 'list'"
      :key="published ? 'published' : 'all'"
      class="overflow-x-auto rounded-xl border border-slate-200"
    >
      <table class="studio-table min-w-[1040px]" :aria-label="published ? '发布记录列表' : '全部视频列表'">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                class="h-4 w-4 accent-sky-500"
                aria-label="选择当前页"
                :checked="!!pageRows.length && pageRows.every((r) => selected.includes(r.id))"
                :disabled="!pageRows.length"
                @change="togglePage"
              />
            </th>
            <th>
              <span :class="paramValues('type').length ? 'text-sky-600 font-semibold' : ''">{{ published ? '视频与发布文案' : '视频' }}</span>
              <FilterHeader v-if="filterByKey('type')" :filter="filterByKey('type')!" :active="paramValues('type')" :open="openFilter === 'type'" @toggle="toggleFilter('type')" @toggle-value="toggleFilterValue" @clear="clearFilter('type')" @apply="applyFilter('type')" />
            </th>
            <template v-if="!published">
              <th>
                <span :class="paramValues('source').length ? 'text-sky-600 font-semibold' : ''">创作方式</span>
                <FilterHeader v-if="filterByKey('source')" :filter="filterByKey('source')!" :active="paramValues('source')" :open="openFilter === 'source'" @toggle="toggleFilter('source')" @toggle-value="toggleFilterValue" @clear="clearFilter('source')" @apply="applyFilter('source')" />
              </th>
              <th>参数</th>
              <th>
                <span :class="paramValues('generation').length ? 'text-sky-600 font-semibold' : ''">生成状态</span>
                <FilterHeader v-if="filterByKey('generation')" :filter="filterByKey('generation')!" :active="paramValues('generation')" :open="openFilter === 'generation'" @toggle="toggleFilter('generation')" @toggle-value="toggleFilterValue" @clear="clearFilter('generation')" @apply="applyFilter('generation')" />
              </th>
            </template>
            <template v-else>
              <th>
                <span :class="paramValues('account').length ? 'text-sky-600 font-semibold' : ''">发布帐号</span>
                <FilterHeader v-if="filterByKey('account')" :filter="filterByKey('account')!" :active="paramValues('account')" :open="openFilter === 'account'" @toggle="toggleFilter('account')" @toggle-value="toggleFilterValue" @clear="clearFilter('account')" @apply="applyFilter('account')" />
              </th>
              <th>
                <span :class="paramValues('privacy').length ? 'text-sky-600 font-semibold' : ''">可见范围</span>
                <FilterHeader v-if="filterByKey('privacy')" :filter="filterByKey('privacy')!" :active="paramValues('privacy')" :open="openFilter === 'privacy'" @toggle="toggleFilter('privacy')" @toggle-value="toggleFilterValue" @clear="clearFilter('privacy')" @apply="applyFilter('privacy')" />
              </th>
            </template>
            <th>
              <span :class="paramValues('publication').length ? 'text-sky-600 font-semibold' : ''">发布状态</span>
              <FilterHeader v-if="filterByKey('publication')" :filter="filterByKey('publication')!" :active="paramValues('publication')" :open="openFilter === 'publication'" @toggle="toggleFilter('publication')" @toggle-value="toggleFilterValue" @clear="clearFilter('publication')" @apply="applyFilter('publication')" />
            </th>
            <template v-if="published">
              <th>
                <span :class="paramValues('views').length ? 'text-sky-600 font-semibold' : ''">播放量</span>
                <FilterHeader v-if="filterByKey('views')" :filter="filterByKey('views')!" :active="paramValues('views')" :open="openFilter === 'views'" @toggle="toggleFilter('views')" @toggle-value="toggleFilterValue" @clear="clearFilter('views')" @apply="applyFilter('views')" />
              </th>
              <th>
                <span :class="paramValues('likes').length ? 'text-sky-600 font-semibold' : ''">点赞</span>
                <FilterHeader v-if="filterByKey('likes')" :filter="filterByKey('likes')!" :active="paramValues('likes')" :open="openFilter === 'likes'" @toggle="toggleFilter('likes')" @toggle-value="toggleFilterValue" @clear="clearFilter('likes')" @apply="applyFilter('likes')" />
              </th>
              <th>
                <span :class="paramValues('comments').length ? 'text-sky-600 font-semibold' : ''">评论</span>
                <FilterHeader v-if="filterByKey('comments')" :filter="filterByKey('comments')!" :active="paramValues('comments')" :open="openFilter === 'comments'" @toggle="toggleFilter('comments')" @toggle-value="toggleFilterValue" @clear="clearFilter('comments')" @apply="applyFilter('comments')" />
              </th>
            </template>
            <th v-if="published">平台</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!pageRows.length">
            <td :colspan="published ? 10 : 7" class="py-16 text-center text-sm text-slate-400">
              {{ rows.length ? '暂无符合筛选条件的视频' : published ? '暂无发布任务或关联内容' : '还没有视频，可上传或前往自由创作' }}
            </td>
          </tr>
          <tr v-for="row in pageRows" :key="row.id">
            <td>
              <input
                v-model="selected"
                type="checkbox"
                :value="row.id"
                class="h-4 w-4 accent-sky-500"
                :aria-label="`选择 ${row.title}`"
              />
            </td>
            <td>
              <div class="relative w-fit">
              <VideoInfo
                :row="row"
                :published="published"
                :missing="missingMedia[row.film?.id || '']"
                :rename="!published && !!row.film && !archived"
                @open="details = row"
                @rename="rename(row, $event)"
              />
              <span v-if="mediaTypeName(row) === '图集'" class="pointer-events-none absolute left-[42px] top-1 grid h-5 w-5 place-items-center rounded bg-white/95 text-sky-600 shadow-sm" aria-label="图集" title="图集">
                <ImageIcon class="h-3 w-3" />
              </span>
              </div>
              <p v-if="missingMedia[row.film?.id || '']" class="mt-1 text-[10px] text-amber-600">
                本地媒体已丢失
              </p>
            </td>
            <template v-if="!published">
              <td class="whitespace-nowrap">{{ row.source }}</td>
              <td class="whitespace-nowrap">
                {{
                  row.film
                    ? row.film.resultKind === 'script-breakdown' ? '脚本拆解' : row.film.type === '图文' ? `图文 · ${row.film.mediaIds.length} 张图片` : `${row.film.type} · ${row.film.ratio} · ${duration(row.film.duration)}`
                    : '未提供'
                }}
                <p class="mt-1 text-[10px] text-slate-400">{{ row.film?.quality }}</p>
              </td>
              <td><VideoStatus :value="row.generation" /></td>
            </template>
            <template v-else>
              <td class="whitespace-nowrap">
                {{
                  studio.accounts.find((a) => a.id === (row.task?.accountId || row.content?.accountId))
                    ?.handle || '已移除帐号'
                }}
              </td>
              <td class="whitespace-nowrap">{{ privacyName(row.task?.privacy) }}</td>
            </template>
            <td>
              <VideoStatus v-if="mediaTypeName(row) !== '脚本拆解'" :value="published ? publishStatusLabel(row.publishStatus) : workPublishStatus(row)" /><span v-else>—</span>
              <p v-if="row.task?.error" class="mt-1 max-w-40 text-[10px] text-rose-500">
                {{ row.task.error }}
              </p>
            </td>
            <template v-if="published">
              <td
                v-for="key in ['views', 'likes', 'comments'] as const"
                :key="key"
                :title="metrics(row) ? '累计指标' : metricReason(row)"
              >
                {{ metrics(row)?.[key]?.toLocaleString() ?? '—' }}
              </td>
            </template>
            <td v-if="published" class="whitespace-nowrap"><span class="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-700">{{ rowPlatforms(studio,row).map(p=>platformName(p)).join(' · ') || '—' }}</span></td>
            <td>
              <div class="flex items-center gap-2 whitespace-nowrap">
                <button v-for="action in actions(row).filter(a => a.primary)" :key="action.id" type="button" class="studio-btn !h-8 !w-8 !rounded-lg !bg-sky-50 !p-0 !text-sky-600" :aria-label="action.label" :disabled="!!action.reason || busy" :title="action.reason || action.label" @click="runAction(row, action)"><component :is="actionIcons[action.id]" class="h-4 w-4" aria-hidden="true" /></button>
                <VideoActionMenu :actions="actions(row)" :busy="busy" @action="runAction(row, $event)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <article
        v-for="row in pageRows"
        :key="row.id"
        class="relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200"
      >
        <button class="absolute inset-0 w-full" :aria-label="`查看 ${row.title}`" @click="details = row">
          <span v-if="row.film?.resultKind === 'script-breakdown'" class="flex h-full flex-col items-center justify-center gap-3 bg-sky-50 text-sky-600"><FileText class="h-12 w-12" />脚本拆解 · Mock</span>
          <img
            v-else-if="!row.job && (row.film?.type === '图文' || row.content?.type === '图文') && imageCovers[row.film?.id || row.content?.id || row.id]"
            :src="imageCovers[row.film?.id || row.content?.id || row.id]"
            alt="图文首图封面"
            class="h-full w-full object-cover"
          />
          <img
            v-else-if="!row.job && row.film?.type !== '图文' && row.content?.type !== '图文' && !missingMedia[row.film?.id || '']"
            :src="cover(row.film?.id || row.content?.id || row.id)"
            alt="视频封面"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-base text-slate-500">
            {{ missingMedia[row.film?.id || row.content?.id || ''] || row.content?.type === '图文' || row.film?.type === '图文' ? '图文图片不可用' : row.generation }}
          </span>
        </button>
        <input
          v-model="selected"
          type="checkbox"
          :value="row.id"
          class="absolute right-12 top-3 h-5 w-5 accent-sky-500"
          :aria-label="`选择 ${row.title}`"
        />
        <span v-if="mediaTypeName(row) === '图集'" class="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md bg-white/95 text-sky-600 shadow-sm" aria-label="图集" title="图集">
          <ImageIcon class="h-4 w-4" />
        </span>
        <span
          v-if="!row.job && row.film?.type === '视频'"
          class="absolute left-3 top-3 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white"
        >
          {{ duration(row.film.duration) }}
        </span>
        <span v-else-if="!row.job && (row.film?.type === '图文' || row.content?.type === '图文')" class="absolute left-3 top-3 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">{{ row.content?.imageMediaIds?.length ?? row.task?.imageMediaIds?.length ?? row.film?.mediaIds.length ?? 0 }} 张图片</span>
        <div
          class="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4 pt-12"
          :class="
            row.job
              ? 'text-slate-700'
              : 'bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent text-white'
          "
        >
          <input
            v-if="!published && row.film && !archived"
            :value="row.title"
            :title="row.title"
            :aria-label="`修改视频名称 ${row.title}`"
            class="w-full truncate rounded border border-transparent bg-transparent text-sm font-medium outline-none hover:border-slate-300 focus:border-sky-300"
            @change="rename(row, ($event.target as HTMLInputElement).value)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <button v-else class="line-clamp-2 text-left text-sm font-medium" @click="details = row">
            {{ row.title || '无发布文案' }}
          </button>
          <p class="text-[10px] opacity-75">{{ dateTime(row.date) }}</p><p v-if="rowPlatforms(studio,row,!published).length" class="text-[10px] opacity-90">{{ rowPlatforms(studio,row,!published).map(p=>platformName(p)).join(' · ') }}</p>
          <p v-if="row.task?.status === '已排期'" class="flex items-center gap-1 text-[10px] text-sky-300">
            <Clock3 class="h-3 w-3" />
            {{ scheduledDateTime(row.task.scheduledAt, row.task.timeZone) }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <VideoStatus v-if="!published" :value="row.generation" />
            <VideoStatus v-if="mediaTypeName(row) !== '脚本拆解'" :value="published ? publishStatusLabel(row.publishStatus) : workPublishStatus(row)" />
            <span v-if="published" class="text-[10px]">
              {{
                studio.accounts.find((a) => a.id === (row.task?.accountId || row.content?.accountId))?.handle
              }}
            </span>
            <button v-for="action in actions(row).filter(a => a.primary)" :key="action.id" type="button" class="grid h-8 w-8 place-items-center rounded-lg border border-sky-100 bg-sky-50 text-sky-600 disabled:opacity-40" :aria-label="action.label" :disabled="!!action.reason || busy" :title="action.reason || action.label" @click="runAction(row, action)"><component :is="actionIcons[action.id]" class="h-4 w-4" aria-hidden="true" /></button>
            <VideoActionMenu :actions="actions(row)" :busy="busy" @action="runAction(row, $event)" />
          </div>
          <p v-if="published" class="text-[10px] opacity-80">
            播放 {{ metrics(row)?.views ?? '—' }} · 点赞 {{ metrics(row)?.likes ?? '—' }} · 评论
            {{ metrics(row)?.comments ?? '—' }}
          </p>
        </div>
      </article>
    </div>
    <div
      v-if="view === 'grid' && !pageRows.length"
      class="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400"
    >
      {{
        rows.length
          ? '暂无符合筛选条件的视频'
          : published
            ? '暂无发布任务或关联内容'
            : '还没有视频，可上传或前往自由创作'
      }}
    </div>
    <div class="flex items-center justify-end gap-3 text-xs text-slate-500">
      <span>共 {{ filtered.length }} 条</span>
      <select
        :value="size"
        class="rounded-lg border border-slate-200 bg-white px-2 py-1.5"
        aria-label="每页条数"
        @change="setParam('size', ($event.target as HTMLSelectElement).value)"
      >
        <option value="20">20 条 / 页</option>
        <option value="50">50 条 / 页</option>
      </select>
      <button
        class="studio-btn !h-8 !text-xs"
        :disabled="page <= 1"
        @click="router.replace({ query: { ...route.query, page: String(page - 1) } })"
      >
        上一页
      </button>
      <span>{{ page }} / {{ pages }}</span>
      <button
        class="studio-btn !h-8 !text-xs"
        :disabled="page >= pages"
        @click="router.replace({ query: { ...route.query, page: String(page + 1) } })"
      >
        下一页
      </button>
    </div>
    <VideoDetails :row="details" @close="details = null">
      <template #actions>
        <template v-if="details">
          <button
            v-for="action in actions(details).filter(a => detailPrimaryIds.includes(a.id))"
            :key="action.id"
            type="button"
            class="studio-btn !h-10 !w-10 !rounded-lg !p-0 shadow-sm transition-colors disabled:!border-slate-200 disabled:!bg-slate-100 disabled:!text-slate-400 disabled:shadow-none"
            :class="action.id === 'publish' ? '!border-sky-600 !bg-sky-600 !text-white hover:!border-sky-700 hover:!bg-sky-700' : '!border-sky-100 !bg-sky-50 !text-sky-700 hover:!border-sky-200 hover:!bg-sky-100'"
            :aria-label="action.label"
            :disabled="!!action.reason || busy"
            :title="action.reason || action.label"
            @click="runAction(details, action)"
          ><component :is="actionIcons[action.id]" class="h-4 w-4" aria-hidden="true" /></button>
          <VideoActionMenu :actions="actions(details).filter(a => !detailPrimaryIds.includes(a.id))" :busy="busy" prominent @action="runAction(details!, $event)" />
        </template>
      </template>
    </VideoDetails>
    <Dialog :open="deleting" @update:open="deleting = $event">
      <DialogContent class="max-w-md bg-white">
        <DialogTitle>删除所选本地记录？</DialogTitle>
        <DialogDescription>
          将移除 {{ chosen.length }} 条记录，并取消 {{ affected }} 条尚未执行的发布配置或任务。TK
          内容和已有发布历史保留；外部内容仅解除项目关联。
        </DialogDescription>
        <div class="flex justify-end gap-2">
          <button class="studio-btn" @click="deleting = false">返回</button>
          <button class="studio-primary" :disabled="!!deleteBlocked" @click="remove">确认删除</button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog :open="cancelling" @update:open="cancelling = $event">
      <DialogContent class="max-w-md bg-white">
        <DialogTitle>取消定时发布？</DialogTitle>
        <DialogDescription>将取消 {{ chosen.length }} 条排期任务，视频和任务历史保留。</DialogDescription>
        <div class="flex justify-end gap-2">
          <button class="studio-btn" @click="cancelling = false">返回</button>
          <button class="studio-primary" :disabled="!!cancelBlocked" @click="cancelRows">确认取消</button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog :open="!!scheduleId" @update:open="!$event && (scheduleId = '')">
      <DialogContent class="max-w-md bg-white">
        <DialogTitle>调整定时发布</DialogTitle>
        <DialogDescription>请选择城市时区和未来的当地日期时间。</DialogDescription>
        <SchedulePicker v-if="scheduleId" v-model="schedule" v-model:time-zone="scheduleZone" :disabled="archived" @validity="scheduleValid=$event" />
        <button class="studio-primary" :disabled="archived || !scheduleValid" @click="saveSchedule">保存排期</button>
      </DialogContent>
    </Dialog>
  </section>
</template>
