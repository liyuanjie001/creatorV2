<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { studio } from '@/services/studio';
import { getMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import { dateTime, privacyName, sourceName, type VideoRow } from '@/services/videoManagement';
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
    if (!row?.film || !currentUser.value) return;
    try {
      const blobs = await Promise.all(row.film.mediaIds.map((id) => getMedia(currentUser.value!.id, id)));
      if (request !== revision) return;
      if (blobs.some((b) => !b)) error.value = '本地媒体已丢失，请重新上传';
      urls.value = blobs.filter((b): b is Blob => !!b).map((b) => URL.createObjectURL(b));
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
        .filter((t) => t.filmId === (props.row?.film?.id || props.row?.task?.filmId) && t.status !== '待配置')
        .sort((a, b) => (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt))
    : [],
);
const film = computed(() => props.row?.film);
const fields = computed(() => {
  const row = props.row;
  if (!row) return [];
  const f = row.film;
  const content = row.content;
  return [
    ['创作方式', sourceName(f)],
    ['视频名称', f?.title || row.title],
    [
      '视频参数',
      f
        ? f.type === '图文'
          ? `图文 · ${f.mediaIds.length} 张图片`
          : `${f.type} · ${f.ratio} · ${f.duration}s · ${f.quality}`
        : '未提供',
    ],
    ['生成时间', f ? dateTime(row.job?.createdAt || f.createdAt) : '未提供'],
    ['生成状态', row.generation],
    [
      '发布状态',
      row.publishStatus +
        (row.everPublished && ['发布失败', '已取消'].includes(row.publishStatus) ? ' · 曾发布成功' : ''),
    ],
    ['计划发布时间', row.task?.scheduledAt ? dateTime(row.task.scheduledAt) : '—'],
    ['实际发布时间', dateTime(row.task?.publishedAt || content?.publishedAt)],
    [
      '参考素材',
      [f?.reference?.title, ...(f?.referenceAssets || []).map((a) => a.name)].filter(Boolean).join('、') ||
        (f ? '未引用' : '未提供'),
    ],
    [
      '参考产品卡',
      f?.productIds
        .map((id) => studio.value.products.find((p) => p.id === id)?.name || '已移除的产品卡')
        .join('、') || (f ? '未引用' : '未提供'),
    ],
  ];
});
</script>
<template>
  <Dialog :open="!!row" @update:open="!$event && emit('close')">
    <DialogContent class="max-h-[90vh] max-w-5xl overflow-y-auto bg-white p-0">
      <template v-if="row">
        <div class="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div
            role="region"
            aria-label="媒体预览"
            class="flex min-h-72 items-center justify-center bg-slate-950 p-5"
          >
            <video
              v-if="film?.type === '视频' && urls[0]"
              :src="urls[0]"
              controls
              class="max-h-[65vh] max-w-full rounded-xl"
            />
            <div v-else-if="urls.length" class="flex overflow-x-auto">
              <img
                v-for="url in urls"
                :key="url"
                :src="url"
                :alt="row.title"
                class="max-h-[65vh] w-full shrink-0 object-contain"
              />
            </div>
            <div v-else class="space-y-3 text-center text-sm text-slate-400">
              <p>
                {{
                  row.job
                    ? row.generation
                    : !film
                      ? 'TK 历史内容'
                      : film.source === '本地上传'
                        ? '本地媒体不可用'
                        : film.type === '图文'
                          ? '图文图片不可用'
                          : '生成效果演示'
                }}
              </p>
              <p class="text-xs">
                {{
                  error ||
                  (!film
                    ? '本机未保存此内容的媒体文件'
                    : film.type === '图文'
                      ? '图片已丢失，请重新上传后再发布'
                      : '尚未接入真实视频生成服务')
                }}
              </p>
            </div>
          </div>
          <div role="region" aria-label="创作详情" class="p-6">
            <DialogTitle class="break-words pr-5 text-lg">
              {{ film?.title || row.title || '视频详情' }}
            </DialogTitle>
            <DialogDescription class="mt-2 text-xs">视频创作与发布详情 · 北京时间 UTC+8</DialogDescription>
            <dl class="mt-5 grid grid-cols-2 gap-4 text-xs">
              <div
                v-for="[label, value] in fields"
                :key="label"
                :class="['视频名称', '参考素材', '参考产品卡'].includes(label!) ? 'col-span-2' : ''"
              >
                <dt class="mb-1.5 text-slate-400">{{ label }}</dt>
                <dd class="break-words leading-5 text-slate-700">{{ value }}</dd>
              </div>
            </dl>
            <h3 class="mb-2 mt-5 text-xs text-slate-400">提示词</h3>
            <p
              class="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600"
            >
              {{ !film ? '未提供' : film.source === '本地上传' ? '不适用' : film.brief || '未填写' }}
            </p>
            <div v-if="film?.reference" class="mt-3 break-all text-xs leading-5 text-sky-600">
              {{ film.reference.source }} · {{ film.reference.url || film.reference.title }}
            </div>
            <div v-if="row.task" class="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6">
              <p>
                发布帐号：{{
                  studio.accounts.find((a) => a.id === row?.task?.accountId)?.handle || '已移除帐号'
                }}
              </p>
              <p>可见范围：{{ privacyName(row.task.privacy) }}</p>
              <p class="whitespace-pre-wrap">{{ row.task.title }} {{ row.task.tags }}</p>
              <p v-if="row.task.error" class="text-rose-500">{{ row.task.error }}</p>
            </div>
            <h3 class="mb-2 mt-5 text-xs font-medium text-slate-700">发布历史（{{ history.length }}）</h3>
            <div
              v-for="task in history"
              :key="task.id"
              class="flex flex-wrap items-center gap-2 border-t border-slate-100 py-2 text-[11px]"
            >
              <VideoStatus :value="task.status" />
              <span>{{ studio.accounts.find((a) => a.id === task.accountId)?.handle || '已移除帐号' }}</span>
              <span class="text-slate-400">提交：{{ dateTime(task.submittedAt) }}</span>
              <p v-if="task.scheduledAt" class="w-full text-sky-600">
                计划：{{ dateTime(task.scheduledAt) }} · 北京时间 UTC+8
              </p>
              <p class="w-full text-slate-400">
                实际发布：{{
                  dateTime(
                    task.publishedAt || studio.content.find((c) => c.id === task.platformId)?.publishedAt,
                  )
                }}
              </p>
              <p v-if="task.error" class="w-full text-rose-500">{{ task.error }}</p>
            </div>
            <p v-if="!history.length" class="text-xs text-slate-400">暂无本地发布历史</p>
            <div class="mt-5 flex flex-wrap gap-2"><slot name="actions" /></div>
          </div>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
