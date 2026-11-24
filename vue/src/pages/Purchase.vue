<script setup lang="ts">
import {
  creditOnlyPacks,
  creditsBalance,
  createRechargeOrder,
  createSubscriptionOrder,
  formatSubscriptionDate,
  rechargePacks,
  subscriptionEditions,
  subscriptionPeriods,
  type RechargeOrder,
  type PaymentChannel,
  type RechargePackKey,
  type SubscriptionOptions,
} from '@/services/credits';
import { toast } from 'vue-sonner';
import { completePurchase, PurchaseSyncError } from '@/services/purchasedAccounts';
import { useRoute, useRouter } from 'vue-router';
import AccountPurchaseInfo from '@/components/studio/AccountPurchaseInfo.vue';
import InfoTip from '@/components/studio/InfoTip.vue';
import SubscriptionPlans from '@/components/studio/SubscriptionPlans.vue';
import { purchaseFaqs } from '@/data/purchaseFaqs';
import EnterpriseServices from '@/components/studio/EnterpriseServices.vue';
import { MessageCircle, Check, ChevronDown } from 'lucide-vue-next';
import { Card, Button, Badge, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { computed, ref } from 'vue';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';

const creditPacks = (Object.keys(creditOnlyPacks) as (keyof typeof creditOnlyPacks)[]).map((key) => {
  const pack = creditOnlyPacks[key];
  return { ...pack, key, price: money(pack.amount), tag: 'tag' in pack ? pack.tag : '' };
});
function money(amount: number) {
  return `¥${amount.toLocaleString('zh-CN')}`;
}
const router = useRouter();
const route = useRoute();
const purchaseTabs = [
  { key: 'bundle', label: '套餐' },
  { key: 'credits', label: '积分充值' },
] as const;
const activePurchaseTab = computed({
  get: () => route.query.tab === 'credits' ? 'credits' : 'bundle',
  set: (value: string) => {
    void router.replace({ query: { ...route.query, tab: value === 'credits' ? 'credits' : undefined } });
  },
});
function viewAccounts() {
  paymentOpen.value = false;
  void router.push('/accounts');
}

const contactOpen = ref(false);
const initialEdition = computed(() => route.query.edition === 'team' ? 'team' : 'personal');
const initialPeriod = computed(() => route.query.period === 'year' ? 'year' : 'quarter');
let paymentTrigger: HTMLElement | null = null;
function restorePaymentFocus(event: Event) {
  if (!paymentTrigger?.isConnected) return;
  event.preventDefault();
  paymentTrigger.focus();
}
const paymentOpen = ref(false);
const paymentChannel = ref<PaymentChannel>('alipay');
const order = ref<RechargeOrder | null>(null);
const paying = ref(false);
const deliveryError = ref('');
const channelName = computed(() => (paymentChannel.value === 'alipay' ? '支付宝' : '微信'));
function focusPayment(event: Event) {
  event.preventDefault();
  (event.target as HTMLElement).querySelector<HTMLElement>('[data-payment-channel]')?.focus();
}
async function pay() {
  if (!order.value || paying.value || (order.value.status === 'completed' && !deliveryError.value)) return;
  paying.value = true;
  try {
    order.value = completePurchase(order.value.id, paymentChannel.value);
    deliveryError.value = '';
  } catch (error) {
    if (error instanceof PurchaseSyncError) {
      order.value = error.order;
      deliveryError.value = error.message;
    } else toast.error((error as Error).message);
  } finally {
    paying.value = false;
  }
}

function openPayment(createOrder: () => RechargeOrder) {
  try {
    order.value = createOrder();
    paymentTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    deliveryError.value = '';
    paymentChannel.value = 'alipay';
    paymentOpen.value = true;
  } catch (error) {
    toast.error((error as Error).message);
  }
}
function openSubscription(tier: RechargePackKey, options: SubscriptionOptions) {
  openPayment(() => createSubscriptionOrder(tier, options));
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="activePurchaseTab === 'credits' ? '积分充值' : '套餐购买'"
      :desc="
        activePurchaseTab === 'credits'
          ? '选择充值档位，付款后积分自动到账'
          : '选择适合你的版本；所选账号使用权付款后自动到账'
      "
    />
    <div class="mx-auto max-w-[1360px] space-y-6">
      <TabsRoot v-model="activePurchaseTab" :unmount-on-hide="false" class="min-w-0 space-y-6" aria-label="购买与充值">
        <TabsList class="flex gap-6 border-b border-slate-200" aria-label="购买类型">
          <TabsTrigger
            v-for="tab in purchaseTabs"
            :key="tab.key"
            :value="tab.key"
            class="-mb-px border-b-2 border-transparent px-1 pb-3 pt-1 text-sm font-medium text-slate-500 transition hover:text-sky-600 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600"
          >
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bundle" class="min-w-0 space-y-8 outline-none">
          <SubscriptionPlans :initial-edition="initialEdition" :initial-period="initialPeriod" @purchase="openSubscription">
            <EnterpriseServices @contact="contactOpen = true" />
          </SubscriptionPlans>
          <section aria-labelledby="purchase-faq" class="space-y-4">
            <h2 id="purchase-faq" class="text-xl font-semibold text-slate-900">常见问题</h2>
            <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              <details v-for="{ question, answer } in purchaseFaqs" :key="question" class="group px-4 sm:px-5">
                <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-slate-900 focus-visible:outline-sky-500 [&::-webkit-details-marker]:hidden">
                  {{ question }}
                  <ChevronDown class="h-4 w-4 shrink-0 text-sky-600 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p class="pb-4 text-sm leading-6 text-slate-600">{{ answer }}</p>
              </details>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="credits" class="outline-none">
          <div class="grid grid-cols-1 items-stretch gap-3 pt-3 sm:grid-cols-2 md:grid-cols-4">
            <Card
              v-for="pack in creditPacks"
              :key="pack.key"
              :aria-label="`${pack.price} 积分充值`"
              :class="cn(
                'relative flex h-full min-w-0 flex-col gap-0 overflow-visible border-slate-200 bg-white p-4 pb-6 shadow-sm shadow-slate-200/30',
                pack.tag === '热门推荐' && 'border-sky-300 ring-1 ring-sky-200',
                pack.tag === '高性价比' && 'border-amber-300 ring-1 ring-amber-200',
              )"
            >
              <Badge
                v-if="pack.tag"
                :class="cn(
                  'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 border-0 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm',
                  pack.tag === '热门推荐' ? 'bg-sky-500 shadow-sky-200' : 'bg-amber-500 shadow-amber-200',
                )"
              >
                {{ pack.tag }}
              </Badge>
              <span class="absolute right-3 top-3 text-[11px] leading-none text-slate-400">{{ pack.priceLabel }}</span>
              <div class="flex min-h-[3.75rem] flex-col justify-end pt-4">
                <span class="text-[28px] font-semibold leading-none tracking-tight text-slate-900">{{ pack.price }}</span>
              </div>
              <Button
                size="sm"
                :class="cn(
                  'mt-4 w-full shrink-0',
                  pack.tag === '热门推荐' && 'brand-gradient text-white hover:opacity-90',
                  pack.tag === '高性价比' && 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
                  !pack.tag && 'border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-600',
                )"
                :variant="pack.tag === '热门推荐' ? 'default' : 'outline'"
                @click="openPayment(() => createRechargeOrder(pack.key))"
              >
                立即充值
              </Button>
              <div class="mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-3 text-center">
                <div class="flex items-center justify-center text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
                  {{ pack.credits.toLocaleString() }}
                  <span class="ml-1 text-[11px] font-normal tracking-normal text-slate-400">个积分</span>
                  <InfoTip text="积分有效期说明">积分有效期为一年。</InfoTip>
                </div>
                <p class="mt-2 text-[11px] leading-4 text-slate-500">
                  约可生成视频 {{ pack.videoCount.toLocaleString() }} 个
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>

    <Dialog v-model:open="paymentOpen">
      <DialogContent
        class="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto rounded-2xl border-slate-200 bg-white p-6 text-center sm:p-7"
        @open-auto-focus="focusPayment"
        @close-auto-focus="restorePaymentFocus"
      >
        <DialogTitle class="text-lg text-slate-900">
          {{
            order?.status === 'completed'
              ? deliveryError
                ? '支付已完成'
                : '支付成功'
              : order?.subscription
                ? '套餐购买'
                : '积分充值'
          }}
        </DialogTitle>
        <DialogDescription class="text-sm text-slate-500">演示支付，不会实际扣款</DialogDescription>
        <template v-if="order?.status === 'completed'">
          <Check
            v-if="!deliveryError"
            class="mx-auto h-12 w-12 rounded-full bg-emerald-50 p-2 text-emerald-600"
          />
          <template v-if="order.credits > 0">
            <p class="text-base font-medium text-slate-800">
              已到账 {{ order.credits.toLocaleString() }} 积分
            </p>
            <p class="text-sm text-slate-500">最新余额：{{ creditsBalance.toLocaleString() }} 积分</p>
          </template>
          <p v-if="order.subscription?.startsAt && order.subscription.endsAt" class="text-sm leading-6 text-slate-600">
            订阅周期 {{ formatSubscriptionDate(order.subscription.startsAt) }} 至 {{ formatSubscriptionDate(order.subscription.endsAt) }}
          </p>
          <template v-if="(order.accountCount ?? 0) > 0">
            <template v-if="deliveryError">
              <p role="alert" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {{ deliveryError }}
              </p>
              <Button class="brand-gradient w-full text-white" :disabled="paying" @click="pay">
                {{ paying ? '同步中…' : '重试账号同步' }}
              </Button>
            </template>
            <template v-else>
              <p class="flex items-center justify-center text-base font-medium text-sky-700">
                已到账 {{ order.accountCount ?? 0 }} 个账号
                <AccountPurchaseInfo />
              </p>
              <p class="text-sm text-slate-500">已添加至账号管理</p>
              <Button class="brand-gradient w-full text-white" @click="viewAccounts">查看账号</Button>
            </template>
            <Button variant="outline" class="w-full" @click="paymentOpen = false">关闭</Button>
          </template>
          <Button v-else class="brand-gradient w-full text-white" @click="paymentOpen = false">完成</Button>
        </template>
        <template v-else-if="order">
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-3xl font-semibold text-slate-900">{{ money(order.amount) }}</p>
            <p v-if="order.credits > 0" class="mt-2 text-sm text-slate-500">
              到账 {{ order.credits.toLocaleString() }} 积分
            </p>
            <template v-if="order.subscription">
              <p class="mt-2 text-sm font-medium text-slate-900">
                {{ subscriptionEditions[order.subscription.edition] }} ·
                {{ rechargePacks[order.pack as RechargePackKey].priceLabel }} ·
                {{ subscriptionPeriods[order.subscription.period] }}
              </p>
              <dl class="mt-3 space-y-2 border-t border-slate-200 pt-3 text-left text-xs text-slate-700">
                <div class="flex justify-between gap-2"><dt>套餐基础价</dt><dd>{{ money(order.subscription.baseAmount) }}</dd></div>
                <div class="flex justify-between gap-2">
                  <dt class="flex items-center gap-1">账号使用权 {{ order.accountCount }} 个 <AccountPurchaseInfo v-if="order.accountCount" /></dt>
                  <dd>{{ money(order.subscription.accountAmount) }}</dd>
                </div>
                <div v-if="order.subscription.edition === 'team'" class="flex justify-between gap-2">
                  <dt>团队席位 {{ order.subscription.seats }} 席（另计本人）</dt><dd>{{ money(order.subscription.seatAmount) }}</dd>
                </div>
                <div v-else><dt>限本人使用</dt><dd class="sr-only">个人版</dd></div>
              </dl>
              <p v-if="order.accountCount" class="mt-2 text-xs text-slate-600">美国 TikTok 账号，付款后自动到账</p>
            </template>
          </div>
          <div class="flex gap-2" role="group" aria-label="支付方式">
            <button
              v-for="channel in ['alipay', 'wechat'] as const"
              :key="channel"
              type="button"
              data-payment-channel
              class="h-10 flex-1 rounded-lg border text-sm"
              :class="
                paymentChannel === channel
                  ? 'border-sky-500 bg-sky-50 font-medium text-sky-600'
                  : 'border-slate-200 text-slate-600'
              "
              :aria-pressed="paymentChannel === channel"
              @click="paymentChannel = channel"
            >
              {{ channel === 'alipay' ? '支付宝' : '微信支付' }}
            </button>
          </div>
          <div class="mx-auto rounded-xl border border-slate-200 bg-white p-4">
            <img
              :src="`/demo-${paymentChannel}-qr.svg`"
              :alt="`${channelName}演示支付二维码`"
              class="h-36 w-36 [image-rendering:pixelated] sm:h-44 sm:w-44"
            />
          </div>
          <p class="text-sm text-slate-500">使用{{ channelName }}扫一扫 · 示例二维码</p>
          <Button class="brand-gradient w-full text-white" :disabled="paying" @click="pay">
            模拟支付成功
          </Button>
          <Button v-if="order.subscription" variant="outline" class="w-full" :disabled="paying" @click="paymentOpen = false">
            返回修改
          </Button>
        </template>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="contactOpen">
      <DialogContent class="max-w-sm rounded-2xl border-slate-200 bg-white p-7 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <MessageCircle class="h-6 w-6" />
        </div>
        <DialogTitle class="mt-3 text-[18px] text-slate-900">添加企业微信联系销售</DialogTitle>
        <DialogDescription class="mt-1.5 text-[13px] leading-5 text-slate-500">
          定制化方案请扫码添加销售沟通需求。
        </DialogDescription>

        <div
          class="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
        >
          <img src="/wecom-qr.png" alt="企业微信二维码" class="h-full w-full object-contain" />
        </div>

        <p class="mt-4 text-[12.5px] leading-5 text-slate-400">
          使用微信扫一扫，沟通业务场景与定制需求。
        </p>
      </DialogContent>
    </Dialog>
  </div>
</template>
