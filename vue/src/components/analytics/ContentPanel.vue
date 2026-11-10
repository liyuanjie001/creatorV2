<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Card, Input } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import MetricValue from './MetricValue.vue';
import { useAnalyticsContext } from '@/composables/useAnalyticsWorkspace';
import { summarizeVideos, videoDiagnostics } from '@/lib/analytics';
import { metricOptions } from '@/lib/windowMetrics';
const { videos, accounts, days, videoDetailId } = useAnalyticsContext();
const search = ref('');
const page = ref(1);
const status = ref('all');
const rows = computed(() =>
  videos.value
    .map((video) => ({
      video,
      account: accounts.value.find((a) => a.id === video.accountId),
      summary: summarizeVideos([video], days.value),
    }))
    .filter(
      (row) =>
        `${row.video.title} ${row.account?.handle ?? ''}`
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()) &&
        (status.value === 'all' || (status.value === 'ready' ? row.summary.complete : !row.summary.complete)),
    ),
);
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / 8)));
watch([search, status, videos, days], () => {
  page.value = 1;
});
</script>
<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <Input
        v-model="search"
        aria-label="搜索分析视频"
        placeholder="搜索视频标题或账号…"
        class="max-w-sm border-slate-200 bg-white text-[12px]"
      />
      <select
        v-model="status"
        aria-label="筛选视频数据"
        class="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600"
      >
        <option value="all">全部采集状态</option>
        <option value="ready">区间数据完整</option>
        <option value="missing">数据待补齐</option>
      </select>
      <span class="ml-auto text-[11px] text-slate-400">当前区间表现，不代表推荐状态</span>
    </div>
    <Card class="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[12px]">
          <thead class="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th class="px-5 py-3 font-normal">视频 / 所属账号</th>
              <th v-for="item in metricOptions" :key="item.key" class="px-3 py-3 text-right font-normal">
                {{ item.label }}
              </th>
              <th class="px-3 py-3 text-right font-normal">完播率</th>
              <th class="px-3 py-3 font-normal">发布时间</th>
              <th class="px-5 py-3 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows.slice((page - 1) * 8, page * 8)"
              :key="row.video.id"
              class="border-t border-slate-100 hover:bg-sky-50/30"
            >
              <td class="max-w-80 px-5 py-4">
                <button
                  class="block max-w-full truncate text-left font-medium text-slate-700 hover:text-sky-600"
                  :title="row.video.title"
                  @click="videoDetailId = row.video.id"
                >
                  {{ row.video.title }}
                </button>
                <div class="mt-1.5 flex items-center gap-2">
                  <PlatformBadge v-if="row.account" :platform="row.account.platform" />
                  <span class="text-[10px] text-slate-400">{{ row.account?.handle }}</span>
                </div>
              </td>
              <td
                v-for="item in metricOptions"
                :key="item.key"
                class="whitespace-nowrap px-3 py-4 text-right text-slate-600"
              >
                <MetricValue :datum="row.summary.metrics[item.key]" />
              </td>
              <td class="px-3 py-4 text-right text-slate-600">
                <MetricValue
                  v-if="row.account"
                  :datum="videoDiagnostics(row.video, row.account).completion"
                  suffix="%"
                />
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-[11px] text-slate-400">
                {{ row.video.publishedAt }}
              </td>
              <td class="px-5 py-4 text-right">
                <button class="whitespace-nowrap text-sky-600" @click="videoDetailId = row.video.id">
                  查看详情
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="7" class="py-16 text-center text-slate-400">没有符合条件的视频</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        <span>共 {{ rows.length }} 条视频 · 播放按视频 ID 去重</span>
        <div class="flex gap-3">
          <button :disabled="page <= 1" class="disabled:opacity-30" @click="page--">上一页</button>
          {{ page }} / {{ pages }}
          <button :disabled="page >= pages" class="disabled:opacity-30" @click="page++">下一页</button>
        </div>
      </div>
    </Card>
  </div>
</template>
