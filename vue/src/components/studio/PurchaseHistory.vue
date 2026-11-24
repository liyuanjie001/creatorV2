<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ReceiptText, RefreshCw } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Card, Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { purchaseHistory } from '@/services/purchaseHistory';
import { refreshRechargeAccount, subscriptionStatus, formatSubscriptionDate } from '@/services/credits';
import { currentUser } from '@/services/identity';
const router = useRouter();
const page = ref(1);
const pageCount = computed(() => Math.max(1, Math.ceil(purchaseHistory.value.length / 10)));
const records = computed(() => purchaseHistory.value.slice((page.value - 1) * 10, page.value * 10));
watch(pageCount, (count) => {
  page.value = Math.min(page.value, count);
});
watch(
  () => currentUser.value?.id,
  () => {
    page.value = 1;
  },
);
const refreshing = ref(false);
const refreshError = ref('');
const selectedId = ref('');
const selected = computed(() => purchaseHistory.value.find((order) => order.id === selectedId.value));
const detailOpen = ref(false);
function view(id: string) {
  selectedId.value = id;
  detailOpen.value = true;
}
async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  refreshError.value = '';
  await nextTick();
  try {
    refreshRechargeAccount();
    toast.success('购买记录已刷新');
  } catch (error) {
    refreshError.value = (error as Error).message;
  } finally {
    refreshing.value = false;
  }
}
const formatDate = (value: string) =>
  new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
