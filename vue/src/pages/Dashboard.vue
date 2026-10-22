<script setup lang="ts">
import { Sparkles, ArrowRight, Clock, Plus } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PageHeader, PlatformBadge, Thumb, Delta, HeatBar } from '@/components/shared';
import {
  kpis,
  exposureTrend,
  platformShare,
  tasks,
  aiSuggestions,
  inspirations,
  platformColors,
  type Platform,
} from '@/data/mock';
import { cn } from '@/lib/utils';
import { RouterLink } from 'vue-router';
import DataChart from '@/components/DataChart.vue';
const statusColor: Record<string, string> = {
  待发布: 'bg-sky-400/10 text-sky-600 border-sky-400/20',
  发布中: 'bg-sky-50 text-sky-600 border-sky-200',
  已完成: 'bg-emerald-400/10 text-emerald-600 border-emerald-400/20',
  已失败: 'bg-rose-400/10 text-rose-600 border-rose-400/20',
};
const running = tasks.filter((t) => t.status === '发布中' || t.status === '待发布').slice(0, 4);
const hot = inspirations.slice(0, 4);
const platformChartColors = platformShare.map((p) => platformColors[p.name as Platform]);
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="工作台" desc="下午好，林悦 👋 矩阵今日运行正常，4 个任务正在分发中">
      <template #extra>
        <RouterLink
          to="/projects/new"
          class="flex items-center gap-2 rounded-lg brand-gradient px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus class="h-4 w-4"></Plus>
          新建项目
        </RouterLink>
      </template>
    </PageHeader>
    <div class="grid grid-cols-4 gap-4">
      <template :key="k.label" v-for="k in kpis">
        <Card class="glass-card border-slate-200 p-5">
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-slate-500">{{ k.label }}</span>
            <Delta :value="k.delta" :up="k.up"></Delta>
          </div>
          <div class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {{ k.value }}
          </div>
          <div class="mt-1.5 text-[11px] text-slate-400">
            {{ k.hint }}
          </div>
        </Card>
      </template>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <Card class="glass-card col-span-2 border-slate-200 p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-[15px] font-medium text-slate-900">近 30 天曝光与互动趋势</h3>
            <p class="mt-0.5 text-[12px] text-slate-400">全矩阵 · 6 个平台汇总（单位：千次）</p>
          </div>
          <Badge variant="outline" class="border-emerald-400/20 bg-emerald-400/10 text-emerald-600">
            曝光 ↑ 34.2%
          </Badge>
        </div>
        <div class="h-64">
          <DataChart
            type="area"
            :data="exposureTrend"
            :series="[
              { name: '曝光', color: '#8b5cf6', type: 'area' },
              { name: '互动', color: '#22d3ee', type: 'area' },
            ]"
            :legend="false"
          />
        </div>
      </Card>
      <Card class="glass-card border-slate-200 p-5">
        <h3 class="text-[15px] font-medium text-slate-900">平台发布占比</h3>
        <p class="mt-0.5 text-[12px] text-slate-400">近 30 天内容分发结构</p>
        <div class="h-64">
          <DataChart
            type="pie"
            :data="platformShare"
            :series="[]"
            :legend="true"
            :colors="platformChartColors"
          />
        </div>
      </Card>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <Card class="glass-card relative overflow-hidden border-sky-200 p-5">
        <div class="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-50 blur-3xl"></div>
        <div class="flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-sky-600"></Sparkles>
          <h3 class="text-[15px] font-medium text-slate-900">AI 运营洞察</h3>
        </div>
        <div class="mt-4 space-y-3">
          <template :key="i" v-for="(s, i) in aiSuggestions">
            <div
              class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600"
            >
              {{ s }}
            </div>
          </template>
        </div>
      </Card>
      <Card class="glass-card col-span-2 border-slate-200 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-[15px] font-medium text-slate-900">进行中的任务</h3>
          <RouterLink to="/tasks" class="flex items-center gap-1 text-[12px] text-sky-600 hover:text-sky-600">
            全部任务
            <ArrowRight class="h-3.5 w-3.5"></ArrowRight>
          </RouterLink>
        </div>
        <div class="space-y-3">
          <template :key="t.title" v-for="t in running">
            <div class="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate text-[13px] font-medium text-slate-900">{{ t.title }}</span>
                  <Badge variant="outline" :class="cn('shrink-0 border', statusColor[t.status])">
                    {{ t.status }}
                  </Badge>
                </div>
                <div class="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{{ t.project }}</span>
                  <span>·</span>
                  <Clock class="h-3 w-3"></Clock>
                  <span>{{ t.schedule }}</span>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <template :key="p" v-for="p in t.platforms">
                  <PlatformBadge :platform="p"></PlatformBadge>
                </template>
              </div>
              <div class="w-32 shrink-0">
                <div class="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>分发进度</span>
                  <span class="text-slate-600">{{ t.progress }}%</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="brand-gradient h-full rounded-full transition-all"
                    :style="{
                      width: `${t.progress}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </Card>
    </div>
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-[15px] font-medium text-slate-900">今日高潜灵感</h3>
        <RouterLink
          to="/inspiration"
          class="flex items-center gap-1 text-[12px] text-sky-600 hover:text-sky-600"
        >
          进入灵感库
          <ArrowRight class="h-3.5 w-3.5"></ArrowRight>
        </RouterLink>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <template :key="v.title" v-for="v in hot">
          <Card class="glass-card group cursor-pointer overflow-hidden border-slate-200">
            <Thumb class="aspect-video w-full rounded-t-xl">
              <span
                class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85"
              >
                {{ v.duration }}
              </span>
              <span class="absolute left-2 top-2">
                <PlatformBadge :platform="v.platform"></PlatformBadge>
              </span>
            </Thumb>
            <div class="p-3">
              <div class="truncate text-[13px] font-medium text-slate-900">
                {{ v.title }}
              </div>
              <div class="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{{ v.author }} · {{ v.views }} 播放</span>
              </div>
              <div class="mt-2">
                <HeatBar :value="v.heat"></HeatBar>
              </div>
            </div>
          </Card>
        </template>
      </div>
    </div>
  </div>
</template>
