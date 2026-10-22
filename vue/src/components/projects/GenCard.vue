<script setup lang="ts">
import { Play } from 'lucide-vue-next';
import { Badge } from '@/components/ui';
import { PlatformBadge, Thumb } from '@/components/shared';
import { type Generation } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
const statusStyle: Record<Generation['status'], string> = {
  已发布: 'bg-emerald-50 text-emerald-600',
  待发布: 'bg-amber-50 text-amber-600',
  草稿: 'bg-slate-100 text-slate-500',
};
const { g } = defineProps<{
  g: Generation;
}>();
</script>

<template>
  <div class="group relative aspect-video overflow-hidden rounded-xl border border-slate-200">
    <Thumb class="h-full w-full">
      <span class="absolute left-2 top-2"><PlatformBadge :platform="g.platform"></PlatformBadge></span>
      <span class="absolute right-2 top-2">
        <Badge :class="cn('border-0 text-[10px]', statusStyle[g.status])">{{ g.status }}</Badge>
      </span>
      <template v-if="g.duration">
        <span class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">
          {{ g.duration }}
        </span>
      </template>
    </Thumb>
    <div
      class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <button
        @click="toast.info('预览（演示）')"
        class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600"
      >
        <Play class="h-3.5 w-3.5" fill="currentColor"></Play>
      </button>
      <button
        @click="toast.success('已加入发布任务（演示）')"
        class="rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600"
      >
        去发布
      </button>
    </div>
    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-1.5 pt-6">
      <div class="truncate text-[11px] font-medium text-white">
        {{ g.title }}
      </div>
    </div>
  </div>
</template>
