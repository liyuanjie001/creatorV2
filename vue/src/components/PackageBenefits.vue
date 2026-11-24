<script setup lang="ts">
import { computed } from 'vue';
import { Check, Info, X } from 'lucide-vue-next';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui';
import { rechargeBenefitCategories, type RechargeBenefit } from '@/services/credits';

const props = defineProps<{ benefits: RechargeBenefit[]; compact?: boolean; validityHint?: string }>();
const inlineValueLabels = new Set(['多任务并行', '可绑定发布账号的个数', '可发布平台']);
const sections = computed(() => {
  const hasTeamBenefits = props.benefits.some(item => item.category === '团队协作');
  const categories = hasTeamBenefits
    ? ['团队协作', ...rechargeBenefitCategories.filter(category => category !== '团队协作')]
    : rechargeBenefitCategories;
  return categories
  .map(title => ({ title, items: props.benefits.filter(item => item.category === title) }))
  .filter(section => section.items.length);
});
</script>

<template>
  <div class="mt-5 border-t border-slate-100" aria-label="平台功能权益">
    <h3 v-if="validityHint" class="pt-4 text-sm font-semibold text-slate-800">
      <TooltipProvider :delay-duration="150">
        <TooltipRoot>
          <TooltipTrigger as-child>
            <button type="button" class="inline-flex items-center gap-1.5 rounded-sm hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
              套餐权益
              <Info class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent side="top" :side-offset="7" :collision-padding="12" class="z-[100] max-w-64 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg">
              {{ validityHint }}
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>
    </h3>
    <section
      v-for="section in sections"
      :key="section.title"
      :aria-label="section.title"
      class="border-b border-slate-100 last:border-b-0 last:pb-0"
      :class="compact ? 'py-4' : 'py-5'"
    >
      <h4 class="mb-3 text-xs font-semibold text-slate-500">{{ section.title }}</h4>
      <ul class="space-y-3">
        <li
          v-for="item in section.items"
          :key="item.label"
          class="flex items-start gap-2 text-xs leading-5"
          :class="item.value === false ? 'text-slate-400' : 'text-slate-700'"
          :data-supported="item.value !== false"
        >
          <component
            :is="item.value === false ? X : Check"
            aria-hidden="true"
            class="mt-1 h-3 w-3 shrink-0"
            :class="item.value === false ? 'text-slate-300' : 'text-sky-600'"
            :stroke-width="2"
          />
          <span class="min-w-0 flex-1 break-words">
            {{ item.label }}<template v-if="inlineValueLabels.has(item.label)">（{{ item.label === '可绑定发布账号的个数' ? `${item.value}个` : item.value }}）</template>
          </span>
          <span v-if="item.value === false" class="sr-only">不支持</span>
          <span v-else-if="item.value !== true && !inlineValueLabels.has(item.label)" class="shrink-0 text-right font-medium tabular-nums text-slate-700">
            {{ item.value }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
