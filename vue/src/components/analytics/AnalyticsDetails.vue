<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import DataChart from '@/components/DataChart.vue';
import MetricCards from './MetricCards.vue';
import MetricValue from './MetricValue.vue';
import StageSelect from './StageSelect.vue';
import { useAnalyticsContext } from '@/composables/useAnalyticsWorkspace';
import { useDemoTimers } from '@/composables/useDemoTimers';
import { available, growthMetric, summarizeVideos, videoDiagnostics, unavailable } from '@/lib/analytics';
import { formatCount, metricOptions, metricTrend } from '@/lib/windowMetrics';
import type { MetricKey } from '@/types/windows';
const scope = useAnalyticsContext();
const { manager, accounts, days, accountDetailId, videoDetailId, manageAccount } = scope;
const account = computed(() => accounts.value.find((a) => a.id === accountDetailId.value));
const video = computed(() => manager.videos.value.find((v) => v.id === videoDetailId.value));
const videoAccount = computed(() => manager.accounts.value.find((a) => a.id === video.value?.accountId));
const accountVideos = computed(() => (account.value ? manager.accountVideos(account.value.id) : []));
const accountSummary = computed(() => summarizeVideos(accountVideos.value, days.value));
const videoSummary = computed(() => summarizeVideos(video.value ? [video.value] : [], days.value));
const diagnostics = computed(() =>
  video.value && videoAccount.value ? videoDiagnostics(video.value, videoAccount.value) : undefined,
);
const metric = ref<MetricKey>('views');
const metricLabel = computed(
  () => metricOptions.find((item) => item.key === metric.value)?.label ?? '播放量',
);
const busy = ref(false);
const { delay } = useDemoTimers();
let generation = 0;
watch(accountDetailId, () => {
  generation++;
  busy.value = false;
});
watch(videoDetailId, (id) => {
  if (id) accountDetailId.value = '';
});
function collect() {
  if (!account.value) return;
  const id = account.value.id;
  const run = generation;
  busy.value = true;
  delay(() => {
    if (run !== generation) return;
    busy.value = false;
    if (manager.retryCollection(id)) toast.success('演示采集完成，已有历史范围之外的数据不会补造');
    else toast.warning('请先到窗口管理恢复登录');
  }, 1100);
}
function openVideo(id: string) {
  accountDetailId.value = '';
  videoDetailId.value = id;
}
const profileViews = computed(() =>
  !account.value
    ? unavailable('未采集', '未选择账号')
    : account.value.platform === 'TikTok' && accountSummary.value.complete && accountSummary.value.total > 0
      ? available(4100, '演示数据 · 平台主页访客示例，非官网进站')
      : unavailable('未采集', '尚无该账号可验证的主页访问数据'),
);
</script>
<template>
  <Dialog
    :open="Boolean(account)"
    @update:open="
      (value) => {
        if (!value) accountDetailId = '';
      }
    "
  >
    <DialogContent class="max-w-4xl rounded-2xl border-slate-200 bg-white">
      <DialogTitle class="text-lg text-slate-800">{{ account?.name }} · 账号详情</DialogTitle>
      <DialogDescription class="text-[12px] text-slate-400">
        {{ account?.platform }} · {{ account?.handle }} · 平台账号 ID {{ account?.platformAccountId }}
      </DialogDescription>
      <template v-if="account">
        <div class="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
          <PlatformBadge :platform="account.platform" />
          <StageSelect :account-id="account.id" :label="`${account.name} ${account.platform}`" />
          <span
            class="text-[12px]"
            :class="account.status === '正常' ? 'text-emerald-600' : 'text-amber-600'"
          >
            登录：{{ account.status }}
          </span>
          <Button
            size="sm"
            variant="outline"
            class="ml-auto text-slate-500"
            @click="manageAccount(account.id)"
          >
            管理所属窗口
          </Button>
          <Button
            size="sm"
            class="brand-gradient text-white"
            :disabled="busy || account.status !== '正常'"
            @click="collect"
          >
            {{ busy ? '正在采集…' : '重新采集（演示）' }}
          </Button>
        </div>
        <div class="grid grid-cols-3 gap-3 text-[12px]">
          <div class="rounded-xl border border-slate-200 p-4">
            <p class="text-slate-400">当前粉丝</p>
            <p class="mt-2 text-xl font-semibold text-slate-700">{{ formatCount(account.followers) }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 p-4">
            <p class="text-slate-400">周涨粉</p>
            <div class="mt-2 text-xl font-semibold text-slate-700">
              <MetricValue :datum="growthMetric(account)" />
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 p-4">
            <p class="text-slate-400">平台主页访客 · 近 7 天</p>
            <div class="mt-2 text-xl font-semibold text-slate-700"><MetricValue :datum="profileViews" /></div>
          </div>
        </div>
        <MetricCards
          :metrics="accountSummary.metrics"
          :caption="`近 ${days} 天 · 已覆盖 ${accountSummary.included}/${accountSummary.total} 条视频`"
        />
        <div class="flex items-center justify-between">
          <h3 class="text-[13px] font-medium text-slate-700">账号内容趋势</h3>
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
        </div>
        <div v-if="accountSummary.videos.length" class="h-48">
          <DataChart
            type="line"
            :data="metricTrend([{ name: metricLabel, videos: accountSummary.videos }], days, metric)"
            :series="[{ name: metricLabel, color: '#0ea5e9', type: 'area' }]"
          />
        </div>
        <p v-else class="rounded-xl bg-slate-50 py-8 text-center text-[12px] text-slate-400">
          暂无完整的区间趋势数据
        </p>
        <div class="rounded-xl border border-slate-200 p-4">
          <h3 class="text-[13px] font-medium text-slate-700">粉丝画像</h3>
          <p
            v-if="account.platform === 'TikTok' && accountSummary.complete && accountSummary.total"
            class="mt-3 text-[12px] leading-7 text-slate-500"
          >
            女性 67% · 男性 33%
            <br />
            18–24 岁 31% · 25–34 岁 42% · 35 岁及以上 27%
            <br />
            主要地域：美国 41% · 英国 22% · 其他 37%
          </p>
          <p v-else class="mt-3 text-[12px] text-slate-400">— 未采集 · 当前没有可验证的粉丝画像数据</p>
          <p class="mt-2 text-[10px] text-slate-400">
            后台能力示例 · 粉丝画像与单条视频观众画像分开统计，真实采集需逐平台验证
          </p>
        </div>
        <div>
          <h3 class="mb-2 text-[13px] font-medium text-slate-700">
            账号视频 · {{ accountVideos.length }} 条
          </h3>
          <div class="max-h-44 divide-y divide-slate-100 overflow-y-auto">
            <button
              v-for="item in accountVideos"
              :key="item.id"
              class="flex w-full items-center justify-between gap-4 py-3 text-left text-[12px] text-slate-600 hover:text-sky-600"
              @click="openVideo(item.id)"
            >
              <span>{{ item.title }}</span>
              <span class="whitespace-nowrap text-[11px] text-slate-400">{{ item.publishedAt }} →</span>
            </button>
            <p v-if="!accountVideos.length" class="py-8 text-center text-[12px] text-slate-400">
              账号暂无已发布视频
            </p>
          </div>
        </div>
      </template>
    </DialogContent>
  </Dialog>
  <Dialog
    :open="Boolean(video)"
    @update:open="
      (value) => {
        if (!value) videoDetailId = '';
      }
    "
  >
    <DialogContent class="max-w-4xl rounded-2xl border-slate-200 bg-white">
      <DialogTitle class="pr-5 text-lg leading-7 text-slate-800">{{ video?.title }}</DialogTitle>
      <DialogDescription class="text-[12px] text-slate-400">
        {{ videoAccount?.platform }} · {{ videoAccount?.handle }} · {{ video?.publishedAt }} 发布 · 时长
        {{ video?.duration }}
      </DialogDescription>
      <template v-if="video && videoAccount && diagnostics">
        <div class="rounded-lg bg-sky-50 px-4 py-3 text-[12px] leading-6 text-sky-700">
          单条视频表现 · 近 {{ days }} 天 · 演示数据。缺失指标显示原因，不根据播放量推断平台推荐状态。
        </div>
        <MetricCards :metrics="videoSummary.metrics" :caption="`近 ${days} 天增量`" />
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="item in [
              { label: '前 3 秒留存', value: diagnostics.retention, suffix: '%' },
              { label: '完播率', value: diagnostics.completion, suffix: '%' },
              { label: '平均观看时长', value: diagnostics.averageWatch, suffix: ' 秒' },
              { label: '发布后 1 小时播放量', value: diagnostics.firstHour, suffix: '' },
            ]"
            :key="item.label"
            class="rounded-xl border border-slate-200 p-4"
          >
            <p class="text-[12px] text-slate-400">{{ item.label }}</p>
            <div class="mt-2 text-lg font-medium text-slate-700">
              <MetricValue :datum="item.value" :suffix="item.suffix" />
            </div>
            <p v-if="item.value.kind === 'unavailable'" class="mt-2 text-[11px] leading-5 text-slate-400">
              {{ item.value.detail }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-for="item in metricOptions"
            :key="item.key"
            class="rounded px-3 py-1.5 text-[12px]"
            :class="metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'"
            @click="metric = item.key"
          >
            {{ item.label }}
          </button>
          <span class="ml-auto text-[10px] text-slate-400">
            {{
              video.collection.kind === 'ready'
                ? `最近采集 ${video.collection.collectedAt.slice(0, 16).replace('T', ' ')} UTC`
                : '暂无有效采集时间'
            }}
          </span>
        </div>
        <div v-if="videoSummary.complete" class="h-52">
          <DataChart
            type="line"
            :data="metricTrend([{ name: metricLabel, videos: [video] }], days, metric)"
            :series="[{ name: metricLabel, color: '#0ea5e9', type: 'area' }]"
          />
        </div>
        <p v-else class="rounded-xl bg-slate-50 py-10 text-center text-[12px] text-slate-400">
          数据不完整，暂不展示该范围的趋势
        </p>
      </template>
    </DialogContent>
  </Dialog>
</template>
