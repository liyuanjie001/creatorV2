<script setup lang="ts">
import { Clock, MoreHorizontal } from 'lucide-vue-next';
import { PlatformBadge } from '@/components/shared';
import { type Task } from '@/data/mock';
const { task } = defineProps<{
  task: Task;
}>();
</script>

<template>
  <div
    class="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="text-[13px] font-medium leading-snug text-slate-900">
        {{ task.title }}
      </div>
      <button
        class="rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100"
      >
        <MoreHorizontal class="h-4 w-4"></MoreHorizontal>
      </button>
    </div>
    <div class="mt-1.5 text-[11px] text-slate-400">{{ task.id }} · {{ task.project }}</div>
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <template :key="p" v-for="p in task.platforms"><PlatformBadge :platform="p"></PlatformBadge></template>
    </div>
    <div
      class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-400"
    >
      <span class="flex items-center gap-1">
        <Clock class="h-3 w-3"></Clock>
        {{ task.schedule }}
      </span>
      <span>{{ task.owner }}</span>
    </div>
    <template v-if="task.status === '发布中'">
      <div class="mt-3">
        <div class="mb-1 flex justify-between text-[11px] text-slate-400">
          <span>分发进度</span>
          <span class="text-slate-600">{{ task.progress }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class="brand-gradient h-full rounded-full transition-all"
            :style="{
              width: `${task.progress}%`,
            }"
          ></div>
        </div>
      </div>
    </template>
  </div>
</template>
