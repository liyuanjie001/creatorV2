<script setup lang="ts">
import type { OrganizedIdea } from '@/types/domain';
import { Check, Copy, RefreshCw, TrendingUp } from 'lucide-vue-next';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';

import { toast } from 'vue-sonner';

const { idea } = defineProps<{
  idea: OrganizedIdea;
}>();
const emit = defineEmits<{
  adopt: [];
}>();
const browserNavigator = navigator;
</script>

<template>
  <div class="mt-2 rounded-xl border border-slate-200 bg-white p-4">
    <div class="flex items-center gap-2">
      <Badge class="border border-sky-200 bg-sky-50 text-[10.5px] font-medium text-sky-600">
        AI 整理 · 待确认
      </Badge>
      <span class="text-[11px] text-slate-300">已自动保存到妙记</span>
    </div>
    <h3 class="mt-2.5 text-[15px] font-semibold leading-snug text-slate-800">
      {{ idea.title }}
    </h3>
    <p class="mt-1 text-[12.5px] leading-relaxed text-slate-500">
      {{ idea.positioning }}
    </p>
    <div class="mt-3 space-y-1.5">
      <template :key="s" v-for="s in idea.sellingPoints">
        <div class="flex items-start gap-2 text-[12px] leading-relaxed text-slate-600">
          <Check class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" :strokeWidth="2.5"></Check>
          {{ s }}
        </div>
      </template>
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <template :key="p" v-for="p in idea.recommendPlatforms">
        <PlatformBadge :platform="p"></PlatformBadge>
      </template>
      <Badge variant="outline" class="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-600">
        {{ idea.format }}
      </Badge>
    </div>
    <div class="mt-3 space-y-1.5">
      <template :key="h" v-for="h in idea.hooks">
        <button
          @click="
            browserNavigator.clipboard?.writeText(h);
            toast.success('已复制钩子文案');
          "
          class="group flex w-full items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-left text-[12px] leading-relaxed text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50/60"
        >
          <span class="flex-1">{{ h }}</span>
          <Copy
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500"
          ></Copy>
        </button>
      </template>
    </div>
    <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
      <template :key="t" v-for="t in idea.tags">
        <Badge variant="outline" class="border-slate-200 bg-white text-[10.5px] font-normal text-sky-600">
          {{ t }}
        </Badge>
      </template>
    </div>
    <div
      class="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11.5px] leading-relaxed text-emerald-700"
    >
      <TrendingUp class="mt-0.5 h-3.5 w-3.5 shrink-0"></TrendingUp>
      {{ idea.insight }}
    </div>
    <div class="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
      <Button
        size="sm"
        @click="emit('adopt')"
        class="gap-1.5 brand-gradient px-4 text-[12.5px] text-white hover:opacity-90"
      >
        <Check class="h-3.5 w-3.5" :strokeWidth="2.5"></Check>
        采纳，去创作
      </Button>
      <Button
        size="sm"
        variant="outline"
        class="gap-1.5 border-slate-200 text-[12.5px] text-slate-600 hover:text-slate-900"
        @click="toast.info('已重新整理（演示）')"
      >
        <RefreshCw class="h-3.5 w-3.5"></RefreshCw>
        换个思路
      </Button>
    </div>
  </div>
</template>
