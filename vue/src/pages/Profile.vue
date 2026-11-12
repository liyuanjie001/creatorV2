<script setup lang="ts">
import {
  purchasePacks,
  socialAccountsTotal,
  socialAccountsClaimed,
  socialAccountsRemaining,
  creditsBalance,
  creditsTotal,
  createRechargeOrder,
  completeRecharge,
  type RechargeOrder,
  type PaymentChannel,
  type PurchasePackKey,
} from '@/services/credits';
import { toast } from 'vue-sonner';
import AccountClaimDialog from '@/components/studio/AccountClaimDialog.vue';
import UserSettings from '@/components/studio/UserSettings.vue';
import InfoTip from '@/components/studio/InfoTip.vue';
import { MessageCircle, Check } from 'lucide-vue-next';
import { Card, Button, Badge, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PageHeader, CreditsIcon } from '@/components/shared';
import { cn } from '@/lib/utils';
import { computed, ref } from 'vue';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';

const creditsPct = computed(() =>
  creditsTotal.value <= 0 ? 0 : Math.min(100, Math.round((creditsBalance.value / creditsTotal.value) * 100)),
);

const paidPacks = Object.entries(purchasePacks).map(([key, pack]) => ({
  ...pack,
  key: key as PurchasePackKey,
  price: '¥' + pack.amount.toLocaleString(),
  originalPrice:
    'originalAmount' in pack && pack.originalAmount ? '¥' + pack.originalAmount.toLocaleString() : null,
  discountRate: 'discountRate' in pack ? pack.discountRate : null,
  tag: 'tag' in pack ? pack.tag : '',
  videoCount: 'videoCount' in pack ? pack.videoCount : null,
  kind: pack.credits && pack.accountCount ? 'bundle' : pack.credits ? 'credits' : 'accounts',
  totalCredits: pack.credits,
  custom: false,
}));
const customPack = { ...paidPacks[0]!, price: '定制化', custom: true };
type RechargePack = (typeof paidPacks)[number];
const popularPack = paidPacks.find((pack) => pack.key === 'p2000')!;
const purchaseTabs = [
  { key: 'bundle', label: '套餐' },
  { key: 'credits', label: '积分充值' },
  { key: 'accounts', label: '购买账号' },
] as const;
const activePurchaseTab = ref('bundle');
const claimOpen = ref(false);
function openClaim() {
  paymentOpen.value = false;
  claimOpen.value = true;
}

/** 各充值档位底部权益列表 */
const benefits = [
  { label: '视频一键发布', tag: 'hot' },
  { label: '图文一键发布', tag: 'hot' },
  { label: '定时发布排期', tag: 'hot' },
  { label: '社媒帐号管理' },
  { label: '内容数据分析' },
  { label: 'AI 视频创作' },
  { label: '爆款视频复刻' },
  { label: '批量内容生成' },
  { label: '项目管理' },
  { label: '产品卡创建' },
  { label: '素材库管理' },
];

