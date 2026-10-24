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
      return '视频预览';
  }
});

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function togglePlay() {
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
      class="max-h-[92vh] w-[min(820px,calc(100vw-1.5rem))] max-w-none overflow-hidden border-slate-200 bg-white p-0 sm:rounded-2xl"
    >
      <div class="grid max-h-[92vh] md:grid-cols-[auto_minmax(260px,1fr)]">
        <!-- 左侧：整列铺满视频 -->
        <div class="flex items-center justify-center bg-slate-950 p-3 sm:p-4">
          <div
            class="relative aspect-[9/16] h-[min(84vh,640px)] overflow-hidden rounded-xl"
            style="
              background:
                radial-gradient(circle at 30% 20%, rgba(56, 189, 248, 0.35), transparent 42%),
                radial-gradient(circle at 70% 80%, rgba(14, 165, 233, 0.25), transparent 40%),
                linear-gradient(160deg, #0f172a, #020617);
            "
          >
            <button
              type="button"
              class="absolute inset-0 flex items-center justify-center"
              :aria-label="playing ? '暂停' : '播放'"
              @click="togglePlay"
            >
              <span
                class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white backdrop-blur-sm transition hover:scale-105"
              >
                <Pause v-if="playing" class="h-6 w-6" fill="currentColor" />
                <Play v-else class="h-6 w-6 translate-x-0.5" fill="currentColor" />
              </span>
            </button>
            <div
              v-if="playing"
              class="pointer-events-none absolute inset-x-6 top-1/3 h-20 rounded-full bg-sky-400/20 blur-2xl"
            />
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-12">
              <button type="button" class="mb-2 h-1.5 w-full rounded-full bg-white/25" @click="seek">
                <span
                  class="block h-full rounded-full bg-sky-400 transition-[width]"
                  :style="{ width: `${progress}%` }"
                />
              </button>
              <div class="flex items-center justify-between text-[11px] text-white/85">
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
                <span class="rounded bg-white/15 px-1.5 py-0.5">9:16</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：标题 / 标签 / 信息 / 操作 -->
        <div class="relative flex min-h-0 flex-col gap-4 overflow-y-auto p-5 pr-12 pt-5 md:p-6 md:pr-14">
          <div>
            <DialogTitle class="text-[17px] font-semibold leading-snug text-slate-800">
              {{ source?.title || '视频预览' }}
            </DialogTitle>
            <DialogDescription class="mt-1.5 text-[12.5px] text-slate-400">
              {{ kindHint }}
            </DialogDescription>
          </div>

          <div class="flex flex-wrap items-center gap-2">
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

          <div class="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 text-[12.5px]">
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
            <div v-if="source?.duration" class="flex justify-between gap-3">
              <span class="text-slate-400">时长</span>
              <span class="font-medium text-slate-700">{{ source.duration }}</span>
            </div>
          </div>

          <div
            v-if="source?.views || source?.likes || source?.comments || source?.shares"
            class="grid grid-cols-2 gap-2 text-[12px]"
          >
            <div v-if="source.views" class="rounded-lg border border-slate-100 px-2.5 py-2 text-slate-500">
              播放 <span class="font-semibold text-slate-800">{{ source.views }}</span>
            </div>
            <div v-if="source.likes" class="rounded-lg border border-slate-100 px-2.5 py-2 text-slate-500">
              点赞 <span class="font-semibold text-slate-800">{{ source.likes }}</span>
            </div>
            <div v-if="source.comments" class="rounded-lg border border-slate-100 px-2.5 py-2 text-slate-500">
              评论 <span class="font-semibold text-slate-800">{{ source.comments }}</span>
            </div>
            <div v-if="source.shares" class="rounded-lg border border-slate-100 px-2.5 py-2 text-slate-500">
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

          <div class="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              v-if="source?.primaryAction"
              size="sm"
              class="gap-1.5 brand-gradient text-white hover:opacity-90"
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
              class="gap-1.5 border-slate-200 text-slate-600"
              @click="runSecondary"
            >
              {{ source.secondaryAction.label }}
            </Button>
            <Button
              v-if="!source?.primaryAction"
              size="sm"
              variant="outline"
              class="gap-1.5 border-slate-200 text-slate-600"
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
