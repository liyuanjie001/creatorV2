<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Info, Minus, Plus, Ticket } from 'lucide-vue-next';
import {
  currentPackageKey,
  currentSubscription,
  getRechargeBenefits,
  getSubscriptionDiscount,
  getCouponSubscriptionQuote,
  rechargePacks,
  rechargeBenefitCategories,
  subscriptionEditions,
  subscriptionLimits,
  subscriptionPeriods,
  teamSubscriptionPacks,
  type RechargePackKey,
  type SubscriptionEdition,
  type SubscriptionOptions,
  type SubscriptionPeriod,
} from '@/services/credits';
import { Badge, Button, Card } from '@/components/ui';
import PackageBenefits from '@/components/PackageBenefits.vue';
import AccountPurchaseInfo from './AccountPurchaseInfo.vue';
import InfoTip from './InfoTip.vue';

const props = defineProps<{ initialEdition?: SubscriptionEdition; initialPeriod?: SubscriptionPeriod }>();
defineEmits<{ purchase: [tier: RechargePackKey, options: SubscriptionOptions] }>();
const edition = ref<SubscriptionEdition>(props.initialEdition ?? 'personal');
const period = ref<SubscriptionPeriod>(props.initialPeriod ?? 'quarter');
const tiers = Object.keys(rechargePacks) as RechargePackKey[];
const visibleTiers = computed(() => tiers.filter(key => edition.value === 'personal' || Object.hasOwn(teamSubscriptionPacks, key)));
const estimatedCreditsPerVideo = 11;
const selections = reactive({
  personal: tiers.map((tier) => ({ accountCount: rechargePacks[tier].accountCount as number, seats: 0 })),
  team: tiers.map((tier) => ({ accountCount: rechargePacks[tier].accountCount as number, seats: subscriptionLimits.seats.min as number })),
});
const money = (amount: number) => `¥${amount.toLocaleString('zh-CN')}`;
const plans = computed(() =>
  visibleTiers.value.map((key) => {
    const pack = rechargePacks[key];
    const selection = selections[edition.value][tiers.indexOf(key)]!;
    const quote = getCouponSubscriptionQuote(key, { edition: edition.value, period: period.value, ...selection });
    const displayedCredits = quote.seatPricing?.unitCredits ?? quote.credits;
    const estimatedVideos = Math.floor(displayedCredits / estimatedCreditsPerVideo);
    const discount = getSubscriptionDiscount(quote);
    const originalPrice = discount.referenceAmount / (quote.seatPricing ? quote.seats : 1);
    return { key, pack, selection, quote, displayedCredits, estimatedVideos, originalPrice, benefits: getRechargeBenefits(pack, quote) };
  }),
);
const quantityFields = computed(() => {
  const seats = { key: 'seats', label: '团队席位', unit: '席', limits: subscriptionLimits.seats } as const;
  return edition.value === 'team' ? [seats] : [];
});
const compareRows = computed(() => [
  ...(edition.value === 'team' ? [
    { label: `单席价格 / ${period.value === 'year' ? '年' : '季'}`, values: plans.value.map(({ quote }) => money(quote.seatPricing!.unitAmount)) },
    { label: `单席积分 / ${period.value === 'year' ? '年' : '季'}`, values: plans.value.map(({ quote }) => quote.seatPricing!.unitCredits.toLocaleString('zh-CN')) },
    { label: '所选席位（含本人）', values: plans.value.map(({ quote }) => `${quote.seats} 席`) },
    { label: '合计金额', values: plans.value.map(({ quote }) => money(quote.amount)) },
  ] : [{ label: '基础价', values: plans.value.map(({ quote }) => money(quote.baseAmount)) }]),
  { label: edition.value === 'team' ? '总积分' : '整期积分', values: plans.value.map(({ quote }) => quote.credits.toLocaleString('zh-CN')) },
  { label: '赠送账号抵扣券', values: plans.value.map(({ quote }) => `1 张（可兑换 ${quote.accountCount} 个账号）`) },
  { label: '适用成员', values: plans.value.map(() => edition.value === 'team' ? '所选团队席位（含本人）' : '本人') },
]);
const benefitGroups = computed(() => {
  const hasTeamBenefits = plans.value[0]?.benefits.some(benefit => benefit.category === '团队协作');
  const categories = hasTeamBenefits
    ? ['团队协作', ...rechargeBenefitCategories.filter(category => category !== '团队协作')]
    : rechargeBenefitCategories;
  return categories.map(category => ({
  category,
  rows: plans.value[0]!.benefits.filter(benefit => benefit.category === category).map(({ label }) => ({
    label,
    values: plans.value.map(({ benefits }) => benefits.find(benefit => benefit.label === label)!.value),
  })),
  })).filter(group => group.rows.length);
});
function isCurrent(key: RechargePackKey) {
  const active = currentSubscription.value?.subscription;
  if (active) return key === currentPackageKey.value && active.edition === edition.value;
  return key === currentPackageKey.value && edition.value === 'personal';
}
</script>

