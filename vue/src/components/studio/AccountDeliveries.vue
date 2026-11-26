<script setup lang="ts">
import { computed, ref } from 'vue';
import { accountCoupons, rechargeOrders, rechargePacks, formatSubscriptionDate, type RechargePackKey } from '@/services/credits';
import { studio } from '@/services/studio';
import { simulateCouponDelivery } from '@/services/purchasedAccounts';
import { demoPaymentsEnabled } from '@/lib/demoPayments';
import { Button } from '@/components/ui';
import { toast } from 'vue-sonner';

const busy = ref('');
const errors = ref<Record<string, string>>({});
const deliveries = computed(() => [...accountCoupons.value].reverse().map(coupon => {
  const order = rechargeOrders.value.find(item => item.id === coupon.orderId);
  const delivered = coupon.redemption.status === 'delivered' && coupon.redemption.accountIds.every(id => studio.value.accounts.some(item => item.id === id));
  return { ...coupon, delivered, allocated: coupon.redemption.status === 'delivered', name: order ? rechargePacks[order.pack as RechargePackKey]?.priceLabel ?? '套餐' : '套餐' };
}));
async function deliver(id: string) {
  if (busy.value) return;
  busy.value = id;
  delete errors.value[id];
  try {
    simulateCouponDelivery(id);
    toast.success('账号已到账，已添加至账号管理');
  } catch (error) {
    errors.value[id] = (error as Error).message;
  } finally { busy.value = ''; }
}
</script>

<template>
  <section v-if="deliveries.length" class="mb-6 rounded-xl border border-sky-100 bg-sky-50/40 p-5" aria-label="套餐账号到账进度">
    <h2 class="text-sm font-semibold text-slate-800">套餐账号到账进度</h2>
    <p class="mt-2 text-xs leading-6 text-slate-500">赠送的账号抵扣券已自动兑换，账号将在 3 个中国法定工作日内到账。</p>
    <div class="mt-4 space-y-3">
      <article v-for="item in deliveries" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-4" :aria-label="`${item.name}账号到账记录`">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm font-medium text-slate-700">{{ item.name }} · 抵扣券 1 张（已自动兑换 {{ item.accountCount }} 个账号）</p>
          <span class="rounded-full px-2 py-1 text-xs" :class="item.delivered ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">{{ item.delivered ? '已到账' : item.allocated ? '待同步至账号管理' : '待到账' }}</span>
        </div>
        <p class="mt-2 break-all text-xs text-slate-500">订单号：{{ item.orderId }}</p>
        <p class="mt-1 text-xs leading-6 text-slate-500">自动兑换时间：{{ formatSubscriptionDate(item.redeemedAt) }}</p>
        <p v-if="item.delivered" class="text-xs leading-6 text-slate-500">到账时间：{{ formatSubscriptionDate(item.redemption.deliveredAt!) }} · 已添加至账号管理</p>
        <p v-else class="text-xs leading-6 text-slate-500">{{ item.redemption.expectedAt ? `预计最迟 ${formatSubscriptionDate(item.redemption.expectedAt)} 到账` : '账号将在 3 个工作日内到账' }}</p>
        <p v-if="errors[item.id]" role="alert" class="mt-2 text-xs text-rose-600">{{ errors[item.id] }}</p>
        <Button v-if="demoPaymentsEnabled && !item.delivered" variant="outline" size="sm" class="mt-3" :disabled="!!busy" @click="deliver(item.id)">{{ busy === item.id ? '处理中…' : item.allocated ? '重试账号同步' : '模拟账号到账' }}</Button>
        <p v-if="demoPaymentsEnabled && !item.delivered" class="mt-1 text-[11px] text-slate-400">演示操作，用于查看账号到账后的效果</p>
      </article>
    </div>
  </section>
</template>
