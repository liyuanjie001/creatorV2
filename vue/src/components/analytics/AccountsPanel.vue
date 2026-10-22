<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Card, Input } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import MetricValue from './MetricValue.vue';
import StageSelect from './StageSelect.vue';
import { useAnalyticsContext } from '@/composables/useAnalyticsWorkspace';
import { useAnalyticsStages } from '@/composables/useAnalyticsStages';
import { available, growthMetric, summarizeVideos, unavailable } from '@/lib/analytics';
import { formatCount } from '@/lib/windowMetrics';
import { operationStages } from '@/types/windows';
const { accounts, manager, days, accountVideos, accountDetailId } = useAnalyticsContext();
const stages = useAnalyticsStages();
const search = ref('');
const stage = ref('all');
const page = ref(1);
const rows = computed(() =>
  accounts.value
    .filter(
      (a) =>
        (stage.value === 'all' || stages.stageFor(a.id) === stage.value) &&
        `${a.name} ${a.handle}`.toLowerCase().includes(search.value.trim().toLowerCase()),
    )
    .map((account) => {
      const videos = accountVideos(account.id);
      const summary = summarizeVideos(videos, days.value);
      const values = videos
        .map((video) => summarizeVideos([video], days.value).metrics.views)
        .flatMap((value) => (value.kind === 'available' ? [value.value] : []))
        .sort((a, b) => a - b);
      const center = Math.floor(values.length / 2);
      const median = !summary.complete
        ? unavailable('历史不足', '样本中存在未完整采集的视频，暂不计算中位数')
        : !values.length
          ? unavailable('无可用样本', '账号暂无已发布视频')
          : available(
              values.length % 2 ? values[center] : (values[center - 1] + values[center]) / 2,
              `演示数据 · ${values.length} 条视频区间播放中位数`,
            );
      return { account, summary, median, growth: growthMetric(account) };
    }),
);
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / 8)));
watch([search, stage, accounts], () => {
  page.value = 1;
});
</script>
<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <Input
        v-model="search"
        aria-label="搜索分析账号"
        placeholder="搜索账号名称或用户名…"
        class="max-w-xs border-slate-200 bg-white text-[12px]"
      />
      <select
        v-model="stage"
        aria-label="筛选运营阶段"
        class="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600"
      >
        <option value="all">全部运营阶段</option>
        <option v-for="item in operationStages" :key="item">{{ item }}</option>
      </select>
      <span class="ml-auto text-[11px] text-slate-400">运营阶段为内部标签，与平台登录状态无关</span>
    </div>
    <p v-if="stages.storageUnavailable.value" role="status" class="text-[12px] text-amber-600">
      浏览器无法保存运营标签，本次会话仍可使用
    </p>
    <Card class="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[12px]">
          <thead class="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th class="px-5 py-3 font-normal">账号 / 平台</th>
              <th class="px-3 py-3 font-normal">所属窗口</th>
              <th class="px-3 py-3 font-normal">运营阶段</th>
              <th class="px-3 py-3 text-right font-normal">当前粉丝</th>
              <th class="px-3 py-3 text-right font-normal">周涨粉</th>
              <th class="px-3 py-3 text-right font-normal">区间播放中位</th>
              <th class="px-3 py-3 font-normal">登录状态</th>
              <th class="px-5 py-3 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows.slice((page - 1) * 8, page * 8)"
              :key="row.account.id"
              class="border-t border-slate-100 hover:bg-sky-50/30"
            >
              <td class="px-5 py-4">
                <button
                  class="font-medium text-slate-700 hover:text-sky-600"
                  @click="accountDetailId = row.account.id"
                >
                  {{ row.account.name }}
                </button>
                <p class="mt-1 text-[10px] text-slate-400">{{ row.account.handle }}</p>
                <div class="mt-1.5"><PlatformBadge :platform="row.account.platform" /></div>
              </td>
              <td class="max-w-40 px-3 py-4 text-[11px] leading-5 text-slate-500">
                <div v-for="window in manager.accountWindows(row.account.id)" :key="window.id">
                  {{ window.name }}
                </div>
                <span v-if="manager.accountWindows(row.account.id).length > 1" class="text-sky-600">
                  共用账号 · 数据去重
                </span>
              </td>
              <td class="px-3 py-4">
                <StageSelect
                  :account-id="row.account.id"
                  :label="`${row.account.name} ${row.account.platform}`"
                />
              </td>
              <td class="px-3 py-4 text-right tabular-nums text-slate-600">
                {{ formatCount(row.account.followers) }}
              </td>
              <td class="px-3 py-4 text-right text-slate-600"><MetricValue :datum="row.growth" /></td>
              <td class="px-3 py-4 text-right text-slate-600">
                <MetricValue :datum="row.median" />
                <span class="mt-1 block text-[10px] text-slate-400">
                  近 {{ days }} 天 · N={{ row.summary.total }}
                </span>
              </td>
              <td
                class="whitespace-nowrap px-3 py-4 text-[11px]"
                :class="row.account.status === '正常' ? 'text-emerald-600' : 'text-amber-600'"
              >
                {{ row.account.status }}
              </td>
              <td class="px-5 py-4 text-right">
                <button class="whitespace-nowrap text-sky-600" @click="accountDetailId = row.account.id">
                  查看账号
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="8" class="py-16 text-center text-slate-400">没有符合条件的账号</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        <span>共 {{ rows.length }} 个去重账号</span>
        <div class="flex gap-3">
          <button :disabled="page <= 1" class="disabled:opacity-30" @click="page--">上一页</button>
          {{ page }} / {{ pages }}
          <button :disabled="page >= pages" class="disabled:opacity-30" @click="page++">下一页</button>
        </div>
      </div>
    </Card>
  </div>
</template>