const amount = (value: number) => `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
const statusClass = (status: string) =>
  status === '已到账'
    ? 'bg-emerald-50 text-emerald-600'
    : status === '已支付'
      ? 'bg-sky-50 text-sky-600'
      : 'bg-amber-50 text-amber-600';
async function copyId() {
  try {
    await navigator.clipboard.writeText(selectedId.value);
    toast.success('订单号已复制');
  } catch {
    toast.error('复制失败，请手动选择订单号复制');
  }
}
function viewAccounts() {
  detailOpen.value = false;
  void router.push('/accounts');
}
</script>
<template>
  <Card class="mt-6 min-w-0 gap-5 p-5 sm:p-7" aria-label="购买记录">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-sm font-medium text-slate-800">
        <ReceiptText class="h-4 w-4 text-sky-500" aria-hidden="true" />
        购买记录
      </h2>
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-sky-600"
        :disabled="refreshing"
        @click="refresh"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="refreshing && 'animate-spin'" aria-hidden="true" />
        {{ refreshing ? '刷新中…' : '刷新订单' }}
      </Button>
    </div>
    <p v-if="refreshError" role="alert" class="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-700">
      {{ refreshError }}
    </p>
    <div
      v-if="!purchaseHistory.length"
      role="status"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center"
    >
      <ReceiptText class="h-8 w-8 text-slate-200" aria-hidden="true" />
      <p class="text-sm text-slate-500">暂无购买记录</p>
      <p class="text-xs leading-6 text-slate-400">套餐、积分充值及历史账号使用权订单将在这里展示。</p>
      <Button variant="outline" size="sm" @click="router.push('/purchase')">查看套餐</Button>
    </div>
    <template v-else>
      <div class="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
        <table class="w-full table-fixed text-left text-xs" aria-label="购买记录列表">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" class="w-[37%] px-4 py-3 font-medium">时间 / 订单号</th>
              <th scope="col" class="w-[31%] px-4 py-3 font-medium">金额 / 购买权益</th>
              <th scope="col" class="w-[16%] px-4 py-3 font-medium">支付方式</th>
              <th scope="col" class="w-[16%] px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="order in records"
              :key="order.id"
              class="align-top text-slate-700 hover:bg-slate-50/50"
            >
              <td class="px-4 py-4">
                <time class="block tabular-nums">{{ formatDate(order.createdAt) }}</time>
                <button
                  type="button"
                  class="mt-1.5 block w-full break-all text-left text-[11px] leading-5 text-slate-400 hover:text-sky-600 focus-visible:outline-sky-500"
                  :aria-label="`查看订单 ${order.id}`"
                  @click="view(order.id)"
                >
                  {{ order.id }}
                </button>
              </td>
              <td class="px-4 py-4">
                <p class="leading-5">
                  {{ amount(order.amount) }} / {{ order.credits.toLocaleString() }} 积分
                </p>
                <p class="mt-1 text-[11px] text-slate-400">{{ order.name }}</p>
                <p v-if="order.subscription" class="mt-2 text-xs leading-5 text-slate-700">
                  {{ subscriptionStatus(order) }} · {{ order.subscription.edition === 'team' ? `${order.subscription.seats} 席（另计本人）` : '限本人使用' }}
                  <span v-if="order.subscription.startsAt && order.subscription.endsAt" class="mt-1 block">
                    {{ formatSubscriptionDate(order.subscription.startsAt) }} 至 {{ formatSubscriptionDate(order.subscription.endsAt) }}
                  </span>
                </p>
                <p v-if="order.subscription || order.accountCount" class="mt-1.5 text-[11px] leading-5 text-slate-500">
                  账号使用权 {{ order.accountCount ?? 0 }} 个<span v-if="order.accountStatus"> · {{ order.accountStatus }}</span>
                </p>
                <p v-if="order.purchaseMode === 'creditsOnly'" class="mt-1 text-[11px] text-slate-400">
                  账号已兑换为积分
                </p>
              </td>
              <td class="px-4 py-4 leading-5">{{ order.paymentLabel }}</td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-[11px]"
                  :class="statusClass(order.statusLabel)"
                >
                  {{ order.statusLabel }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="space-y-3 md:hidden">
        <article
          v-for="order in records"
          :key="order.id"
          class="rounded-xl border border-slate-200 p-4"
          :aria-label="`购买记录 ${order.id}`"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-medium text-slate-800">{{ order.name }}</h3>
            <span class="rounded-full px-2 py-1 text-[11px]" :class="statusClass(order.statusLabel)">
              {{ order.statusLabel }}
            </span>
          </div>
          <p class="mt-3 text-sm font-medium tabular-nums text-slate-700">
            {{ amount(order.amount) }} / {{ order.credits.toLocaleString() }} 积分
          </p>
          <p v-if="order.subscription" class="mt-2 text-xs leading-5 text-slate-700">
            {{ subscriptionStatus(order) }} · {{ order.subscription.edition === 'team' ? `${order.subscription.seats} 席（另计本人）` : '限本人使用' }}
            <span v-if="order.subscription.startsAt && order.subscription.endsAt" class="mt-1 block">
              {{ formatSubscriptionDate(order.subscription.startsAt) }} 至 {{ formatSubscriptionDate(order.subscription.endsAt) }}
            </span>
          </p>
          <p v-if="order.subscription || order.accountCount" class="mt-2 text-xs leading-6 text-slate-500">
            账号使用权 {{ order.accountCount ?? 0 }} 个<span v-if="order.accountStatus"> · {{ order.accountStatus }}</span>
          </p>
          <p v-if="order.purchaseMode === 'creditsOnly'" class="mt-2 text-xs text-slate-400">
            账号已兑换为积分
          </p>
          <p class="mt-3 text-xs text-slate-400">{{ order.paymentLabel }}</p>
          <time class="mt-1 block text-[11px] tabular-nums text-slate-400">
            {{ formatDate(order.createdAt) }}
          </time>
          <button
            type="button"
            class="mt-2 block w-full break-all text-left text-[11px] leading-5 text-sky-600 focus-visible:outline-sky-500"
            :aria-label="`查看订单 ${order.id}`"
            @click="view(order.id)"
          >
            {{ order.id }}
          </button>
        </article>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <p>
          共 {{ purchaseHistory.length }} 条记录
          <span v-if="pageCount > 1">· 第 {{ page }} / {{ pageCount }} 页</span>
        </p>
        <div v-if="pageCount > 1" class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">上一页</Button>
          <Button variant="outline" size="sm" :disabled="page >= pageCount" @click="page++">下一页</Button>
        </div>
      </div>
    </template>
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto bg-white">
        <DialogTitle>购买记录详情</DialogTitle>
        <DialogDescription>查看订单金额、购买权益及到账状态</DialogDescription>
        <template v-if="selected">
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 text-xs leading-6">
            <dt class="text-slate-400">购买内容</dt>
            <dd>{{ selected.name }}</dd>
            <template v-if="selected.subscription">
              <dt class="text-slate-400">订阅状态</dt><dd>{{ subscriptionStatus(selected) }}</dd>
              <dt class="text-slate-400">团队席位</dt><dd>{{ selected.subscription.edition === 'team' ? `${selected.subscription.seats} 席（另计本人）` : '限本人使用' }}</dd>
              <template v-if="selected.subscription.startsAt && selected.subscription.endsAt">
                <dt class="text-slate-400">生效日期</dt><dd>{{ formatSubscriptionDate(selected.subscription.startsAt) }}</dd>
                <dt class="text-slate-400">到期日期</dt><dd>{{ formatSubscriptionDate(selected.subscription.endsAt) }}</dd>
              </template>
              <dt class="text-slate-400">基础价</dt><dd>{{ amount(selected.subscription.baseAmount) }}</dd>
              <dt class="text-slate-400">账号费用</dt><dd>{{ amount(selected.subscription.accountAmount) }}（{{ selected.accountCount ?? 0 }} 个）</dd>
              <template v-if="selected.subscription.edition === 'team'">
                <dt class="text-slate-400">席位费用</dt><dd>{{ amount(selected.subscription.seatAmount) }}</dd>
              </template>
            </template>
            <dt class="text-slate-400">订单号</dt>
            <dd class="break-all">
              {{ selected.id }}
              <button class="ml-2 text-sky-600" @click="copyId">复制订单号</button>
            </dd>
            <dt class="text-slate-400">创建时间</dt>
            <dd>{{ formatDate(selected.createdAt) }}</dd>
            <dt v-if="selected.completedAt" class="text-slate-400">支付时间</dt>
            <dd v-if="selected.completedAt">{{ formatDate(selected.completedAt) }}</dd>
            <dt class="text-slate-400">订单金额</dt>
            <dd>{{ amount(selected.amount) }}</dd>
            <dt class="text-slate-400">积分额度</dt>
            <dd>
              {{ selected.credits.toLocaleString() }} 积分
              <span v-if="selected.status === 'pending'" class="text-slate-400">（支付后到账）</span>
            </dd>
            <dt v-if="selected.accountCount" class="text-slate-400">账号使用权</dt>
            <dd v-if="selected.accountCount">
              {{ selected.accountCount }} 个 · {{ selected.accountStatus }}
            </dd>
            <dt class="text-slate-400">支付方式</dt>
            <dd>{{ selected.paymentLabel }}</dd>
            <dt class="text-slate-400">订单状态</dt>
            <dd>{{ selected.statusLabel }}</dd>
          </dl>
          <Button v-if="selected.status === 'completed' && selected.accountCount" @click="viewAccounts">
            {{ selected.deliveryMode === 'automatic' ? '查看账号' : '前往历史领取' }}
          </Button>
        </template>
        <p v-else class="text-sm text-slate-400">该记录已不在当前列表中，请关闭后刷新订单。</p>
        <Button variant="outline" @click="detailOpen = false">关闭</Button>
      </DialogContent>
    </Dialog>
  </Card>
</template>
