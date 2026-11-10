<script setup lang="ts">
import { Eye, Download } from 'lucide-vue-next';
import { PlatformBadge, Thumb } from '@/components/shared';
import { type Generation } from '@/data/mock';
import { toast } from 'vue-sonner';
import { useVideoPlayer } from '@/composables/useVideoPlayer';

const { g } = defineProps<{
  g: Generation;
}>();

const { openGeneration } = useVideoPlayer();

function openPlayer() {
  openGeneration(g, {
    primaryAction: {
      label: '去发布',
      run: () => toast.success('已加入发布任务（演示）'),
    },
    secondaryAction: {
      label: '下载',
      run: () => toast.success('已开始下载（演示）'),
    },
  });
}
</script>

<template>
  <div
    class="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-slate-200"
    @click="openPlayer"
  >
    <Thumb class="h-full w-full">
      <span class="absolute left-2 top-2"><PlatformBadge :platform="g.platform" /></span>
    </Thumb>
    <div
      class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <button
        type="button"
        title="查看"
        class="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600"
        @click.stop="openPlayer"
      >
        <Eye class="h-3.5 w-3.5" />
        查看
      </button>
      <button
        type="button"
        title="下载"
        class="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600"
        @click.stop="toast.success('已开始下载（演示）')"
      >
        <Download class="h-3.5 w-3.5" />
        下载
      </button>
    </div>
    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8">
      <div class="truncate text-[12px] font-medium text-white">
        {{ g.title }}
      </div>
      <div class="mt-1 flex items-center justify-between text-[10px] text-white/80">
        <span>{{ g.duration ? `时长: ${g.duration}` : g.day }}</span>
        <span class="rounded bg-white/20 px-1.5 py-0.5 text-white/90">{{ g.type }}</span>
      </div>
    </div>
  </div>
</template>
