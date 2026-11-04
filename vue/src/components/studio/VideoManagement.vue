<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, LayoutGrid, List, Clock3, Download, Eye, MoreHorizontal } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import {
  studio,
  retryGeneration,
  cancelPublishTask,
  reschedulePublishTask,
  startGeneration,
} from '@/services/studio';
import {
  videoRows,
  dateTime,
  duration,
  cover,
  privacyName,
  metrics,
  metricReason,
  publishReason,
  type VideoRow,
} from '@/services/videoManagement';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import { downloadFile } from '@/services/storage';
import { toast } from 'vue-sonner';
import VideoInfo from './VideoInfo.vue';
import VideoStatus from './VideoStatus.vue';
import VideoDetails from './VideoDetails.vue';
const props = defineProps<{ projectId: string; published: boolean }>();
const emit = defineEmits<{ publish: [ids: string[]] }>();
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
const view = computed(() => (param('view', 'list') === 'grid' ? 'grid' : 'list'));
const searchOpen = ref(!!param('q'));
const searchDraft = ref(param('q'));
const searchInput = ref<HTMLInputElement | null>(null);
const selected = ref<string[]>([]);
const details = ref<VideoRow | null>(null);
const deleting = ref(false);
const cancelling = ref(false);
const busy = ref(false);
const scheduleId = ref('');
const schedule = ref('');
const archived = computed(() => !!studio.value.projects.find((p) => p.id === props.projectId)?.archived);
const rows = computed(() => videoRows(studio.value, props.projectId, props.published));
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
      return (
        (!q ||
          `${row.title} ${row.film?.brief || ''} ${studio.value.accounts.find((a) => a.id === (row.task?.accountId || row.content?.accountId))?.handle || ''}`
            .toLowerCase()
            .includes(q)) &&
        (!param('source') || row.source === param('source')) &&
        (!param('generation') || row.generation === param('generation')) &&
        (!param('publication') || row.publishStatus === param('publication')) &&
        (!param('account') || (row.task?.accountId || row.content?.accountId) === param('account')) &&
        (!param('privacy') || row.task?.privacy === param('privacy'))
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
        .filter((r) => r.film?.source === '本地上传' || r.film?.type === '图文')
        .map(async (row) => {
          try {
            const blobs = await Promise.all(row.film!.mediaIds.map((id) => getMedia(currentUser.value!.id, id)));
            missing[row.film!.id] = !row.film!.mediaIds.length || blobs.some((b) => !b);
            if (row.film!.type === '图文' && blobs[0]) covers[row.film!.id] = URL.createObjectURL(blobs[0]);
          } catch {
            missing[row.film!.id] = true;
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
  () => [props.projectId, props.published],
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
      ['q', 'source', 'generation', 'publication', 'account', 'privacy', 'sort', 'page', 'size'].map(
        (key) => route.query[key],
      ),
    ),
  () => {
    selected.value = [];
  },
);
const downloadReason = (r: VideoRow) =>
  !r.film || r.job
    ? '没有可下载的本地成片'
    : missingMedia.value[r.film.id]
      ? '本地媒体已丢失，请重新上传'
      : '';
const canPublishReason = (r: VideoRow) =>
  missingMedia.value[r.film?.id || ''] && r.film?.type !== '图文'
    ? '本地媒体已丢失，请重新上传'
    : publishReason(studio.value, r, archived.value);
const deleteReason = (r: VideoRow) =>
  archived.value
    ? '项目已归档'
    : ['生成中', '等待中'].includes(r.generation)
      ? '生成中的任务不可删除'
      : r.film && studio.value.tasks.some((t) => t.filmId === r.film!.id && t.status === '发布中')
        ? '正在发布，请等待平台确认'
        : '';
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
async function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) {
    await nextTick();
    searchInput.value?.focus();
  } else setParam('q', '');
}
function reset() {
  const query = { ...route.query };
  for (const key of ['q', 'source', 'generation', 'publication', 'account', 'privacy', 'sort', 'page'])
    delete query[key];
  void router.replace({ query });
  searchDraft.value = '';
}
function switchTab(published: boolean) {
  const query: Record<
    string,
    import('vue-router').LocationQueryValue | import('vue-router').LocationQueryValue[] | undefined
  > = { ...route.query, tab: published ? 'records' : 'creations' };
  for (const key of [
    'q',
    'source',
    'generation',
    'publication',
    'account',
    'privacy',
    'sort',
    'page',
    'task',
    'from',
  ])
    delete query[key];
  void router.replace({ query });
}
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
  for (const row of chosen.value) {
    if (row.film) {
      for (const task of studio.value.tasks.filter((t) => t.filmId === row.film!.id)) {
        if (['待发布', '已排期'].includes(task.status)) cancelPublishTask(task.id);
        if (task.status === '待配置') {
          task.status = '已取消';
          task.updatedAt = new Date().toISOString();
        }
      }
      for (const content of studio.value.content.filter((c) => c.filmId === row.film!.id))
        content.projectIds = content.projectIds.filter((id) => id !== props.projectId);
      studio.value.films = studio.value.films.filter((f) => f.id !== row.film!.id);
      studio.value.jobs = studio.value.jobs.filter((j) => j.id !== row.film!.id);
    } else if (row.content)
      row.content.projectIds = row.content.projectIds.filter((id) => id !== props.projectId);
  }
  selected.value = [];
  deleting.value = false;
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
  schedule.value = new Date(new Date(row.task.scheduledAt).getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 16);
}
function saveSchedule() {
  try {
    reschedulePublishTask(scheduleId.value, new Date(schedule.value + '+08:00').toISOString());
    scheduleId.value = '';
    toast.success('排期已更新');
  } catch (e) {
    toast.error((e as Error).message);
  }
}
function analytics(row: VideoRow) {
  void router.push({ query: { section: 'analytics', tab: 'content', content: row.content?.id } });
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
    <div class="flex flex-wrap items-center justify-between gap-3">
      <nav class="inline-flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1" aria-label="我的作品分类">
        <button
          v-for="item in [
            { published: false, label: '全部' },
            { published: true, label: '已发布' },
          ]"
          :key="item.label"
          class="h-8 rounded-lg px-4 text-[13px] font-semibold"
          :class="published === item.published ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'"
          :aria-pressed="published === item.published"
          @click="switchTab(item.published)"
        >
          {{ item.label }}
          <span class="ml-1 text-[11px] opacity-70">
            {{ videoRows(studio, projectId, item.published).length }}
          </span>
        </button>
      </nav>
      <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
        <template v-if="selected.length">
          <span class="text-xs text-slate-500">已选 {{ selected.length }} 项</span>
          <button class="text-xs text-slate-500" @click="selected = []">取消选择</button>
          <span v-if="!published" :title="publishBlocked">
            <button
              class="studio-btn !border-sky-300 !text-sky-600"
              :disabled="!!publishBlocked || busy"
              @click="publish(chosen)"
            >
              发布
            </button>
          </span>
          <span :title="downloadBlocked">
            <button class="studio-btn" :disabled="!!downloadBlocked || busy" @click="download(chosen)">
              下载
            </button>
          </span>
          <span v-if="!published" :title="deleteBlocked">
            <button class="studio-btn" :disabled="!!deleteBlocked || busy" @click="deleting = true">
              删除
            </button>
          </span>
          <span v-else :title="cancelBlocked">
            <button class="studio-btn" :disabled="!!cancelBlocked || busy" @click="cancelling = true">
              取消排期
            </button>
          </span>
        </template>
        <slot v-if="!published" name="upload" />
        <input
          v-if="searchOpen"
          ref="searchInput"
          v-model="searchDraft"
          class="studio-field !w-56"
          placeholder="搜索视频、文案或帐号"
          aria-label="搜索视频"
          @keydown.enter="setParam('q', searchDraft.trim())"
          @keydown.esc="
            searchOpen = false;
            setParam('q', '');
          "
        />
        <button v-else class="studio-btn" aria-label="搜索视频" @click="toggleSearch">
          <Search class="h-4 w-4" />
        </button>
        <div class="flex h-10 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="视频展示方式">
          <button
            v-for="item in [
              { key: 'list', icon: List, label: '列表视图' },
              { key: 'grid', icon: LayoutGrid, label: '缩略图视图' },
            ]"
            :key="item.key"
            class="grid h-8 w-8 place-items-center rounded-lg"
            :class="view === item.key ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'"
            :aria-label="item.label"
            :aria-pressed="view === item.key"
            @click="setParam('view', item.key)"
          >
            <component :is="item.icon" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
      <template v-if="!published">
        <select
          :value="param('source')"
          class="studio-field !h-8 !w-36 !bg-white !text-xs"
          aria-label="创作方式筛选"
          @change="setParam('source', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">全部创作方式</option>
          <option
            v-for="source in ['自由创作', '专家模式', '爆款复刻', '本地上传', 'TK 历史内容']"
            :key="source"
          >
            {{ source }}
          </option>
        </select>
        <select
          :value="param('generation')"
          class="studio-field !h-8 !w-36 !bg-white !text-xs"
          aria-label="生成状态筛选"
          @change="setParam('generation', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">全部生成状态</option>
          <option v-for="status in ['生成中', '等待中', '成功', '失败', '已取消', '未提供']" :key="status">
            {{ status }}
          </option>
        </select>
      </template>
      <select
        v-else
        :value="param('account')"
        class="studio-field !h-8 !w-40 !bg-white !text-xs"
        aria-label="发布帐号筛选"
        @change="setParam('account', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部帐号</option>
        <option v-for="account in studio.accounts" :key="account.id" :value="account.id">
          {{ account.handle }}
        </option>
      </select>
      <select
        :value="param('publication')"
        class="studio-field !h-8 !w-36 !bg-white !text-xs"
        aria-label="发布状态筛选"
        @change="setParam('publication', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部发布状态</option>
        <option
          v-for="status in published
            ? ['已排期', '待发布', '发布中', '发布成功', '发布失败', '已取消']
            : ['未发布', '待配置', '已排期', '待发布', '发布中', '发布成功', '发布失败', '已取消']"
          :key="status"
        >
          {{ status }}
        </option>
      </select>
      <select
        v-if="published"
        :value="param('privacy')"
        class="studio-field !h-8 !w-36 !bg-white !text-xs"
        aria-label="可见范围筛选"
        @change="setParam('privacy', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部可见范围</option>
        <option
          v-for="value in ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']"
          :key="value"
          :value="value"
        >
          {{ privacyName(value) }}
        </option>
      </select>
      <select
        :value="param('sort', 'date')"
        class="studio-field !h-8 !w-36 !bg-white !text-xs"
        aria-label="排序方式"
        @change="setParam('sort', ($event.target as HTMLSelectElement).value)"
      >
        <option value="date">最近时间</option>
        <template v-if="published">
          <option value="views">播放量从高到低</option>
          <option value="likes">点赞从高到低</option>
          <option value="comments">评论从高到低</option>
        </template>
      </select>
      <button class="px-2 text-xs text-slate-500 hover:text-sky-600" @click="reset">重置</button>
      <span class="ml-auto text-[11px] text-slate-400">{{ filtered.length }} 条 · 北京时间 UTC+8</span>
    </div>
    <div
      v-if="view === 'list'"
      :key="published ? 'published' : 'all'"
      class="overflow-x-auto rounded-xl border border-slate-200"
    >
      <table class="studio-table min-w-[1040px]" :aria-label="published ? '已发布视频列表' : '全部视频列表'">
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
            <th>{{ published ? '视频与发布文案' : '视频' }}</th>
            <template v-if="!published">
              <th>创作方式</th>
              <th>视频参数</th>
              <th>生成状态</th>
            </template>
            <template v-else>
              <th>发布帐号</th>
              <th>可见范围</th>
            </template>
            <th>发布状态</th>
            <template v-if="published">
              <th>播放量</th>
              <th>点赞</th>
              <th>评论</th>
            </template>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
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
              <VideoInfo
                :row="row"
                :published="published"
                :missing="missingMedia[row.film?.id || '']"
                :rename="!published && !!row.film && !archived"
                @open="details = row"
                @rename="rename(row, $event)"
              />
              <p v-if="missingMedia[row.film?.id || '']" class="mt-1 text-[10px] text-amber-600">
                本地媒体已丢失
              </p>
            </td>
            <template v-if="!published">
              <td class="whitespace-nowrap">{{ row.source }}</td>
              <td class="whitespace-nowrap">
                {{
                  row.film
                    ? row.film.type === '图文' ? `图文 · ${row.film.mediaIds.length} 张图片` : `${row.film.type} · ${row.film.ratio} · ${duration(row.film.duration)}`
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
              <VideoStatus :value="row.publishStatus" />
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
            <td>
              <div class="flex items-center gap-2 whitespace-nowrap">
                <button
                  v-if="row.job && row.generation === '失败'"
                  class="text-xs text-sky-600"
                  :disabled="archived"
                  @click="retryGeneration(row.job.id)"
                >
                  重试生成
                </button>
                <span v-else-if="!published && row.film && !row.job" :title="canPublishReason(row)">
                  <button
                    class="studio-btn !h-8 !border-sky-300 !px-3 !text-xs !text-sky-600"
                    :disabled="!!canPublishReason(row)"
                    @click="publish([row])"
                  >
                    {{
                      studio.tasks.some((t) => t.filmId === row.film?.id && t.status === '发布成功')
                        ? '再次发布'
                        : '去发布'
                    }}
                  </button>
                </span>
                <button
                  v-if="published && row.publishStatus === '发布失败'"
                  class="text-xs text-sky-600"
                  :disabled="!!canPublishReason(row)"
                  :title="canPublishReason(row)"
                  @click="publish([row])"
                >
                  重新配置
                </button>
                <button
                  v-if="published && row.publishStatus === '已排期'"
                  class="text-xs text-sky-600"
                  :disabled="archived"
                  @click="openSchedule(row)"
                >
                  改期
                </button>
                <button
                  class="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500"
                  aria-label="查看视频详情"
                  @click="details = row"
                >
                  <Eye class="h-3.5 w-3.5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      type="button"
                      class="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full border border-slate-200"
                      aria-label="更多操作"
                    >
                      <MoreHorizontal class="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    class="w-40 rounded-xl border-slate-200 bg-white p-1 shadow-lg"
                  >
                    <DropdownMenuItem
                      class="w-full px-3 py-2 text-left text-xs disabled:text-slate-300"
                      :disabled="!!downloadReason(row) || busy"
                      :title="downloadReason(row)"
                      @select="download([row])"
                    >
                      下载
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="published && row.content"
                      class="w-full px-3 py-2 text-left text-xs"
                      @select="analytics(row)"
                    >
                      查看数据
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="row.task?.status === '已排期'"
                      class="w-full px-3 py-2 text-left text-xs"
                      :disabled="archived"
                      @select="
                        selected = [row.id];
                        cancelling = true;
                      "
                    >
                      取消排期
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="!published"
                      class="w-full px-3 py-2 text-left text-xs disabled:text-slate-300"
                      :disabled="!!deleteReason(row)"
                      :title="deleteReason(row)"
                      @select="
                        selected = [row.id];
                        deleting = true;
                      "
                    >
                      删除本地记录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
          <img
            v-if="!row.job && row.film?.type === '图文' && imageCovers[row.film.id]"
            :src="imageCovers[row.film.id]"
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
            {{ missingMedia[row.film?.id || ''] || row.content?.type === '图文' || row.film?.type === '图文' ? '图文图片不可用' : row.generation }}
          </span>
        </button>
        <input
          v-model="selected"
          type="checkbox"
          :value="row.id"
          class="absolute right-3 top-3 h-5 w-5 accent-sky-500"
          :aria-label="`选择 ${row.title}`"
        />
        <span
          v-if="!row.job && row.film?.type === '视频'"
          class="absolute left-3 top-3 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white"
        >
          {{ duration(row.film.duration) }}
        </span>
        <span v-if="!row.job && row.film?.type === '图文'" class="absolute left-3 top-3 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">{{ row.film.mediaIds.length }} 张图片</span>
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
          <p class="text-[10px] opacity-75">{{ dateTime(row.date) }}</p>
          <p v-if="row.task?.status === '已排期'" class="flex items-center gap-1 text-[10px] text-sky-300">
            <Clock3 class="h-3 w-3" />
            {{ dateTime(row.task.scheduledAt) }} 北京时间 UTC+8
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <VideoStatus :value="row.publishStatus" />
            <span v-if="published" class="text-[10px]">
              {{
                studio.accounts.find((a) => a.id === (row.task?.accountId || row.content?.accountId))?.handle
              }}
            </span>
            <button
              v-if="!published && row.film && !row.job"
              class="rounded-lg border border-current px-2 py-1 text-xs disabled:opacity-40"
              :disabled="!!canPublishReason(row)"
              :title="canPublishReason(row)"
              @click="publish([row])"
            >
              {{
                studio.tasks.some((t) => t.filmId === row.film?.id && t.status === '发布成功')
                  ? '再次发布'
                  : '去发布'
              }}
            </button>
            <button
              v-if="row.job && row.generation === '失败'"
              class="text-xs text-sky-600"
              :disabled="archived"
              @click="retryGeneration(row.job.id)"
            >
              重试生成
            </button>
            <button
              v-if="published && row.publishStatus === '已排期'"
              class="text-xs"
              :disabled="archived"
              @click="openSchedule(row)"
            >
              改期
            </button>
            <button
              v-if="published && row.publishStatus === '发布失败'"
              class="text-xs"
              :disabled="!!canPublishReason(row)"
              @click="publish([row])"
            >
              重新配置
            </button>
          </div>
          <p v-if="published" class="text-[10px] opacity-80">
            播放 {{ metrics(row)?.views ?? '—' }} · 点赞 {{ metrics(row)?.likes ?? '—' }} · 评论
            {{ metrics(row)?.comments ?? '—' }}
          </p>
        </div>
      </article>
    </div>
    <div
      v-if="!pageRows.length"
      class="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400"
    >
      {{
        rows.length
          ? '暂无符合筛选条件的视频'
          : published
            ? '暂无发布任务或关联内容'
            : '还没有视频，可上传或前往自由创作'
      }}
      <button v-if="rows.length" class="ml-3 text-sky-600" @click="reset">重置筛选</button>
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
            v-if="details.task?.status === '已排期'"
            class="studio-btn"
            :disabled="archived"
            @click="openSchedule(details)"
          >
            改期
          </button>
          <button
            v-if="details.task?.status === '已排期'"
            class="studio-btn"
            :disabled="archived"
            @click="
              selected = [details.id];
              cancelling = true;
            "
          >
            取消排期
          </button>
          <button v-if="details.content" class="studio-btn" @click="analytics(details)">查看数据</button>
          <button
            class="studio-btn"
            :disabled="!!downloadReason(details) || busy"
            :title="downloadReason(details)"
            @click="download([details])"
          >
            <Download class="h-3.5 w-3.5" />
            下载
          </button>
          <button
            class="studio-btn !border-sky-300 !text-sky-600"
            :disabled="!!canPublishReason(details)"
            :title="canPublishReason(details)"
            @click="publish([details])"
          >
            去发布
          </button>
          <button class="studio-btn" :disabled="archived || !details.film" @click="regenerate(details)">
            重新生成
          </button>
          <button class="studio-btn" :disabled="archived || !details.film" @click="modify(details)">
            修改视频
          </button>
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
        <DialogDescription>请选择未来的北京时间（UTC+8）。</DialogDescription>
        <input v-model="schedule" type="datetime-local" class="studio-field" aria-label="调整排期时间" />
        <button class="studio-primary" :disabled="archived" @click="saveSchedule">保存排期</button>
      </DialogContent>
    </Dialog>
  </section>
</template>
