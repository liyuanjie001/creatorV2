<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Sparkles,
  FolderOpen,
  Image as ImageIcon,
} from 'lucide-vue-next';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Badge,
} from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { useVideoPlayer } from '@/composables/useVideoPlayer';
import { toast } from 'vue-sonner';
import type { Platform } from '@/types/domain';

const { open, source, closeVideo } = useVideoPlayer();

const playing = ref(false);
const muted = ref(false);
const progress = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const isImage = computed(() => {
  const label = source.value?.typeLabel;
  return label === '图片' || label === '图文';
});

const durationLabel = computed(() => {
  const raw = source.value?.duration;
  if (!raw || raw === '图文') return '00:15';
  return raw.replace(/^00:/, '').length <= 5 ? raw : raw;
});

const totalSeconds = computed(() => {
  const raw = source.value?.duration;
  if (!raw || raw === '图文') return 15;
  const parts = raw.split(':').map(Number);
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return Number(raw) || 15;
});

const currentLabel = computed(() => {
  const sec = Math.floor((progress.value / 100) * totalSeconds.value);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const kindHint = computed(() => {
  switch (source.value?.kind) {
    case 'inspiration':
      return '灵感素材预览 · 可翻拍或收藏到素材库';
    case 'generation':
      return '创作记录预览 · 可下载或继续发布';
    case 'asset':
      return '素材库预览 · 可用于创作引用';
    default:
      return '媒体预览';
  }
});

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function togglePlay() {
  if (isImage.value) return;
  playing.value = !playing.value;
  if (!playing.value) {
    clearTimer();
    return;
  }
  clearTimer();
  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 100 / (totalSeconds.value * 10));
    if (progress.value >= 100) {
      playing.value = false;
      clearTimer();
    }
  }, 100);
}

function seek(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  progress.value = ratio * 100;
}

function onOpenChange(next: boolean) {
  open.value = next;
  if (!next) {
    playing.value = false;
    progress.value = 0;
    clearTimer();
    closeVideo();
  }
}

watch(open, (v) => {
  if (v) {
    playing.value = false;
    progress.value = 0;
    muted.value = false;
  } else {
    clearTimer();
  }
});

onBeforeUnmount(clearTimer);

function runPrimary() {
  source.value?.primaryAction?.run();
  onOpenChange(false);
}
function runSecondary() {
  source.value?.secondaryAction?.run();
}

function fallbackDownload() {
  toast.success('已开始下载（演示）');
}