const contactOpen = ref(false);
const selectedPack = ref<RechargePack | null>(null);
const paymentOpen = ref(false);
const paymentChannel = ref<PaymentChannel>('alipay');
const order = ref<RechargeOrder | null>(null);
const paying = ref(false);
const channelName = computed(() => (paymentChannel.value === 'alipay' ? '支付宝' : '微信'));
async function pay() {
  if (!order.value || paying.value || order.value.status === 'completed') return;
  paying.value = true;
  try {
    order.value = completeRecharge(order.value.id, paymentChannel.value);
  } catch (error) {
    toast.error((error as Error).message);
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
    order.value = createRechargeOrder(pack.key);
    paymentChannel.value = 'alipay';
    paymentOpen.value = true;
  } catch (error) {
    toast.error((error as Error).message);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="个人中心"
      desc="充值获取 AI 积分与 TikTok 帐号，领取后可直接通过本平台发布视频至 TikTok"
    />

    <div class="mx-auto max-w-[1180px] space-y-8">
      <UserSettings />
      <!-- 顶部：积分与定制化服务并排，账号卡片独占下一行 -->
      <div class="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card class="min-w-0 overflow-hidden border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-[13px] font-medium text-slate-500">我的积分</div>
              <div class="mt-2.5 flex items-center gap-2">
                <CreditsIcon class="h-6 w-6" />
                <h2 class="text-2xl font-semibold tabular-nums text-slate-900">
                  {{ creditsBalance.toLocaleString() }}
                </h2>
              </div>
            </div>

            <Button
              size="sm"
              class="brand-gradient shrink-0 px-3.5 text-white hover:opacity-90"
              @click="openRecharge(popularPack)"
            >
              立即充值
            </Button>
          </div>
          <div class="mt-4">
            <div class="mb-1.5 flex items-center justify-between text-[12px] text-slate-400">
              <span>剩余积分</span>
              <span class="tabular-nums">
                {{ creditsBalance.toLocaleString() }} / {{ creditsTotal.toLocaleString() }}
              </span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="brand-gradient h-full rounded-full transition-all"
                :style="{ width: `${creditsPct}%` }"
              />
            </div>
          </div>
        </Card>

        <Card
          class="flex min-w-0 flex-col justify-between border-dashed border-slate-200 bg-slate-50/70 p-5 shadow-none"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-800">定制化服务</h3>
            <p class="mt-2 text-[12.5px] leading-5 text-slate-500">
              企业大批量采购可按需定制积分、社媒帐号与用量，联系商务经理单独报价。
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="mt-5 h-8 w-fit border-slate-200 bg-white text-[12.5px] text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800"
            @click="openRecharge(customPack)"
          >
            联系商务
          </Button>
        </Card>
      </div>

      <section class="min-w-0 rounded-2xl border border-sky-100 bg-sky-50/50 p-5" aria-label="社媒帐号权益">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h3 class="flex items-center text-sm font-semibold text-slate-800">
            我购买的账号
            <InfoTip text="我购买的账号说明">
              <p class="font-semibold">可直接通过本平台发布至 TikTok</p>
              <p>帐号所有权归用户</p>
              <p>登录信息在帐号管理中查看</p>
            </InfoTip>
          </h3>
          <Button
            size="sm"
            class="brand-gradient shrink-0 px-3.5 text-white hover:opacity-90"
            @click="claimOpen = true"
          >
            {{ socialAccountsRemaining ? '领取帐号' : '查看账号权益' }}
          </Button>
        </div>
        <dl class="mt-5 grid grid-cols-3 gap-3">
          <div
            v-for="item in [
              { label: '累计获得', value: socialAccountsTotal },
              { label: '已领取', value: socialAccountsClaimed },
              { label: '待领取', value: socialAccountsRemaining },
            ]"
            :key="item.label"
          >
            <dt class="text-xs text-slate-500">{{ item.label }}</dt>
            <dd class="mt-1 text-xl font-semibold text-slate-900">
              {{ item.value }}
              <span class="text-xs font-normal text-slate-400">个</span>
            </dd>
          </div>
        </dl>
      </section>
      <TabsRoot v-model="activePurchaseTab" class="space-y-5" aria-label="购买与充值">
        <TabsList class="flex gap-2 border-b border-slate-200" aria-label="购买类型">
          <TabsTrigger
            v-for="tab in purchaseTabs"
            :key="tab.key"
            :value="tab.key"
            class="relative -mb-px min-w-0 flex-1 whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-xs font-medium text-slate-500 outline-none transition hover:text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-400 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 sm:flex-none sm:px-6 sm:text-sm"
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
              :class="
                cn(
                  'relative flex h-full min-w-0 flex-col gap-0 overflow-visible border-slate-200 bg-white p-4 pb-6 pt-4 shadow-sm shadow-slate-200/30',
                  pack.tag === '热门推荐' && 'border-sky-300 ring-1 ring-sky-200',
                  pack.tag === '高性价比' && 'border-amber-300 ring-1 ring-amber-200',
                )
              "
            >
              <!-- 推荐标签：卡片顶边居中 -->
              <Badge
                v-if="pack.tag === '热门推荐'"
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

              <!-- 套餐说明：右上角 -->
              <span class="absolute right-3 top-3 text-[11px] leading-none text-slate-400">
                {{ pack.priceLabel }}
              </span>

              <!-- 固定高度，保证下方总积分/按钮对齐 -->
              <div class="flex min-h-[3.75rem] flex-col justify-end gap-1.5 pt-4">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="text-[28px] font-semibold leading-none tracking-tight text-slate-900">
                    {{ pack.price }}
                  </span>
                  <span
                    v-if="pack.discountRate"
                    class="inline-flex shrink-0 items-baseline rounded-full bg-[#ff2d78] px-3 py-1.5 font-semibold leading-none text-white"
                  >
                    <span class="text-[16px] tabular-nums">{{ pack.discountRate }}</span>
                    <span class="text-[12px]">折·限时优惠</span>
                  </span>
                </div>
                <div v-if="pack.originalPrice" class="text-[16px] tabular-nums text-slate-400 line-through">
                  {{ pack.originalPrice }}
                </div>
                <div v-else class="h-[24px]" aria-hidden="true" />
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
                {{ tab.key === 'accounts' ? '购买账号' : tab.key === 'credits' ? '立即充值' : '购买套餐' }}
              </Button>

              <div
                v-if="pack.credits > 0"
                class="mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-3 text-center"
              >
                <div class="text-[11px] text-slate-400">总积分</div>
                <div
                  class="mt-1 text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900"
                >
                  {{ pack.totalCredits!.toLocaleString() }}
                </div>
                <p v-if="pack.videoCount !== null" class="mt-2 text-[11px] leading-4 text-slate-500">
                  约可生成视频 {{ pack.videoCount.toLocaleString() }} 个
                </p>
                <p v-if="pack.videoCount !== null" class="mt-0.5 text-[10.5px] text-slate-400">
                  Seedance 2.0 Mini · 10s · 480P
                </p>
              </div>

              <div
                v-if="pack.accountCount > 0"
                class="mt-3 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-3 text-center"
                aria-label="套餐社媒帐号权益"
              >
                <div class="text-[11px] text-slate-400">TikTok 帐号 · 付款后领取</div>
                <div
                  class="mt-1 text-[20px] font-semibold leading-none tracking-tight tabular-nums text-slate-900"
                >
                  {{ pack.accountCount }}
                  <span class="text-[11px] font-normal tracking-normal text-slate-400">个</span>
                </div>
                <p class="mt-2 text-[11px] font-semibold leading-4 text-sky-700">
                  可直接通过本平台发布至 TikTok
                </p>
                <p class="mt-0.5 text-[10.5px] leading-4 text-slate-400">
                  帐号所有权归用户
                  <br />
                  登录信息在帐号管理中查看
                </p>
              </div>

              <ul
                v-if="tab.key === 'bundle'"
                class="mt-4 space-y-2 border-t border-slate-100 pt-4"
                aria-label="平台功能权益"
              >
                <li
                  v-for="item in benefits"
                  :key="item.label"
                  class="flex items-start gap-1.5 text-[12px] leading-4 text-slate-600"
                >
                  <Check class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" stroke-width="2.5" />
                  <span class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    <span>{{ item.label }}</span>
                    <span
                      v-if="item.tag"
                      class="inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-[#169fff] to-[#dc4cf2] px-1.5 py-0.5 text-[10px] font-semibold leading-3 text-white"
                    >
                      {{ item.tag }}
                    </span>
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>

    <AccountClaimDialog v-model:open="claimOpen" />
    <Dialog v-model:open="paymentOpen">
      <DialogContent class="max-w-sm rounded-2xl border-slate-200 bg-white p-7 text-center">
        <DialogTitle class="text-lg text-slate-900">
          {{
            order?.status === 'completed'
              ? '支付成功'
              : order?.credits === 0
                ? '购买账号'
                : order?.accountCount === 0
                  ? '积分充值'
                  : '套餐购买'
          }}
        </DialogTitle>
        <DialogDescription class="text-sm text-slate-500">演示支付，不会实际扣款</DialogDescription>
        <template v-if="order?.status === 'completed'">
          <Check class="mx-auto h-12 w-12 rounded-full bg-emerald-50 p-2 text-emerald-600" />
          <template v-if="order.credits > 0">
            <p class="text-base font-medium text-slate-800">
              已到账 {{ order.credits.toLocaleString() }} 积分
            </p>
            <p class="text-sm text-slate-500">最新余额：{{ creditsBalance.toLocaleString() }} 积分</p>
          </template>
          <template v-if="(order.accountCount ?? 0) > 0">
            <p class="text-base font-medium text-sky-700">
              已到账 {{ order.accountCount ?? 0 }} 个社媒帐号名额
            </p>
            <p class="text-xs text-slate-500">仅提供 TikTok (TK) 帐号，可分批领取</p>
            <p class="text-sm font-semibold text-sky-700">领取后可直接通过本平台发布视频至 TikTok</p>
            <p class="text-xs text-slate-500">帐号所有权归用户，登录信息可在帐号管理中查看。</p>
            <Button class="brand-gradient w-full text-white" @click="openClaim">领取帐号</Button>
            <Button variant="outline" class="w-full" @click="paymentOpen = false">稍后领取</Button>
          </template>
          <Button v-else class="brand-gradient w-full text-white" @click="paymentOpen = false">完成</Button>
        </template>
        <template v-else-if="order">
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-3xl font-semibold text-slate-900">¥{{ order.amount }}</p>
            <p v-if="order.credits > 0" class="mt-2 text-sm text-slate-500">
              到账 {{ order.credits.toLocaleString() }} 积分
            </p>
            <p v-if="(order.accountCount ?? 0) > 0" class="mt-1 text-sm text-sky-600">
              TikTok 帐号 × {{ order.accountCount ?? 0 }} · 支付后领取
            </p>
            <p v-if="(order.accountCount ?? 0) > 0" class="mt-2 text-xs font-semibold leading-5 text-sky-700">
              领取后可直接通过本平台发布视频至 TikTok
            </p>
          </div>
          <div class="flex gap-2" role="group" aria-label="支付方式">
            <button
              v-for="channel in ['alipay', 'wechat'] as const"
              :key="channel"
              type="button"
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
              class="h-44 w-44 [image-rendering:pixelated]"
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
        <DialogTitle class="mt-3 text-[18px] text-slate-900">添加企业微信联系商务经理</DialogTitle>
        <DialogDescription class="mt-1.5 text-[13px] leading-5 text-slate-500">
          <template v-if="selectedPack?.custom">定制化方案请扫码添加商务经理沟通需求。</template>
          <template v-else-if="selectedPack">
            已选「{{ selectedPack.price }}」充值档位，扫码添加后由商务经理协助完成充值。
          </template>
          <template v-else>扫码添加企业微信，由商务经理协助完成积分充值。</template>
        </DialogDescription>

        <div
          class="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
        >
          <img src="/wecom-qr.png" alt="企业微信二维码" class="h-full w-full object-contain" />
        </div>

        <p class="mt-4 text-[12.5px] leading-5 text-slate-400">
          使用微信扫一扫添加企业微信，备注充值档位即可。
        </p>
      </DialogContent>
    </Dialog>
  </div>
</template>