<template>
  <section class="space-y-6" aria-label="套餐购买">
    <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <fieldset class="flex gap-1 rounded-xl bg-sky-50 p-1">
        <legend class="sr-only">套餐版本</legend>
        <label v-for="(label, key) in subscriptionEditions" :key="key" class="cursor-pointer">
          <input v-model="edition" type="radio" name="subscription-edition" :value="key" class="peer sr-only" />
          <span class="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 peer-checked:bg-white peer-checked:text-sky-700 peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-sky-500">{{ label }}</span>
        </label>
      </fieldset>
      <fieldset class="flex gap-1 rounded-xl bg-slate-100 p-1">
        <legend class="sr-only">购买周期</legend>
        <label v-for="(label, key) in subscriptionPeriods" :key="key" class="cursor-pointer">
          <input v-model="period" type="radio" name="subscription-period" :value="key" class="peer sr-only" />
          <span class="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 peer-checked:bg-white peer-checked:text-sky-700 peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-sky-500">{{ label }}</span>
        </label>
      </fieldset>
    </div>

    <div class="grid gap-4 sm:grid-cols-2" :class="edition === 'team' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'">
      <Card
        v-for="{ key, pack, selection, quote, displayedCredits, estimatedVideos, originalPrice, benefits } in plans"
        :key="key"
        role="article"
        :aria-label="`${pack.priceLabel}套餐`"
        class="relative min-w-0 gap-0 rounded-2xl border-slate-200 bg-white p-5"
        :class="isCurrent(key) ? 'border-sky-400 ring-1 ring-sky-200' : pack.tag === '热门推荐' ? 'border-sky-200' : ''"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="text-xl font-semibold text-slate-900">{{ pack.priceLabel }}</h3>
            <p class="mt-1 text-sm text-slate-600">{{ edition === 'team' && key === 'p5000' ? '团队矩阵运营' : pack.description }}</p>
          </div>
          <div class="flex flex-col items-end gap-1">
            <Badge v-if="isCurrent(key) || pack.tag" class="border-sky-100 bg-sky-50 text-sky-700">
              {{ isCurrent(key) ? '当前版本' : pack.tag }}
            </Badge>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <output :aria-label="quote.seatPricing ? '单席位价格' : '应付总价'" class="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{{ money(quote.seatPricing?.unitAmount ?? quote.amount) }}</output>
          <span v-if="quote.seatPricing" class="text-xs text-slate-600">/ 席位 / {{ period === 'year' ? '年' : '季' }}</span>
          <del v-if="key !== 'p500'" aria-label="套餐原价" class="text-sm tabular-nums text-slate-400">{{ money(Math.round(originalPrice * 100) / 100) }}</del>
        </div>
        <dl v-if="quantityFields.length" class="mt-4 space-y-2 text-sm text-slate-600">
          <div v-for="{ key: field, label, unit, limits } in quantityFields" :key="field" class="space-y-1.5">
            <dt>{{ label }}（含本人）</dt>
            <dd class="flex flex-wrap items-center justify-between gap-2">
              <div class="inline-flex items-center rounded-lg border border-slate-200" role="group" :aria-label="`${pack.priceLabel}${label}数量`">
                <Button variant="ghost" size="icon-sm" :aria-label="`减少${label}`" :disabled="selection[field] <= limits.min" @click="selection[field]--">
                  <Minus aria-hidden="true" />
                </Button>
                <output class="min-w-12 px-1 text-center text-xs font-medium tabular-nums text-slate-900" :aria-label="`${label}数量`">{{ selection[field] }} {{ unit }}</output>
                <Button variant="ghost" size="icon-sm" :aria-label="`增加${label}`" :disabled="selection[field] >= limits.max" @click="selection[field]++">
                  <Plus aria-hidden="true" />
                </Button>
              </div>
              <span class="flex items-baseline gap-1 text-xs text-slate-600">
                合计：<output aria-label="应付总价" class="text-xl font-semibold tabular-nums text-slate-900">{{ money(quote.amount) }}</output>
              </span>
            </dd>
          </div>
        </dl>
        <AccountPurchaseInfo
          coupon
          :label="`免费兑换${quote.accountCount}个账号使用权`"
          trigger-class="mt-3 w-full gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50/70 px-3 py-2.5 text-left text-xs font-medium text-sky-700 hover:border-sky-400 hover:bg-sky-100 sm:text-sm"
        >
          <template #trigger>
            <Ticket class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span class="min-w-0">免费兑换{{ quote.accountCount }}个账号<span class="whitespace-nowrap">使用权<Info class="ml-1 inline-block h-3.5 w-3.5 align-[-2px] text-sky-500" aria-hidden="true" /></span></span>
          </template>
        </AccountPurchaseInfo>
        <div class="mt-5 rounded-xl bg-sky-50/70 px-4 py-3">
          <span :aria-label="quote.seatPricing ? '单席位积分' : '套餐积分'" class="text-xl font-semibold tabular-nums text-slate-900">{{ displayedCredits.toLocaleString('zh-CN') }}</span>
          <span class="text-xs text-slate-600"> 积分 / <template v-if="quote.seatPricing">席位 / </template>{{ period === 'year' ? '年' : '季' }}</span>
          <InfoTip text="积分有效期说明">积分有效期为一年。</InfoTip>
          <p class="mt-1 text-xs text-slate-700">
            {{ quote.seatPricing ? '每席位约可生成' : '约可生成' }} <span class="font-medium tabular-nums">{{ estimatedVideos.toLocaleString('zh-CN') }}</span> 个视频
          </p>
        </div>
        <Button class="brand-gradient mt-3 w-full text-white hover:opacity-90" @click="$emit('purchase', key, quote)">
          {{ isCurrent(key) ? '续购套餐' : '购买套餐' }}
        </Button>
        <PackageBenefits :benefits="benefits" :validity-hint="`套餐权益有效期${period === 'year' ? '12' : '3'}个月`" />
      </Card>
    </div>
  </section>

  <slot />

  <section class="space-y-4" aria-labelledby="subscription-compare">
    <h2 id="subscription-compare" class="text-xl font-semibold text-slate-900">套餐权益对比</h2>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white focus-visible:outline-sky-500" tabindex="0" role="region" aria-label="套餐权益对比表，可横向滚动">
      <table class="w-full min-w-[620px] table-fixed text-left text-sm" aria-labelledby="subscription-compare">
        <thead class="bg-sky-50 text-slate-800">
          <tr>
            <th scope="col" class="w-[136px] px-4 py-3 md:w-[210px]">{{ subscriptionEditions[edition] }} · {{ subscriptionPeriods[period] }}</th>
            <th v-for="{ key, pack } in plans" :key="key" scope="col" class="px-4 py-3 text-center">{{ pack.priceLabel }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="{ label, values } in compareRows" :key="label">
            <th scope="row" class="px-4 py-3 font-medium text-slate-800">{{ label }}</th>
            <td v-for="(value, index) in values" :key="visibleTiers[index]" class="px-4 py-3 text-center tabular-nums text-slate-600">{{ value }}</td>
          </tr>
          <template v-for="group in benefitGroups" :key="group.category">
            <tr class="bg-slate-50">
              <th :colspan="plans.length + 1" scope="rowgroup" class="px-4 py-3 text-xs font-semibold text-slate-500">{{ group.category }}</th>
            </tr>
            <tr v-for="row in group.rows" :key="row.label">
              <th scope="row" class="px-4 py-3 font-medium text-slate-800">{{ row.label }}</th>
              <td v-for="(value, index) in row.values" :key="visibleTiers[index]" class="px-4 py-3 text-center tabular-nums" :class="value === true ? 'text-sky-700' : 'text-slate-600'">
                <span v-if="value === true" class="relative inline-flex align-middle">
                  <Check class="h-6 w-6" :stroke-width="2.5" aria-hidden="true" />
                  <span class="sr-only">支持</span>
                </span>
                <template v-else>{{ value === false ? '不支持' : value }}</template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>
