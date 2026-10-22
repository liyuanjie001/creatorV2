<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Card, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import DataChart from '@/components/DataChart.vue';
import MetricValue from './MetricValue.vue';
import { useAnalyticsContext, type CompareDimension } from '@/composables/useAnalyticsWorkspace';
import { platforms } from '@/data/mock';
import type { Platform } from '@/types/domain';
import type { MetricKey, PublishedVideo } from '@/types/windows';
import { summarizeVideos, uniqueVideos } from '@/lib/analytics';
import { metricOptions, metricTrend } from '@/lib/windowMetrics';

const scope = useAnalyticsContext();
const { compareDimension: dimension, days, platform, accounts, windows, videos, manager } = scope;
const localPlatform = ref<Platform>('TikTok');
const effectivePlatform = computed(() => (platform.value === 'all' ? localPlatform.value : platform.value));
const tabs: { key: CompareDimension; name: string }[] = [
  { key: 'window', name: '按窗口' },
  { key: 'account', name: '按账号' },
  { key: 'video', name: '按视频' },
  { key: 'platform', name: '按平台' },
];
const metric = ref<MetricKey>('views');
const selected = ref<string[]>([]);
const notice = ref('');
const comparisonOpen = ref(false);
const page = ref(1);
const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];
interface Row {
  id: string;
  name: string;
  caption: string;
  videos: PublishedVideo[];
  platform?: Platform;
}
const eligibleAccounts = computed(() =>
  accounts.value.filter((a) => dimension.value === 'platform' || a.platform === effectivePlatform.value),
);
const rows = computed(() => {
  const accountVideos = (ids: string[]) => videos.value.filter((v) => ids.includes(v.accountId));
  let items: Row[];
  if (dimension.value === 'platform')
    items = platforms.map((p) => ({
      id: p,
      name: p,
      platform: p,
      caption: `${accounts.value.filter((a) => a.platform === p).length} 个去重账号`,
      videos: accountVideos(accounts.value.filter((a) => a.platform === p).map((a) => a.id)),
    }));
  else if (dimension.value === 'window')
    items = windows.value
      .filter((w) =>
        manager
          .windowAccounts(w.id)
          .some((a) => eligibleAccounts.value.some((candidate) => candidate.id === a.id)),
      )
      .map((w) => ({
        id: w.id,
        name: w.name,
        caption: `#${w.serial} · ${manager.projectForWindow(w.id)?.name ?? ''}`,
        videos: accountVideos(
          manager
            .windowAccounts(w.id)
            .filter((a) => a.platform === effectivePlatform.value)
            .map((a) => a.id),
        ),
      }));
  else if (dimension.value === 'account')
    items = eligibleAccounts.value.map((a) => ({
      id: a.id,
      name: a.name,
      caption: a.handle,
      platform: a.platform,
      videos: accountVideos([a.id]),
    }));
  else
    items = videos.value
      .filter((v) => eligibleAccounts.value.some((a) => a.id === v.accountId))
      .map((v) => ({
        id: v.id,
        name: v.title,
        caption: v.publishedAt,
        platform: effectivePlatform.value,
        videos: [v],
      }));
  return items
    .map((item) => ({ ...item, summary: summarizeVideos(item.videos, days.value) }))
    .sort((a, b) => {
      const left = a.summary.metrics[metric.value];
      const right = b.summary.metrics[metric.value];
      return (right.kind === 'available' ? right.value : -1) - (left.kind === 'available' ? left.value : -1);
    });
});
const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / 8)));
const pageRows = computed(() => rows.value.slice((page.value - 1) * 8, page.value * 8));
const chosen = computed(() => rows.value.filter((row) => selected.value.includes(row.id)));
const total = computed(() =>
  summarizeVideos(
    chosen.value.flatMap((row) => row.videos),
    days.value,
  ),
);
const hasOverlap = computed(
  () =>
    chosen.value.reduce((sum, row) => sum + row.videos.length, 0) >
    uniqueVideos(chosen.value.flatMap((row) => row.videos)).length,
);
const groups = computed(() =>
  chosen.value.map((row, i) => ({ name: `${i + 1}. ${row.name}`, videos: row.videos })),
);
const series = computed(() =>
  groups.value.map((group, i): { name: string; color: string; type: 'line' } => ({
    name: group.name,
    color: colors[i % colors.length],
    type: 'line',
  })),
);
watch(
  [
    dimension,
    scope.project,
    scope.windowId,
    platform,
    effectivePlatform,
    () => videos.value.map((v) => `${v.id}:${v.collection.kind}`).join(','),
    days,
  ],
  () => {
    selected.value = [];
    page.value = 1;
    comparisonOpen.value = false;
    notice.value = '';
  },
);
function toggle(id: string) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter((item) => item !== id);
    notice.value = '';
    return;
  }
  if (selected.value.length >= 4) {
    notice.value = '最多选择 4 项进行对比，请先取消一项。';
    return;
  }
  selected.value = [...selected.value, id];
}
</script>
<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex rounded-lg border border-slate-200 bg-slate-100/60 p-1">
        <button
          v-for="item in tabs"
          :key="item.key"
          :aria-pressed="dimension === item.key"
          class="rounded-md px-4 py-1.5 text-[12px]"
          :class="dimension === item.key ? 'bg-white font-medium text-sky-600 shadow-sm' : 'text-slate-500'"
          @click="dimension = item.key"
        >
          {{ item.name }}
        </button>
      </div>
      <label
        v-if="dimension !== 'platform' && platform === 'all'"
        class="ml-auto flex items-center gap-2 text-[12px] text-slate-500"
      >
        同平台对比
        <select
          v-model="localPlatform"
          aria-label="对比平台"
          class="h-8 rounded-md border border-slate-200 bg-white px-2"
        >
          <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
    </div>
    <Card class="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
      <div class="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h3 class="text-[14px] font-medium text-slate-800">
            {{
              dimension === 'platform'
                ? '平台整体表现'
                : `${effectivePlatform} · ${tabs.find((item) => item.key === dimension)?.name}对比`
            }}
          </h3>
          <p class="mt-1 text-[11px] text-slate-400">选择 2～4 项 · 历史不完整或缺少数据的项目不参与对比</p>
        </div>
        <div class="flex items-center gap-3 text-[12px]">
          <span class="text-slate-400">已选 {{ selected.length }} / 4</span>
          <button
            v-if="selected.length"
            class="text-slate-500"
            @click="
              selected = [];
              notice = '';
            "
          >
            清空选择
          </button>
          <Button
            size="sm"
            class="brand-gradient text-white"
            :disabled="selected.length < 2"
            @click="comparisonOpen = true"
          >
            对比表现
          </Button>
        </div>
      </div>
      <p v-if="notice" role="alert" class="bg-amber-50 px-5 py-2 text-[12px] text-amber-700">{{ notice }}</p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[12px]">
          <thead class="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th class="w-10 p-4"><span class="sr-only">选择对比项</span></th>
              <th class="px-2 py-3 font-normal">对比项</th>
              <th class="px-3 py-3 text-right font-normal">视频数</th>
              <th v-for="item in metricOptions" :key="item.key" class="px-4 py-3 text-right font-normal">
                <button @click="metric = item.key">
                  {{ item.label }}{{ metric === item.key ? ' ↓' : '' }}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.id" class="border-t border-slate-100 hover:bg-sky-50/30">
              <td class="p-4">
                <input
                  type="checkbox"
                  :checked="selected.includes(row.id)"
                  :disabled="!row.summary.complete || row.videos.length === 0"
                  :aria-label="`对比 ${row.name}`"
                  class="h-3.5 w-3.5 accent-sky-500"
                  @change="toggle(row.id)"
                />
              </td>
              <td class="max-w-80 px-2 py-3">
                <div class="flex items-center gap-2">
                  <PlatformBadge v-if="row.platform" :platform="row.platform" />
                  <span
                    v-if="dimension !== 'platform'"
                    class="truncate font-medium text-slate-700"
                    :title="row.name"
                  >
                    {{ row.name }}
                  </span>
                </div>
                <p class="mt-1 text-[11px] text-slate-400">{{ row.caption }}</p>
              </td>
              <td class="px-3 py-3 text-right tabular-nums text-slate-500">{{ row.videos.length }}</td>
              <td
                v-for="item in metricOptions"
                :key="item.key"
                class="whitespace-nowrap px-4 py-3 text-right text-slate-600"
              >
                <MetricValue :datum="row.summary.metrics[item.key]" />
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="py-14 text-center text-slate-400">暂无匹配数据，请调整筛选条件</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        <span>共 {{ rows.length }} 项</span>
        <div class="flex gap-3">
          <button :disabled="page <= 1" class="disabled:opacity-30" @click="page--">上一页</button>
          {{ page }} / {{ pageCount }}
          <button :disabled="page >= pageCount" class="disabled:opacity-30" @click="page++">下一页</button>
        </div>
      </div>
    </Card>
    <Dialog v-model:open="comparisonOpen">
      <DialogContent class="max-w-4xl rounded-2xl border-slate-200 bg-white">
        <DialogTitle>
          {{
            dimension === 'platform'
              ? '跨平台整体表现对比'
              : `${effectivePlatform} · ${dimension === 'window' ? '窗口' : dimension === 'account' ? '账号' : '视频'}表现对比`
          }}
        </DialogTitle>
        <DialogDescription class="text-[12px] text-slate-400">
          近 {{ days }} 天 · 演示数据 · {{ chosen.length }} 项。{{
            dimension === 'platform' ? '播放采用各平台原始口径，不代表去重人数。' : '同一平台、同一时间范围。'
          }}
        </DialogDescription>
        <div class="flex gap-1">
          <button
            v-for="item in metricOptions"
            :key="item.key"
            class="rounded px-3 py-1 text-[12px]"
            :class="metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'"
            @click="metric = item.key"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="h-64">
          <DataChart type="line" :data="metricTrend(groups, days, metric)" :series="series" />
        </div>
        <p v-if="hasOverlap" class="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-700">
          这些窗口包含共用账号，各行可分别查看；下方合计按视频 ID 去重，不能直接相加。
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="text-slate-400">
              <tr>
                <th class="py-3 font-normal">对比项</th>
                <th v-for="item in metricOptions" :key="item.key" class="px-3 py-3 text-right font-normal">
                  {{ item.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in chosen" :key="row.id" class="border-t border-slate-100">
                <td class="max-w-72 py-3 text-slate-700">
                  <span
                    class="mr-2 inline-block h-2 w-2 rounded-full"
                    :style="{ backgroundColor: colors[index] }"
                  />
                  {{ index + 1 }}. {{ row.name }}
                </td>
                <td v-for="item in metricOptions" :key="item.key" class="px-3 py-3 text-right text-slate-600">
                  <MetricValue :datum="row.summary.metrics[item.key]" />
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t border-slate-200 bg-sky-50/50 font-medium text-slate-700">
              <tr>
                <td class="px-2 py-3">所选 {{ chosen.length }} 项去重合计</td>
                <td v-for="item in metricOptions" :key="item.key" class="px-3 py-3 text-right">
                  <MetricValue :datum="total.metrics[item.key]" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
