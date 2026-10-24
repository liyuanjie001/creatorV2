<script setup lang="ts">
import { Crown, Zap, Check, Coins } from 'lucide-vue-next';
import { Card, Button, Badge } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { toast } from 'vue-sonner';
import { computed } from 'vue';

/** 唯一收费点：AI 积分 */
const creditsUsed = 2240;
const creditsTotal = 3520;
const creditsPct = computed(() => Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)));

type PlanKey = 'free' | 'pro' | 'business';
const currentPlan: PlanKey = 'pro';

const plans: {
  key: PlanKey;
  name: string;
  blurb: string;
  price: string;
  priceHint: string;
  credits: string;
  features: string[];
  accent: string;
}[] = [
  {
    key: 'free',
    name: '免费版',
    blurb: '适合个人试用与轻量创作',
    price: '¥0',
    priceHint: '永久',
    credits: '每月 500 AI 积分',
    features: ['基础模型可用', '单项目协作', '社区素材库', '标准队列生成'],
    accent: 'text-slate-500',
  },
  {
    key: 'pro',
    name: 'Pro 版',
    blurb: '适合个人创作者持续产出',
    price: '¥199',
    priceHint: '/ 月',
    credits: '每月 3,520 AI 积分',
    features: ['全部模型可用', '优先生成队列', '积分加油包', '多项目并行创作'],
    accent: 'text-sky-600',
  },
  {
    key: 'business',
    name: 'Business 版',
    blurb: '适合高频创作与多项目管理',
    price: '¥599',
    priceHint: '/ 月',
    credits: '每月 12,000 AI 积分',
    features: ['批量生成加速', '团队积分池', '专属客服', '用量与账单导出'],
    accent: 'text-violet-600',
  },
];

function choosePlan(key: PlanKey) {
  if (key === currentPlan) return;
  const plan = plans.find((p) => p.key === key);
  toast.success(`已选择「${plan?.name}」（演示）`);
}

function changePlan() {
  document.getElementById('all-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="个人中心" desc="查看我的套餐与全部套餐计划" />

    <div class="mx-auto max-w-5xl space-y-8">
    <!-- 我的套餐：仅展示 AI 积分用量 -->
    <Card class="overflow-hidden border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <Crown class="h-4 w-4 text-amber-500" />
            我的套餐
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2.5">
            <h2 class="text-2xl font-semibold text-slate-900">Pro 版</h2>
            <Badge class="border-0 bg-sky-50 text-[11px] font-medium text-sky-600">当前使用中</Badge>
          </div>
          <p class="mt-2 text-[14px] text-slate-500">¥199 / 月 · 下次续费 2026-11-22</p>
        </div>
        <Button
          size="sm"
          class="brand-gradient gap-1.5 px-4 text-white hover:opacity-90"
          @click="changePlan"
        >
          更换套餐
        </Button>
      </div>

      <div class="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-200/60"
            >
              <Coins class="h-4 w-4" />
            </span>
            <div>
              <div class="text-[13px] font-medium text-slate-700">AI 积分</div>
              <div class="text-[12px] text-slate-400">唯一计费与消耗单位 · 生成、翻拍、批量任务均扣积分</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[22px] font-semibold tabular-nums text-slate-900">
              {{ creditsUsed.toLocaleString() }}
              <span class="text-[15px] font-normal text-slate-400"> / {{ creditsTotal.toLocaleString() }}</span>
            </div>
            <div class="text-[12px] text-slate-400">本月已用 {{ creditsPct }}%</div>
          </div>
        </div>
        <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
          <div
            class="brand-gradient h-full rounded-full transition-all"
            :style="{ width: `${creditsPct}%` }"
          />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            class="border-slate-200 bg-white text-[12.5px] text-slate-600 hover:text-sky-600"
            @click="toast.success('已打开积分加油包（演示）')"
          >
            购买加油包
          </Button>
          <span class="self-center text-[12px] text-slate-400">加油包积分即时到账，不占用套餐额度周期</span>
        </div>
      </div>
    </Card>

    <!-- 所有套餐计划 -->
    <section id="all-plans" class="space-y-4">
      <h3 class="text-[15px] font-medium text-slate-800">所有套餐计划</h3>
      <div class="grid gap-4 md:grid-cols-3">
        <Card
          v-for="plan in plans"
          :key="plan.key"
          :class="
            cn(
              'relative flex flex-col border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30',
              plan.key === currentPlan && 'border-sky-300 ring-1 ring-sky-200',
            )
          "
        >
          <Badge
            v-if="plan.key === currentPlan"
            class="absolute right-4 top-4 border-0 bg-sky-50 text-[10.5px] font-medium text-sky-600"
          >
            当前套餐
          </Badge>
          <div class="flex items-center gap-2">
            <Zap :class="cn('h-5 w-5', plan.accent)" />
            <span class="text-[17px] font-semibold text-slate-900">{{ plan.name }}</span>
          </div>
          <p class="mt-2 text-[13px] leading-5 text-slate-400">{{ plan.blurb }}</p>
          <div class="mt-5 flex items-baseline gap-1">
            <span class="text-[28px] font-semibold tracking-tight text-slate-900">{{ plan.price }}</span>
            <span class="text-[13px] text-slate-400">{{ plan.priceHint }}</span>
          </div>

          <div
            class="mt-5 rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-2.5 text-[13px] font-medium text-amber-800"
          >
            {{ plan.credits }}
          </div>

          <ul class="mt-5 flex-1 space-y-2.5">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-2 text-[13px] text-slate-600"
            >
              <Check class="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
              {{ feature }}
            </li>
          </ul>

          <Button
            v-if="plan.key === currentPlan"
            variant="outline"
            class="mt-6 w-full border-slate-200 bg-slate-50 text-slate-400"
            disabled
          >
            使用中
          </Button>
          <Button
            v-else-if="plan.key === 'business'"
            class="mt-6 w-full brand-gradient text-white hover:opacity-90"
            @click="choosePlan(plan.key)"
          >
            选择此套餐
          </Button>
          <Button
            v-else
            variant="outline"
            class="mt-6 w-full border-slate-200 text-slate-600 hover:border-sky-200 hover:text-sky-600"
            @click="choosePlan(plan.key)"
          >
            选择此套餐
          </Button>
        </Card>
      </div>
      <p class="text-center text-[12.5px] text-slate-400">
        收费点仅 AI 积分：套餐内每月发放额度，用尽可购买加油包；发布、存储等能力随套餐附赠，不再单独计费。
      </p>
    </section>
    </div>
  </div>
</template>
