<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Crown, ChevronRight, ArrowUpRight } from 'lucide-vue-next';
import { currentPackage, creditsBalance, creditsTotal, getRechargeBenefits } from '@/services/credits';
import PackageBenefits from '@/components/PackageBenefits.vue';
import PurchaseHistory from './PurchaseHistory.vue';
import { CreditsIcon } from '@/components/shared';
import { Card, Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
const router = useRouter();
const detailsOpen = ref(false);
const benefits = computed(() => (currentPackage.value ? getRechargeBenefits(currentPackage.value) : []));
const creditsPct = computed(() =>
  creditsTotal.value <= 0 ? 0 : Math.min(100, Math.round((creditsBalance.value / creditsTotal.value) * 100)),
);
</script>
<template>
  <Card
    class="gap-0 overflow-hidden border-sky-100 bg-white p-0 shadow-sm shadow-sky-100/40"
    aria-label="我的套餐与积分"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50/60 px-5 py-4 sm:px-7"
    >
      <h2 class="flex items-center gap-2 text-sm font-medium text-slate-800">
        <Crown class="h-4 w-4 text-sky-500" aria-hidden="true" />
        我的权益
      </h2>
      <button
        type="button"
        class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 focus-visible:outline-sky-500"
        @click="detailsOpen = true"
      >
        权益详情
        <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2">
      <section
        class="flex flex-col items-start border-b border-slate-100 p-5 sm:p-7 md:border-b-0 md:border-r"
        aria-label="我的套餐"
      >
        <p class="text-sm text-slate-500">我的套餐</p>
        <h3 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900" aria-label="当前套餐">
          {{ currentPackage?.priceLabel ?? '未购买套餐' }}
        </h3>
        <p class="mt-2 text-xs leading-5 text-slate-500">
          {{ currentPackage?.description ?? '选择适合你的版本，开启创作与发布' }}
        </p>
        <Button
          class="brand-gradient mt-6 gap-1.5 text-white hover:opacity-90"
          @click="router.push('/purchase')"
        >
          {{
            !currentPackage ? '购买套餐' : currentPackage.priceLabel === '企业版' ? '查看套餐' : '升级套餐'
          }}
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </section>
      <section class="flex flex-col items-start p-5 sm:p-7" aria-label="剩余积分">
        <p class="text-sm text-slate-500">剩余积分</p>
        <div class="mt-3 flex items-center gap-2">
          <CreditsIcon class="h-6 w-6" />
          <span class="text-2xl font-semibold tabular-nums text-slate-900" aria-label="当前剩余积分">
            {{ creditsBalance.toLocaleString() }}
          </span>
        </div>
        <div class="mt-3 w-full max-w-xs">
          <div
            class="h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="剩余积分比例"
            :aria-valuenow="creditsPct"
            :aria-valuemin="0"
            :aria-valuemax="100"
          >
            <div class="brand-gradient h-full rounded-full" :style="{ width: `${creditsPct}%` }" />
          </div>
          <p class="mt-1.5 text-xs tabular-nums text-slate-400">
            {{ creditsBalance.toLocaleString() }} / {{ creditsTotal.toLocaleString() }} 积分
          </p>
        </div>
        <Button
          variant="outline"
          class="mt-5 border-sky-200 text-sky-600 hover:bg-sky-50"
          @click="router.push('/purchase?tab=credits')"
        >
          积分充值
        </Button>
      </section>
    </div>
  </Card>
  <PurchaseHistory />
  <Dialog v-model:open="detailsOpen">
    <DialogContent
      class="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 sm:p-7"
    >
      <DialogTitle>{{ currentPackage ? `${currentPackage.priceLabel}权益` : '套餐权益' }}</DialogTitle>
      <DialogDescription>
        {{ currentPackage?.description ?? '购买套餐后，可在此查看对应版本权益' }}
      </DialogDescription>
      <PackageBenefits v-if="currentPackage" :benefits="benefits" compact />
      <p v-else class="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
        当前尚未购买套餐，前往套餐购买页了解各版本权益。
      </p>
      <Button v-if="!currentPackage" class="brand-gradient text-white" @click="router.push('/purchase')">
        查看套餐
      </Button>
      <Button variant="outline" @click="detailsOpen = false">关闭</Button>
    </DialogContent>
  </Dialog>
</template>
