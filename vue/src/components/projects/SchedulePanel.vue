<script setup lang="ts">
import { Plus, CalendarClock } from 'lucide-vue-next';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { projectTasks } = useProjectWorkspaceContext();
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <p class="text-[12.5px] text-slate-400">按排期自动发布到已绑定账号，失败自动重试并通知</p>
      <Button
        size="sm"
        class="gap-1.5 brand-gradient text-[12px] text-white hover:opacity-90"
        @click="toast.success('新建调度（演示）')"
      >
        <Plus class="h-3.5 w-3.5"></Plus>
        新建调度
      </Button>
    </div>
    <div class="space-y-2">
      <template :key="t.title" v-for="t in projectTasks">
        <div class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span
            :class="
              cn(
                'h-2 w-2 shrink-0 rounded-full',
                t.status === '发布中'
                  ? 'bg-sky-500'
                  : t.status === '待发布'
                    ? 'bg-amber-400'
                    : t.status === '已完成'
                      ? 'bg-emerald-500'
                      : 'bg-rose-500',
              )
            "
          ></span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13px] font-medium text-slate-800">
              {{ t.title }}
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
              <CalendarClock class="h-3 w-3"></CalendarClock>
              {{ t.schedule }}
              <span class="flex gap-1">
                <template :key="p" v-for="p in t.platforms">
                  <PlatformBadge :platform="p"></PlatformBadge>
                </template>
              </span>
            </div>
          </div>
          <Badge variant="outline" class="shrink-0 border-slate-200 text-[11px] font-normal text-slate-500">
            {{ t.status }}
          </Badge>
          <div class="hidden w-32 shrink-0 md:block">
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="brand-gradient h-full rounded-full"
                :style="{
                  width: `${t.progress}%`,
                }"
              ></div>
            </div>
            <div class="mt-1 text-right text-[10.5px] text-slate-400">{{ t.progress }}%</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="shrink-0 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900"
            @click="toast.info('调度详情（演示）')"
          >
            详情
          </Button>
        </div>
      </template>
      <template v-if="projectTasks.length === 0">
        <p class="py-16 text-center text-[13px] text-slate-400">该项目暂无调度任务</p>
      </template>
    </div>
  </div>
</template>