function isPlatform(value: unknown): value is Platform {
  return (
    value === 'TikTok' ||
    value === 'Instagram' ||
    value === 'YouTube' ||
    value === 'Facebook' ||
    value === 'X' ||
    value === 'LinkedIn'
  );
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      class="h-[min(94vh,900px)] max-h-[96vh] w-[min(1200px,calc(100vw-1rem))] max-w-none gap-0 overflow-hidden border-slate-200 bg-white p-0 sm:rounded-2xl"
    >
      <div
        class="grid h-full max-md:grid-rows-[minmax(0,1fr)_minmax(160px,36%)] md:grid-cols-[minmax(0,1fr)_300px]"
      >
        <!-- 左侧：媒体主视觉，高度随弹窗铺满 -->
        <div class="relative flex min-h-0 items-center justify-center bg-slate-950">
          <div
            class="relative mx-auto max-h-[calc(100%-1.25rem)] overflow-hidden rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            :class="
              isImage
                ? 'aspect-[3/4] h-full w-auto max-w-[min(100%,560px)]'
                : 'aspect-[9/16] h-full w-auto max-w-[min(100%,520px)]'
            "
            style="
              background:
                radial-gradient(circle at 30% 20%, rgba(56, 189, 248, 0.35), transparent 42%),
                radial-gradient(circle at 70% 80%, rgba(14, 165, 233, 0.25), transparent 40%),
                linear-gradient(160deg, #0f172a, #020617);
            "
          >
            <!-- 图片预览 -->
            <template v-if="isImage">
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
                <ImageIcon class="h-12 w-12 opacity-70" stroke-width="1.25" />
                <span class="text-sm tracking-wide text-white/55">图片预览</span>
              </div>
              <div
                class="pointer-events-none absolute inset-x-8 top-[18%] h-40 rounded-full bg-sky-400/15 blur-3xl"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
                <p class="truncate text-[13px] font-medium text-white/90">
                  {{ source?.title || '图片预览' }}
                </p>
                <p class="mt-0.5 text-[11px] text-white/50">{{ source?.typeLabel || '图片' }}</p>
              </div>
            </template>

            <!-- 视频预览 -->
            <template v-else>
              <button
                type="button"
                class="absolute inset-0 flex items-center justify-center"
                :aria-label="playing ? '暂停' : '播放'"
                @click="togglePlay"
              >
                <span
                  class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white backdrop-blur-sm transition hover:scale-105"
                >
                  <Pause v-if="playing" class="h-7 w-7" fill="currentColor" />
                  <Play v-else class="h-7 w-7 translate-x-0.5" fill="currentColor" />
                </span>
              </button>
              <div
                v-if="playing"
                class="pointer-events-none absolute inset-x-6 top-1/3 h-24 rounded-full bg-sky-400/20 blur-2xl"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3.5 pb-3.5 pt-14"
              >
                <button type="button" class="mb-2.5 h-1.5 w-full rounded-full bg-white/25" @click="seek">
                  <span
                    class="block h-full rounded-full bg-sky-400 transition-[width]"
                    :style="{ width: `${progress}%` }"
                  />
                </button>
                <div class="flex items-center justify-between text-[12px] text-white/85">
                  <div class="flex items-center gap-1.5">
                    <button type="button" class="rounded p-1 hover:bg-white/10" @click="togglePlay">
                      <Pause v-if="playing" class="h-3.5 w-3.5" />
                      <Play v-else class="h-3.5 w-3.5" />
                    </button>
                    <button type="button" class="rounded p-1 hover:bg-white/10" @click="muted = !muted">
                      <VolumeX v-if="muted" class="h-3.5 w-3.5" />
                      <Volume2 v-else class="h-3.5 w-3.5" />
                    </button>
                    <span class="tabular-nums">{{ currentLabel }} / {{ durationLabel }}</span>
                  </div>
                  <span class="rounded bg-white/15 px-1.5 py-0.5 text-[11px]">9:16</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 右侧：精简信息与操作 -->
        <div
          class="relative flex min-h-0 flex-col gap-3.5 overflow-y-auto border-t border-slate-100 p-4 pr-11 scroll-slim md:border-l md:border-t-0 md:p-5 md:pr-12"
        >
          <div>
            <DialogTitle class="text-[15px] font-semibold leading-snug text-slate-800">
              {{ source?.title || (isImage ? '图片预览' : '视频预览') }}
            </DialogTitle>
            <DialogDescription class="mt-1 text-[12px] leading-relaxed text-slate-400">
              {{ kindHint }}
            </DialogDescription>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <PlatformBadge v-if="isPlatform(source?.platform)" :platform="source.platform" />
            <Badge
              v-else-if="source?.platform"
              variant="outline"
              class="border-slate-200 text-[11px] font-normal text-slate-500"
            >
              {{ source.platform }}
            </Badge>
            <Badge
              v-if="source?.typeLabel"
              variant="outline"
              class="border-slate-200 text-[11px] font-normal text-slate-500"
            >
              {{ source.typeLabel }}
            </Badge>
            <Badge
              v-if="source?.status"
              variant="outline"
              class="border-sky-100 bg-sky-50 text-[11px] font-normal text-sky-600"
            >
              {{ source.status }}
            </Badge>
          </div>

          <div class="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-[12px]">
            <div v-if="source?.author" class="flex justify-between gap-3">
              <span class="text-slate-400">作者</span>
              <span class="truncate font-medium text-slate-700">{{ source.author }}</span>
            </div>
            <div v-if="source?.project" class="flex justify-between gap-3">
              <span class="text-slate-400">所属项目</span>
              <span class="truncate font-medium text-slate-700">{{ source.project }}</span>
            </div>
            <div v-if="source?.size" class="flex justify-between gap-3">
              <span class="text-slate-400">大小</span>
              <span class="font-medium text-slate-700">{{ source.size }}</span>
            </div>
            <div v-if="source?.updatedAt" class="flex justify-between gap-3">
              <span class="text-slate-400">更新</span>
              <span class="font-medium text-slate-700">{{ source.updatedAt }}</span>
            </div>
            <div v-if="source?.subtitle" class="flex justify-between gap-3">
              <span class="text-slate-400">时间</span>
              <span class="font-medium text-slate-700">{{ source.subtitle }}</span>
            </div>
            <div v-if="source?.duration && !isImage" class="flex justify-between gap-3">
              <span class="text-slate-400">时长</span>
              <span class="font-medium text-slate-700">{{ source.duration }}</span>
            </div>
          </div>

          <div
            v-if="source?.views || source?.likes || source?.comments || source?.shares"
            class="grid grid-cols-2 gap-1.5 text-[11.5px]"
          >
            <div v-if="source.views" class="rounded-lg border border-slate-100 px-2 py-1.5 text-slate-500">
              播放 <span class="font-semibold text-slate-800">{{ source.views }}</span>
            </div>
            <div v-if="source.likes" class="rounded-lg border border-slate-100 px-2 py-1.5 text-slate-500">
              点赞 <span class="font-semibold text-slate-800">{{ source.likes }}</span>
            </div>
            <div v-if="source.comments" class="rounded-lg border border-slate-100 px-2 py-1.5 text-slate-500">
              评论 <span class="font-semibold text-slate-800">{{ source.comments }}</span>
            </div>
            <div v-if="source.shares" class="rounded-lg border border-slate-100 px-2 py-1.5 text-slate-500">
              分享 <span class="font-semibold text-slate-800">{{ source.shares }}</span>
            </div>
          </div>

          <div v-if="source?.tags?.length" class="flex flex-wrap gap-1.5">
            <Badge
              v-for="tag in source.tags"
              :key="tag"
              variant="outline"
              class="border-slate-200 bg-white text-[11px] font-normal text-slate-500"
            >
              #{{ tag }}
            </Badge>
          </div>

          <div class="mt-auto flex flex-col gap-2 pt-1">
            <Button
              v-if="source?.primaryAction"
              size="sm"
              class="w-full gap-1.5 brand-gradient text-white hover:opacity-90"
              @click="runPrimary"
            >
              <Copy v-if="source.kind === 'inspiration'" class="h-3.5 w-3.5" />
              <Sparkles v-else-if="source.kind === 'generation'" class="h-3.5 w-3.5" />
              <FolderOpen v-else class="h-3.5 w-3.5" />
              {{ source.primaryAction.label }}
            </Button>
            <Button
              v-if="source?.secondaryAction"
              size="sm"
              variant="outline"
              class="w-full gap-1.5 border-slate-200 text-slate-600"
              @click="runSecondary"
            >
              {{ source.secondaryAction.label }}
            </Button>
            <Button
              v-if="!source?.primaryAction"
              size="sm"
              variant="outline"
              class="w-full gap-1.5 border-slate-200 text-slate-600"
              @click="fallbackDownload"
            >
              <Download class="h-3.5 w-3.5" />
              下载
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
