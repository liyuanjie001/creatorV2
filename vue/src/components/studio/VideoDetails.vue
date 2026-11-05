<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { studio } from '@/services/studio';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import { isSubmittedTask, dateTime, privacyName, sourceName, workPublishStatus, type VideoRow } from '@/services/videoManagement';
import VideoStatus from './VideoStatus.vue';

const props = defineProps<{ row: VideoRow | null }>();
const emit = defineEmits<{ close: []; download: []; publish: []; regenerate: []; modify: [] }>();
const urls = ref<string[]>([]);
const error = ref('');
let revision = 0;

function clear() {
  urls.value.forEach(URL.revokeObjectURL);
  urls.value = [];
}

watch(
  () => props.row,
  async (row) => {
    const request = ++revision;
    clear();
    error.value = '';
    if (!row || !currentUser.value) return;
    try {
      const mediaIds = row.content?.imageMediaIds ?? row.task?.imageMediaIds ?? row.film?.mediaIds ?? [];
      const blobs = await Promise.all(mediaIds.map((id) => getMedia(currentUser.value!.id, id)));
      if (request !== revision) return;
      if (blobs.some((blob) => !blob)) error.value = '本地媒体已丢失，请重新上传';
      urls.value = blobs.filter((blob): blob is Blob => !!blob).map((blob) => URL.createObjectURL(blob));
    } catch {
      if (request === revision) error.value = '本地媒体读取失败，请重试';
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revision++;
  clear();
});

const history = computed(() =>
  props.row?.film || props.row?.task
    ? studio.value.tasks
        .filter((task) => task.filmId === (props.row?.film?.id || props.row?.task?.filmId) && isSubmittedTask(task))
        .sort((a, b) => (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt))
    : [],
);
const film = computed(() => props.row?.film);
const hasPublishInfo = computed(() => !!props.row && workPublishStatus(props.row) !== '未发布');
const generationStatus = computed(() => props.row?.generation || '未提供');
const imageIds = computed(
  () => props.row?.content?.imageMediaIds ?? props.row?.task?.imageMediaIds ?? props.row?.film?.mediaIds ?? [],
);
const generationFields = computed(() => {
  const row = props.row;
  if (!row) return [];
  const f = row.film;
  return [
    ['创作方式', sourceName(f)],
    [f?.type === '图文' ? '作品参数' : '视频参数', f ? f.type === '图文' ? `图集 · ${imageIds.value.length} 张图片` : `${f.ratio} · ${f.duration}s · ${f.quality}` : '未提供'],
    ['生成时间', f ? dateTime(row.job?.createdAt || f.createdAt) : '未提供'],
  ];
});
const publishFields = computed(() => {
  const row = props.row;
  if (!row) return [];
  const accountId = row.task?.accountId || row.content?.accountId;
  return [
    ['发布状态', workPublishStatus(row)],
    ['发布帐号', studio.value.accounts.find((account) => account.id === accountId)?.handle || (accountId ? '已移除帐号' : '未提供')],
    ['可见范围', row.task ? privacyName(row.task.privacy) : row.content ? '未提供' : '—'],
    ['计划发布时间', row.task?.scheduledAt ? dateTime(row.task.scheduledAt) : '—'],
    ['实际发布时间', dateTime(row.task?.publishedAt || row.content?.publishedAt)],
  ];
});
const references = computed(() => {
  const f = film.value;
  return [
    f?.reference?.title,
    ...(f?.referenceAssets || []).map((asset) => asset.name),
  ].filter(Boolean);
});
const products = computed(() =>
  film.value?.productIds.map((id) => studio.value.products.find((product) => product.id === id)?.name || '已移除的产品卡') ?? [],
);
</script>

<template>
  <Dialog :open="!!row" @update:open="!$event && emit('close')">
    <DialogContent class="flex h-[min(86vh,760px)] max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0">
      <template v-if="row">
        <div class="grid min-h-0 flex-1 grid-rows-[minmax(190px,0.42fr)_minmax(0,0.58fr)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:grid-rows-1">
          <div
            role="region"
            aria-label="媒体预览"
            class="flex min-h-0 items-center justify-center overflow-hidden bg-slate-950 p-4 md:p-5"
          >
            <video
              v-if="film?.type === '视频' && urls[0]"
              :src="urls[0]"
              controls
              class="max-h-full max-w-full rounded-xl"
            />
            <div v-else-if="urls.length" class="flex h-full w-full snap-x snap-mandatory overflow-x-auto">
              <img
                v-for="url in urls"
                :key="url"
                :src="url"
                :alt="row.title"
                class="h-full w-full shrink-0 snap-center object-contain"
              />
            </div>
            <div v-else class="space-y-3 px-5 text-center text-sm text-slate-400">
              <p>
                {{
                  row.job
                    ? row.generation
                    : !film
                      ? 'TK 历史内容'
                      : film.source === '本地上传'
                        ? '本地媒体不可用'
                        : film.type === '图文' ? '图文图片不可用' : '生成效果演示'
                }}
              </p>
              <p class="text-xs">
                {{ error || (!film ? '本机未保存此内容的媒体文件' : film.type === '图文' ? '图片已丢失，请重新上传后再发布' : '尚未接入真实视频生成服务') }}
              </p>
            </div>
          </div>

          <section role="region" aria-label="创作详情" class="flex min-h-0 flex-col bg-white">
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 md:p-6">
              <header class="pr-8">
                <DialogTitle class="break-words text-base font-semibold text-slate-800">
                  {{ film?.title || row.title || '视频详情' }}
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-xs">作品创作与发布详情 · 北京时间 UTC+8</DialogDescription>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <VideoStatus :value="generationStatus" />
                  <VideoStatus :value="workPublishStatus(row)" />
                  <span class="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{{ film?.type || row.content?.type || '视频' }}</span>
                </div>
              </header>

              <section class="rounded-lg bg-sky-50/80 p-3.5" aria-label="生成信息">
                <h3 class="mb-2 text-xs font-semibold text-slate-700">生成信息</h3>
                <dl class="grid gap-x-5 gap-y-2 text-xs sm:grid-cols-2">
                  <div v-for="[label, value] in generationFields" :key="label" class="flex min-w-0 items-baseline gap-2 leading-5">
                    <dt class="shrink-0 text-slate-400">{{ label }}</dt>
                    <dd class="min-w-0 break-words text-slate-700">{{ value }}</dd>
                  </div>
                </dl>
              </section>

              <section v-if="hasPublishInfo" class="rounded-lg bg-indigo-50/70 p-3.5" aria-label="发布信息">
                <h3 class="mb-2 text-xs font-semibold text-slate-700">发布信息</h3>
                <dl class="grid gap-x-5 gap-y-2 text-xs sm:grid-cols-2">
                  <div v-for="[label, value] in publishFields" :key="label" class="flex min-w-0 items-baseline gap-2 leading-5">
                    <dt class="shrink-0 text-slate-400">{{ label }}</dt>
                    <dd class="min-w-0 break-words text-slate-700">{{ value }}</dd>
                  </div>
                </dl>
                <div v-if="row.task && (row.task.title || row.task.tags)" class="mt-2 flex items-baseline gap-2 text-xs leading-5">
                  <p class="shrink-0 text-slate-400">发布文案与标签</p>
                  <p class="min-w-0 whitespace-pre-wrap break-words text-slate-700">{{ [row.task.title, row.task.tags].filter(Boolean).join(' ') }}</p>
                </div>
                <p v-if="row.task?.error" class="mt-2 text-xs leading-5 text-rose-600">{{ row.task.error }}</p>
                <p v-if="row.task?.bgm" class="mt-2 text-xs text-slate-500">背景音乐：{{ row.task.bgm.name }}</p>
              </section>

              <section aria-label="创作提示词">
                <h3 class="mb-2 text-xs font-semibold text-slate-700">创作提示词</h3>
                <p class="max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  {{ !film ? '未提供' : film.source === '本地上传' ? '不适用' : film.brief || '未填写' }}
                </p>
              </section>

              <section class="grid gap-3 sm:grid-cols-2" aria-label="参考资料">
                <div class="rounded-lg bg-slate-50 p-3 text-xs">
                  <h3 class="mb-1.5 font-medium text-slate-500">参考素材</h3>
                  <p class="break-words leading-5 text-slate-700">{{ references.join('、') || (film ? '未引用' : '未提供') }}</p>
                  <p v-if="film?.reference" class="mt-1 break-all text-[11px] leading-4 text-sky-600">{{ film.reference.source }} · {{ film.reference.url || film.reference.title }}</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 text-xs">
                  <h3 class="mb-1.5 font-medium text-slate-500">参考产品卡</h3>
                  <p class="break-words leading-5 text-slate-700">{{ products.join('、') || (film ? '未引用' : '未提供') }}</p>
                </div>
              </section>

              <section v-if="history.length" aria-label="发布历史">
                <h3 class="mb-2 text-xs font-semibold text-slate-700">发布历史（{{ history.length }}）</h3>
                <div v-for="task in history" :key="task.id" class="mb-2 rounded-lg bg-slate-50 p-3 text-[11px]">
                  <div class="flex flex-wrap items-center gap-2">
                    <VideoStatus :value="task.status === '已排期' ? '定时发布' : task.status" />
                    <span>{{ studio.accounts.find((account) => account.id === task.accountId)?.handle || '已移除帐号' }}</span>
                    <span class="text-slate-400">提交：{{ dateTime(task.submittedAt) }}</span>
                  </div>
                  <p v-if="task.scheduledAt" class="mt-2 text-sky-700">计划发布时间：{{ dateTime(task.scheduledAt) }} · 北京时间 UTC+8</p>
                  <p class="mt-1 text-slate-500">实际发布时间：{{ dateTime(task.publishedAt || studio.content.find((content) => content.id === task.platformId)?.publishedAt) }}</p>
                  <p v-if="task.error" class="mt-1 text-rose-600">{{ task.error }}</p>
                </div>
              </section>
            </div>

            <footer class="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 bg-white px-5 py-3 md:px-6">
              <slot name="actions" />
            </footer>
          </section>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
