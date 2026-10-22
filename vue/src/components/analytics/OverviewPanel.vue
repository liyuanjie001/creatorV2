<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, Button } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import DataChart from '@/components/DataChart.vue';
import MetricCards from './MetricCards.vue';
import MetricValue from './MetricValue.vue';
import { useAnalyticsContext } from '@/composables/useAnalyticsWorkspace';
import { useAnalyticsStages } from '@/composables/useAnalyticsStages';
import { summarizeVideos } from '@/lib/analytics';
import { metricOptions, metricTrend } from '@/lib/windowMetrics';
import { platforms } from '@/data/mock';
import type { MetricKey } from '@/types/windows';
const { accounts, windows, videos, days, summary, tab, compareDimension, accountDetailId } =
  useAnalyticsContext();
const metric = ref<MetricKey>('views');
const label = computed(() => metricOptions.find((item) => item.key === metric.value)?.label ?? '播放量');
const stages = useAnalyticsStages();
const platformRows = computed(() =>
  platforms
    .map((platform) => {
      const items = accounts.value.filter((a) => a.platform === platform);
      return {
        platform,
        accounts: items.length,
        summary: summarizeVideos(
          videos.value.filter((v) => items.some((a) => a.id === v.accountId)),
          days.value,
        ),
      };
    })
    .filter((row) => row.accounts > 0),
);
const reminders = computed(() =>
  accounts.value.flatMap((account) => {
    const items = videos.value.filter((v) => v.accountId === account.id);
    if (account.status === '登录失效')
      return [{ id: account.id, name: account.name, text: '登录失效，请先到窗口管理恢复登录' }];
    const missing = items.find((v) => v.collection.kind !== 'ready');
    if (missing)
      return [
        {
          id: account.id,
          name: account.name,
          text:
            missing.collection.kind === 'failed'
              ? '内容采集失败，可在账号详情中重试'
              : '首次识别内容，尚未采集表现数据',
        },
      ];
    if (!summarizeVideos(items, days.value).complete)
      return [{ id: account.id, name: account.name, text: '历史记录不足，当前区间仅有部分数据' }];
    return [];
  }),
);
</script>
<template>
  <div class="space-y-5">
    <dl
      aria-label="当前分析范围概况"
      class="grid grid-cols-2 gap-y-3 rounded-xl border border-slate-200/80 bg-white/60 py-3 sm:grid-cols-4"
    >
      <div
        v-for="stat in [
          { label: '当前管理账号', value: accounts.length, hint: '按平台账号 ID 去重' },
          { label: '关联窗口', value: windows.length, hint: '一个账号可关联多个窗口' },
          { label: '已识别视频', value: videos.length, hint: '当前管理范围的内容总数' },
          {
            label: '登录待恢复',
            value: accounts.filter((a) => a.status === '登录失效').length,
            hint: '与运营阶段独立统计',
          },
        ]"
        :key="stat.label"
        :title="stat.hint"
        class="flex min-w-0 flex-wrap items-baseline gap-x-2 px-4 sm:border-l sm:border-slate-200/80 sm:first:border-l-0"
      >
        <dt class="text-[12px] text-slate-500">{{ stat.label }}</dt>
        <dd class="text-lg font-semibold leading-6 tabular-nums text-slate-600">
          {{ stat.value }}
        </dd>
      </div>
    </dl>
    <MetricCards :metrics="summary.metrics" :caption="`近 ${days} 天增量 · 演示数据`" />
    <div class="grid grid-cols-3 gap-4">
      <Card class="col-span-2 gap-0 border-slate-200 bg-white p-5 shadow-none">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-[14px] font-medium text-slate-800">内容表现趋势</h3>
            <p class="mt-1 text-[11px] text-slate-400">
              统计已覆盖 {{ summary.included }} / {{ summary.total }} 条视频 · 缺少历史的内容未纳入
            </p>
          </div>
          <div class="flex gap-1">
            <button
              v-for="item in metricOptions"
              :key="item.key"
              class="rounded px-3 py-1.5 text-[12px]"
              :class="metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'"
              @click="metric = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div v-if="summary.videos.length" class="h-60">
          <DataChart
            type="line"
            :data="metricTrend([{ name: label, videos: summary.videos }], days, metric)"
            :series="[{ name: label, color: '#0ea5e9', type: 'area' }]"
          />
        </div>
        <div v-else class="flex h-60 items-center justify-center text-[13px] text-slate-400">
          暂无完整区间数据，调整筛选或采集范围后再查看
        </div>
      </Card>
      <Card class="gap-0 border-slate-200 bg-white p-5 shadow-none">
        <div class="flex items-center justify-between">
          <h3 class="text-[14px] font-medium text-slate-800">数据提醒</h3>
          <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-600">
            {{ reminders.length }}
          </span>
        </div>
        <div v-if="reminders.length" class="mt-3 space-y-3">
          <button
            v-for="item in reminders.slice(0, 4)"
            :key="item.id"
            class="w-full rounded-lg border border-slate-100 p-3 text-left hover:bg-sky-50/40"
            @click="accountDetailId = item.id"
          >
            <p class="text-[12px] font-medium text-slate-700">{{ item.name }}</p>
            <p class="mt-1 text-[11px] leading-5 text-slate-400">{{ item.text }}</p>
          </button>
        </div>
        <p v-else class="py-14 text-center text-[12px] text-slate-400">当前没有待处理的数据提醒</p>
      </Card>
    </div>
    <Card class="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 class="text-[14px] font-medium text-slate-800">平台表现</h3>
          <p class="mt-1 text-[11px] text-slate-400">
            播放与曝光采用不同口径，此处仅汇总播放，不表示去重人数
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="text-sky-600"
          @click="
            compareDimension = 'platform';
            tab = 'compare';
          "
        >
          查看平台对比
        </Button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[12px]">
          <thead class="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th class="px-5 py-3 font-normal">平台</th>
              <th class="px-4 py-3 text-right font-normal">账号数</th>
              <th class="px-4 py-3 text-right font-normal">视频数</th>
              <th v-for="item in metricOptions" :key="item.key" class="px-5 py-3 text-right font-normal">
                {{ item.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in platformRows" :key="row.platform" class="border-t border-slate-100">
              <td class="px-5 py-4"><PlatformBadge :platform="row.platform" /></td>
              <td class="px-4 py-4 text-right text-slate-500">{{ row.accounts }}</td>
              <td class="px-4 py-4 text-right text-slate-500">{{ row.summary.total }}</td>
              <td v-for="item in metricOptions" :key="item.key" class="px-5 py-4 text-right text-slate-600">
                <MetricValue :datum="row.summary.metrics[item.key]" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
    <p class="text-[11px] text-slate-400">
      运营阶段由团队手动维护：{{
        accounts.filter((a) => stages.stageFor(a.id) === '测试期').length
      }}
      个测试期，{{ accounts.filter((a) => stages.stageFor(a.id) === '放量期').length }}
      个放量期。未分阶段的账号不会自动推断为测试期。
    </p>
  </div>
</template>
