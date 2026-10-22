<script setup lang="ts">
import { Play } from 'lucide-vue-next';
import { Badge } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { type Generation } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import GenCard from '@/components/projects/GenCard.vue';
const statusStyle: Record<Generation['status'], string> = {
  已发布: 'bg-emerald-50 text-emerald-600',
  待发布: 'bg-amber-50 text-amber-600',
  草稿: 'bg-slate-100 text-slate-500',
};
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { view, generating, sections } = useProjectWorkspaceContext();
</script>

<template>
  <div class="space-y-6">
    <template :key="s.day" v-for="s in sections">
      <section>
        <div class="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-slate-700">
          {{ s.day }}
          <span class="text-[11.5px] font-normal text-slate-400">{{ s.items.length }} 项</span>
        </div>
        <template v-if="view === 'grid'">
          <div class="grid grid-cols-4 gap-3">
            <template v-if="s.day === '今天' && generating">
              <div class="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50">
                <div class="thumb-gradient h-full w-full rounded-xl opacity-40"></div>
              </div>
            </template>
            <template :key="g.id" v-for="g in s.items"><GenCard :g="g"></GenCard></template>
          </div>
        </template>
        <template v-else>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="w-full text-left text-[12.5px]">
              <thead>
                <tr class="border-b border-slate-100 text-[11.5px] text-slate-400">
                  <th class="px-4 py-2.5 font-normal">名称</th>
                  <th class="w-16 px-2 py-2.5 font-normal">类型</th>
                  <th class="w-28 px-2 py-2.5 font-normal">平台</th>
                  <th class="w-20 px-2 py-2.5 font-normal">状态</th>
                  <th class="w-24 px-4 py-2.5 text-right font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                <template :key="g.title" v-for="g in s.items">
                  <tr class="border-b border-slate-50 last:border-0 hover:bg-sky-50/40">
                    <td class="max-w-72 truncate px-4 py-2.5 font-medium text-slate-700">
                      {{ g.title }}
                    </td>
                    <td class="px-2 py-2.5 text-slate-500">
                      {{ g.type }}
                    </td>
                    <td class="px-2 py-2.5">
                      <PlatformBadge :platform="g.platform"></PlatformBadge>
                    </td>
                    <td class="px-2 py-2.5">
                      <Badge :class="cn('border-0 text-[10.5px]', statusStyle[g.status])">
                        {{ g.status }}
                      </Badge>
                    </td>
                    <td class="px-4 py-2.5 text-right">
                      <button
                        @click="toast.info('预览（演示）')"
                        class="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600"
                      >
                        <Play class="h-4 w-4"></Play>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </template>
    <template v-if="sections.length === 0 && !generating">
      <p class="py-16 text-center text-[13px] text-slate-400">还没有生成内容，在下方描述想法开始创作</p>
    </template>
  </div>
</template>
