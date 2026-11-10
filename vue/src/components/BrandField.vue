<script setup lang="ts">
import { Badge } from '@/components/ui';
defineProps<{
  label: string;
  hint?: string;
  ai?: boolean;
}>();
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-2">
      <label class="text-[12.5px] font-medium text-slate-600">{{ label }}</label>
      <Badge v-if="ai" class="border-0 bg-sky-50 px-1.5 py-0 text-[10px] text-sky-600">AI 填写</Badge>
    </div>
    <slot />
    <p v-if="hint" class="text-[11.5px] text-slate-400">{{ hint }}</p>
  </div>
</template>
