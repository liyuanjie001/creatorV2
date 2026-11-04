<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Card } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import ComingSoonMask from '@/components/ComingSoonMask.vue';
import { useAnalyticsWorkspace } from '@/composables/useAnalyticsWorkspace';
import { platforms } from '@/data/mock';
import { DEMO_TODAY, roxyProjects } from '@/data/windowDemo';
import type { ReportDays } from '@/types/windows';
import OverviewPanel from '@/components/analytics/OverviewPanel.vue';
import AccountsPanel from '@/components/analytics/AccountsPanel.vue';
import ContentPanel from '@/components/analytics/ContentPanel.vue';
import ComparisonPanel from '@/components/analytics/ComparisonPanel.vue';
import AnalyticsDetails from '@/components/analytics/AnalyticsDetails.vue';
const router = useRouter();
const showComingSoon = ref(false);
const {
  manager,
  tab,
  project,
  windowId,
  platform,
  days,
  projectWindows,
  summary,
  selectProject,
  clearFilters,
} = useAnalyticsWorkspace();
const ranges: ReportDays[] = [7, 30, 90];
const tabs = [
  { key: 'overview', label: '总览' },
  { key: 'accounts', label: '账号监测' },
  { key: 'content', label: '内容明细' },
  { key: 'compare', label: '对比分析' },
] as const;
function changeProject(event: Event) {
  if (event.target instanceof HTMLSelectElement) selectProject(event.target.value);
}
</script>
<template>
  <div class="relative -mx-8 -my-6 min-h-[calc(100vh-24px)]">
  <div class="space-y-5 px-8 py-6" :class="showComingSoon && 'pointer-events-none select-none'">
    <PageHeader title="数据分析" desc="统一查看账号与内容表现，按窗口、账号、视频和平台分析对比">
      <template #title-extra>
        <ComingSoonMask @open="showComingSoon = true" />
      </template>
      <template #extra>
        <Button
          size="sm"
          variant="outline"
          class="border-slate-200 text-slate-600"
          @click="router.push('/roxy')"
        >
          管理窗口
        </Button>
      </template>
    </PageHeader>
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
    >
      <div class="flex items-center gap-2 text-[11px] text-slate-400">
        <span class="rounded bg-sky-50 px-2 py-1 font-medium text-sky-600">演示数据</span>
        <span>统计截至 {{ DEMO_TODAY }} · 来源和采集条件见指标提示</span>
      </div>
      <div class="flex gap-1">
        <button
          v-for="range in ranges"
          :key="range"
          :aria-pressed="days === range"
          class="rounded-md px-3 py-1.5 text-[12px]"
          :class="days === range ? 'brand-gradient text-white' : 'text-slate-500 hover:bg-slate-50'"
          @click="days = range"
        >
          近 {{ range }} 天
        </button>
      </div>
    </div>
    <template v-if="manager.bound.value">
      <div
        class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[12px] text-slate-500"
      >
        <label class="flex items-center gap-2">
          项目
          <select :value="project" aria-label="分析项目" class="analytics-select" @change="changeProject">
            <option value="all">全部已同步项目</option>
            <option
              v-for="p in roxyProjects.filter((p) => manager.selectedProjectIds.value.includes(p.id))"
              :key="p.id"
              :value="p.workspaceProjectId"
            >
              {{ p.name }}
            </option>
          </select>
        </label>
        <label class="flex items-center gap-2">
          窗口
          <select v-model="windowId" aria-label="分析窗口" class="analytics-select max-w-56">
            <option value="all">全部窗口</option>
            <option v-for="w in projectWindows" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2">
          平台
          <select v-model="platform" aria-label="分析平台" class="analytics-select">
            <option value="all">全部平台</option>
            <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <button class="ml-auto text-sky-600" @click="clearFilters">清除筛选</button>
      </div>
      <div class="flex gap-6 border-b border-slate-200">
        <button
          v-for="item in tabs"
          :key="item.key"
          class="border-b-2 px-1 pb-3 text-[13px] font-medium"
          :class="
            tab === item.key
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          "
          @click="tab = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <p
        v-if="!summary.complete"
        role="status"
        class="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] leading-6 text-amber-700"
      >
        当前区间已覆盖 {{ summary.included }}/{{
          summary.total
        }}
        条视频。未采集、采集失败或历史不足的内容不计入数值，汇总显示覆盖范围。
      </p>
      <OverviewPanel v-if="tab === 'overview'" />
      <AccountsPanel v-else-if="tab === 'accounts'" />
      <ContentPanel v-else-if="tab === 'content'" />
      <ComparisonPanel v-else />
    </template>
    <Card
      v-else
      class="items-center gap-3 border-dashed border-slate-200 bg-white py-20 text-center shadow-none"
    >
      <h2 class="text-lg font-medium text-slate-700">先同步窗口，再查看内容表现</h2>
      <p class="text-[13px] text-slate-400">在窗口管理中绑定 RoxyBrowser，并选择要同步的项目。</p>
      <Button class="brand-gradient mt-2 text-white" @click="router.push('/roxy')">去同步窗口</Button>
    </Card>
    <AnalyticsDetails />
  </div>
  <ComingSoonMask
    v-if="showComingSoon"
    mode="page"
    title="数据分析 · 敬请期待"
    desc="跨窗口、账号与平台看清表现，投放决策更有据。多维对比、爆款洞察与统一口径即将开放，帮助你把预算押在真正拉新的素材上；当前可先预览演示看板，正式上线后指标将自动接入。"
    :highlights="['多维对比', '爆款洞察', '统一口径']"
    @back="showComingSoon = false"
  />
  </div>
</template>
<style scoped>
.analytics-select {
  @apply h-8 rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-600 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100;
}
</style>
