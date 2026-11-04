<script setup lang="ts">
import { Plus, ArrowRight } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { PageHeader, PlatformBadge } from '@/components/shared';
import { useHomeProjects } from '@/composables/useHomeProjects';
const { homeProjects: projects } = useHomeProjects();
import { cn } from '@/lib/utils';
import { RouterLink } from 'vue-router';
const statusStyle: Record<string, string> = {
  进行中: 'bg-sky-50 text-sky-600',
  未开始: 'bg-slate-100 text-slate-500',
  已结束: 'bg-emerald-50 text-emerald-600',
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="全部项目" desc="跨平台宣发项目的统一视图">
      <template #extra>
        <RouterLink to="/projects/new">
          <Button size="sm" class="gap-2 brand-gradient text-white hover:opacity-90">
            <Plus class="h-4 w-4"></Plus>
            新建项目
          </Button>
        </RouterLink>
      </template>
    </PageHeader>
    <div class="grid grid-cols-3 gap-4">
      <template :key="p.id" v-for="p in projects">
        <Card class="glass-card group border-white/[0.07] p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2.5">
              <span
                class="h-9 w-9 rounded-xl"
                :style="{
                  backgroundColor: `${p.color}1a`,
                }"
              >
                <span class="flex h-full w-full items-center justify-center">
                  <span
                    class="h-3.5 w-3.5 rounded-[5px]"
                    :style="{
                      backgroundColor: p.color,
                    }"
                  ></span>
                </span>
              </span>
              <div>
                <div class="text-[14.5px] font-semibold text-slate-800">
                  {{ p.name }}
                </div>
                <div class="text-[11.5px] text-slate-400">
                  负责人 {{ p.owner }} · {{ p.start }} ~ {{ p.end }}
                </div>
              </div>
            </div>
            <Badge :class="cn('border-0 text-[11px]', statusStyle[p.status])">{{ p.status }}</Badge>
          </div>
          <p class="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
            {{ p.desc }}
          </p>
          <div class="mt-3 flex items-center gap-1.5">
            <template :key="pl" v-for="pl in p.platforms">
              <PlatformBadge :platform="pl"></PlatformBadge>
            </template>
          </div>
          <div class="mt-4">
            <div class="mb-1 flex justify-between text-[11.5px] text-slate-400">
              <span>整体进度</span>
              <span class="font-medium text-slate-600">{{ p.progress }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="brand-gradient h-full rounded-full"
                :style="{
                  width: `${p.progress}%`,
                }"
              ></div>
            </div>
          </div>
          <div
            class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] text-slate-400"
          >
            <span>
              曝光
              <span class="font-medium text-slate-700">{{ p.exposure }}</span>
            </span>
            <span>
              互动
              <span class="font-medium text-slate-700">{{ p.engagement }}</span>
            </span>
            <span>
              内容
              <span class="font-medium text-slate-700">{{ p.contentCount }} 条</span>
            </span>
            <RouterLink
              :to="`/projects/${p.id}`"
              class="flex items-center gap-0.5 font-medium text-sky-600 hover:text-sky-500"
            >
              详情
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"></ArrowRight>
            </RouterLink>
          </div>
        </Card>
      </template>
    </div>
  </div>
</template>
