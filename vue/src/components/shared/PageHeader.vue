<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  title: string;
  desc?: string;
  class?: string;
}>();
</script>

<template>
  <div :class="cn('mb-6 flex items-end justify-between gap-4', $props.class)">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-xl font-semibold text-slate-900">{{ title }}</h1>
        <slot name="title-extra" />
      </div>
      <p v-if="desc" class="mt-1 text-[13px] text-slate-500">{{ desc }}</p>
    </div>
    <div v-if="$slots.extra" class="shrink-0">
      <slot name="extra" />
    </div>
  </div>
</template>
