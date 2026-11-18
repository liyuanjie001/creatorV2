<script setup lang="ts">
import {
  purchasePacks,
  getPurchaseQuote,
  getRechargeBenefits,
  creditsBalance,
  currentPackageKey,
  createRechargeOrder,
  type RechargeOrder,
  type PaymentChannel,
  type PurchasePackKey,
} from '@/services/credits';
import { toast } from 'vue-sonner';
import { completePurchase, PurchaseSyncError } from '@/services/purchasedAccounts';
import { useRoute, useRouter } from 'vue-router';
import AccountPurchaseInfo from '@/components/studio/AccountPurchaseInfo.vue';
import PackageBenefits from '@/components/PackageBenefits.vue';
import EnterpriseServices from '@/components/studio/EnterpriseServices.vue';
import { MessageCircle, Check } from 'lucide-vue-next';
import { Card, Button, Badge, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { computed, ref } from 'vue';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';

const accountSelections = ref<Record<string, boolean>>({ p500: true, p1000: true, p2000: true, p5000: true });
const paidPacks = computed(() =>
  Object.entries(purchasePacks).map(([key, pack]) => ({
    ...pack,
    ...getPurchaseQuote(key as PurchasePackKey, { includeAccounts: accountSelections.value[key] }),
    key: key as PurchasePackKey,
    price: '¥' + pack.amount.toLocaleString(),
    tag: 'tag' in pack ? pack.tag : '',
    description: 'description' in pack ? pack.description : '',
    includedAccountCount: pack.accountCount,
    benefits: 'benefits' in pack ? getRechargeBenefits(pack) : [],
    kind: pack.credits && pack.accountCount ? 'bundle' : pack.credits ? 'credits' : 'accounts',
    custom: false,
  })),
);
const customPack = computed(() => ({ ...paidPacks.value[0]!, price: '定制化', custom: true }));
type RechargePack = (typeof paidPacks.value)[number];
const purchaseTabs = [
  { key: 'bundle', label: '套餐' },
  { key: 'credits', label: '积分充值' },
] as const;
const router = useRouter();
const route = useRoute();
const activePurchaseTab = computed({
  get: () => (route.query.tab === 'credits' ? 'credits' : 'bundle'),
  set: (value: string) => {
    void router.replace({ path: '/purchase', query: value === 'credits' ? { tab: 'credits' } : {} });
  },
});
function viewAccounts() {
  paymentOpen.value = false;
  void router.push('/accounts');
}

const contactOpen = ref(false);
const selectedPack = ref<RechargePack | null>(null);
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

function openRecharge(pack: RechargePack) {
  selectedPack.value = pack;
  if (pack.custom) {
    contactOpen.value = true;
    return;
  }
  try {
    order.value = createRechargeOrder(pack.key, { includeAccounts: accountSelections.value[pack.key] });
    deliveryError.value = '';
    paymentChannel.value = 'alipay';
    paymentOpen.value = true;
  } catch (error) {
    toast.error((error as Error).message);
  }
}

function changePaymentAccounts(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  if (
    !selectedPack.value ||
    selectedPack.value.kind !== 'bundle' ||
    order.value?.status !== 'pending' ||
    paying.value
  )
    return;
  try {
    const nextOrder = createRechargeOrder(selectedPack.value.key, { includeAccounts: checkbox.checked });
    accountSelections.value[selectedPack.value.key] = checkbox.checked;
    order.value = nextOrder;
  } catch (error) {
    checkbox.checked = order.value.purchaseMode !== 'creditsOnly';
    toast.error((error as Error).message);
  }
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
    <Button v-if="activePurchaseTab === 'credits'" variant="outline" @click="activePurchaseTab = 'bundle'">
      返回套餐
    </Button>

    <div class="mx-auto max-w-[1180px] space-y-8">
      <EnterpriseServices @contact="openRecharge(customPack)" />

      <TabsRoot v-model="activePurchaseTab" class="space-y-5" aria-label="购买与充值">
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
        <TabsContent
          v-for="tab in purchaseTabs"
          :key="tab.key"
          :value="tab.key"
          class="space-y-4 outline-none"
        >
          <div class="grid grid-cols-1 items-stretch sm:grid-cols-2 gap-3 pt-3 md:grid-cols-4">
            <Card
              v-for="pack in paidPacks.filter((item) => item.kind === tab.key)"
              :key="pack.key"
              :aria-label="`${pack.price} ${tab.label}`"
              :class="
                cn(
                  'relative flex h-full min-w-0 flex-col gap-0 overflow-visible border-slate-200 bg-white p-4 pb-6 pt-4 shadow-sm shadow-slate-200/30',
                  pack.tag === '热门推荐' && 'border-sky-300 ring-1 ring-sky-200',
                  pack.tag === '高性价比' && 'border-amber-300 ring-1 ring-amber-200',
                )
              "
            >
              <Badge
                v-if="pack.key === currentPackageKey"
                class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-sky-600 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm shadow-sky-200"
              >
                当前版本
              </Badge>
              <Badge
                v-else-if="pack.tag === '热门推荐'"
                class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-sky-500 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm shadow-sky-200"
              >
                热门推荐
              </Badge>
              <Badge
                v-else-if="pack.tag === '高性价比'"
                class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-amber-500 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm shadow-amber-200"
              >
                高性价比
              </Badge>

              <div v-if="tab.key === 'bundle'" class="pt-2 text-left">
                <h3 class="text-2xl font-medium leading-8 tracking-tight text-slate-900">
                  {{ pack.priceLabel }}
                </h3>
                <p class="mt-2 text-xs leading-5 text-slate-500">{{ pack.description }}</p>
              </div>
              <span v-else class="absolute right-3 top-3 text-[11px] leading-none text-slate-400">
                {{ pack.priceLabel }}
              </span>

              <div
                class="flex flex-col justify-end"
                :class="tab.key === 'bundle' ? 'mt-5' : 'min-h-[3.75rem] pt-4'"
              >
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                    {{ pack.price }}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                :class="
                  cn(
                    'mt-4 w-full shrink-0',
                    pack.tag === '热门推荐' && 'brand-gradient text-white hover:opacity-90',
                    pack.tag === '高性价比' &&
                      'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
                    !pack.tag && 'border-slate-200 text-slate-700 hover:border-sky-200 hover:text-sky-600',
                  )
                "
                :variant="pack.tag === '热门推荐' ? 'default' : 'outline'"
                @click="openRecharge(pack)"
              >
                {{ tab.key === 'credits' ? '立即充值' : '购买套餐' }}
              </Button>

              <div
                v-if="pack.credits > 0"
                class="mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-3 text-center"
              >
                <div
                  class="flex items-center justify-center text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900"
                >
                  {{ pack.credits.toLocaleString() }}
                  <span class="ml-1 text-[11px] font-normal tracking-normal text-slate-400">个积分</span>
                </div>
                <p v-if="pack.videoCount !== undefined" class="mt-2 text-[11px] leading-4 text-slate-500">
                  约可生成视频 {{ pack.videoCount.toLocaleString() }} 个
                </p>
              </div>

              <div
                v-if="tab.key === 'bundle'"
                class="mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-3 text-center"
                aria-label="套餐社媒帐号权益"
              >
                <div class="flex items-center justify-center gap-1">
                  <label
                    class="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-900"
                  >
                    <input
                      v-model="accountSelections[pack.key]"
                      type="checkbox"
                      class="h-4 w-4 shrink-0 accent-sky-500"
                    />
                    包含
                    <span
                      class="text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900"
                    >
                      {{ pack.includedAccountCount }}
                    </span>
                    个账号使用权
                  </label>
                  <AccountPurchaseInfo v-if="pack.accountCount > 0" />
                </div>
                <p v-if="pack.accountCount > 0" class="mt-2 text-[11px] leading-4 text-slate-500">
                  美国 TikTok 账号，付款后自动到账
                </p>
                <p v-else class="mt-2 text-[11px] leading-4 text-sky-600" role="status">账号已兑换为积分</p>
              </div>

              <PackageBenefits v-if="tab.key === 'bundle'" :benefits="pack.benefits" />
            </Card>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>

    <Dialog v-model:open="paymentOpen">
      <DialogContent
        class="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto rounded-2xl border-slate-200 bg-white p-6 text-center sm:p-7"
        @open-auto-focus="focusPayment"
      >
        <DialogTitle class="text-lg text-slate-900">
          {{
            order?.status === 'completed'
              ? deliveryError
                ? '支付已完成'
                : '支付成功'
              : order?.credits === 0
                ? '购买账号'
                : selectedPack?.kind === 'bundle'
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
            <p class="text-3xl font-semibold text-slate-900">¥{{ order.amount }}</p>
            <p v-if="order.credits > 0" class="mt-2 text-sm text-slate-500">
              到账 {{ order.credits.toLocaleString() }} 积分
            </p>
            <div v-if="selectedPack?.kind === 'bundle'" class="mt-3 border-t border-slate-200 pt-3">
              <div class="flex items-center justify-center gap-1">
                <label class="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-900">
                  <input
                    type="checkbox"
                    :checked="order.purchaseMode !== 'creditsOnly'"
                    :disabled="paying"
                    class="h-4 w-4 shrink-0 accent-sky-500"
                    @change="changePaymentAccounts"
                  />
                  包含
                  <span class="text-[20px] font-semibold leading-none tracking-tight tabular-nums">
                    {{ selectedPack.includedAccountCount }}
                  </span>
                  个账号使用权
                </label>
                <AccountPurchaseInfo v-if="(order.accountCount ?? 0) > 0" />
              </div>
              <p v-if="(order.accountCount ?? 0) > 0" class="mt-2 text-xs text-slate-500">
                美国 TikTok 账号，付款后自动到账
              </p>
              <p v-else class="mt-2 text-xs text-sky-600" role="status">账号已兑换为积分</p>
            </div>
            <template v-else-if="(order.accountCount ?? 0) > 0">
              <p class="mt-1 flex items-center justify-center text-sm text-sky-600">
                {{ order.accountCount }} 个账号使用权
                <AccountPurchaseInfo />
              </p>
              <p class="mt-2 text-xs text-slate-500">美国 TikTok 账号，付款后自动到账</p>
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
          <template v-if="selectedPack?.custom">定制化方案请扫码添加销售沟通需求。</template>
          <template v-else-if="selectedPack">
            已选「{{ selectedPack.price }}」充值档位，扫码添加后由销售协助完成充值。
          </template>
          <template v-else>扫码添加企业微信，由销售协助完成积分充值。</template>
        </DialogDescription>

        <div
          class="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
        >
          <img src="/wecom-qr.png" alt="企业微信二维码" class="h-full w-full object-contain" />
        </div>

        <p class="mt-4 text-[12.5px] leading-5 text-slate-400">
          {{
            selectedPack?.custom
              ? '使用微信扫一扫，沟通业务场景与定制需求。'
              : '使用微信扫一扫添加企业微信，备注充值档位即可。'
          }}
        </p>
      </DialogContent>
    </Dialog>
  </div>
</template>
