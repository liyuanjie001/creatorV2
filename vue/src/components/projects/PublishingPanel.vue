<script setup lang="ts">
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { type Generation } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
const statusStyle: Record<Generation['status'], string> = {
  已发布: 'bg-emerald-50 text-emerald-600',
  待发布: 'bg-amber-50 text-amber-600',
  草稿: 'bg-slate-100 text-slate-500',
};
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { related } = useProjectWorkspaceContext();
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <table class="w-full text-left text-[12.5px]">
      <thead>
        <tr class="border-b border-slate-100 text-[11.5px] text-slate-400">
          <th class="px-4 py-2.5 font-normal">内容</th>
          <th class="w-28 px-2 py-2.5 font-normal">平台</th>
          <th class="w-28 px-2 py-2.5 font-normal">排期时间</th>
          <th class="w-20 px-2 py-2.5 font-normal">状态</th>
          <th class="w-36 px-4 py-2.5 text-right font-normal">操作</th>
        </tr>
      </thead>
      <tbody>
        <template :key="g.title" v-for="(g, i) in related">
          <tr class="border-b border-slate-50 last:border-0 hover:bg-sky-50/40">
            <td class="max-w-72 truncate px-4 py-2.5 font-medium text-slate-700">
              {{ g.title }}
            </td>
            <td class="px-2 py-2.5">
              <PlatformBadge :platform="g.platform"></PlatformBadge>
            </td>
            <td class="px-2 py-2.5 text-slate-500">
              {{ ['今天 20:00', '明天 09:30', '明天 18:00', '10-23 12:00', '10-24 20:00'][i % 5] }}
            </td>
            <td class="px-2 py-2.5">
              <Badge :class="cn('border-0 text-[10.5px]', statusStyle[g.status])">{{ g.status }}</Badge>
            </td>
            <td class="px-4 py-2.5 text-right">
              <Button
                size="sm"
                variant="outline"
                class="mr-1.5 h-7 border-slate-200 px-3 text-[11.5px] text-slate-500 hover:text-slate-900"
                @click="toast.info('调整排期（演示）')"
              >
                改期
              </Button>
              <Button
                size="sm"
                class="h-7 brand-gradient px-3 text-[11.5px] text-white hover:opacity-90"
                @click="toast.success('已加入发布队列（演示）')"
              >
                发布
              </Button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <template v-if="related.length === 0">
      <p class="py-16 text-center text-[13px] text-slate-400">暂无待发布内容</p>
    </template>
  </div>
</template>
