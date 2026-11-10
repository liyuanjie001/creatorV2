<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { accountMetricTrend, accountTrendMetrics, type AccountTrendMetric } from '@/services/accountStatistics';
import type { TKAccount } from '@/types/studio';
use([SVGRenderer, LineChart, GridComponent, TooltipComponent]);
const props = defineProps<{ account: TKAccount }>();
const selected = ref<AccountTrendMetric>('views');
watch(() => props.account.id, () => { selected.value = 'views'; });
const metrics = computed(() => accountTrendMetrics.map((item) => ({ ...item, ...accountMetricTrend(props.account, item.key) })));
const active = computed(() => metrics.value.find((item) => item.key === selected.value)!);
const available = computed(() => active.value.points.some((p) => p.value !== undefined));
const number = (v?: number) => v === undefined ? '—' : v.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
const signed = (v?: number) => v === undefined ? '—' : `${v > 0 ? '+' : ''}${number(v)}`;
const option = computed(() => ({
  animation: false,
  tooltip: { trigger: 'axis', valueFormatter: (v: unknown) => typeof v === 'number' ? number(v) : '—' },
  grid: { left: 16, right: 55, top: 15, bottom: 28 },
  xAxis: {
    type: 'category', boundaryGap: false,
    data: active.value.points.map((p) => p.date),
    axisLine: { lineStyle: { color: '#cbd5e1' } }, axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (date: string) => `${Number(date.slice(5,7))}月${Number(date.slice(8))}日` },
  },
  yAxis: {
    type: 'value', position: 'right', minInterval: 1, splitNumber: 3,
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
  },
  series: [{
    name: active.value.label, type: 'line', data: active.value.points.map((p) => p.value ?? null),
    connectNulls: false, symbol: 'emptyCircle', symbolSize: 5,
    itemStyle: { color: '#1688ff' }, lineStyle: { width: 1.3 },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [{ offset: 0, color: 'rgba(22,136,255,0.18)' }, { offset: 1, color: 'rgba(22,136,255,0.01)' }] } },
  }],
}));
</script>
<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="近七天播放趋势">
    <div class="grid grid-cols-3 sm:grid-cols-6" aria-label="趋势指标">
      <button
        v-for="item in metrics" :key="item.key" type="button"
        class="relative min-w-0 border-r border-b border-slate-200 border-t-[3px] px-2 py-3 text-center transition-colors last:border-r-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
        :class="selected === item.key ? 'border-t-blue-500 bg-sky-50/20' : 'border-t-transparent hover:bg-slate-50'"
        :aria-pressed="selected === item.key" :aria-label="item.label"
        @click="selected = item.key"
      >
        <span v-if="selected === item.key" class="absolute inset-x-0 top-0 h-[3px] bg-blue-500" aria-hidden="true" />
        <span class="block text-xs font-medium text-slate-700">{{ item.label }}</span>
        <span class="mt-1 block text-xl font-medium tabular-nums" :class="selected === item.key ? 'text-blue-500' : 'text-slate-900'">{{ number(item.current) }}</span>
        <span class="mt-1 block text-[10px] tabular-nums text-slate-400" :title="item.key === 'followers' ? '较7天前' : '较前7天'">
          <span :class="item.change && item.change > 0 ? 'text-blue-500' : item.change && item.change < 0 ? 'text-rose-500' : ''">{{ signed(item.change) }}</span>
          ({{ item.percent === undefined ? '—' : signed(item.percent) + '%' }})
        </span>
      </button>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 px-4 pt-2 text-[10px] text-slate-400">
      <span>{{ active.points[0]?.date }} 至 {{ active.points[6]?.date }} · {{ selected === 'followers' ? '每日粉丝总数 · 较7天前' : '每日数据 · 较前7天' }}</span>
      <span v-if="account.statistics?.mock" class="text-sky-600">Mock 演示数据</span>
    </div>
    <VChart v-if="available" class="h-[200px] w-full" :option="option" autoresize :aria-label="active.label + '每日趋势图'" />
    <p v-else class="grid h-[200px] place-items-center text-sm text-slate-400">{{ selected === 'views' ? '暂无近七天播放数据' : '暂无该指标趋势数据' }}</p>
    <table v-if="available" class="sr-only" :aria-label="selected === 'views' ? '每日播放数据' : active.label + '每日数据'">
      <tbody><tr v-for="point in active.points" :key="point.date"><th>{{ point.date }}</th><td>{{ point.value ?? '—' }}</td></tr></tbody>
    </table>
  </section>
</template>
