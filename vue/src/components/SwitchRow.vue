<script setup lang="ts">
import { Switch } from '@/components/ui';
import { ref } from 'vue';
const { title, desc, on } = defineProps<{
  title: string;
  desc: string;
  on: boolean;
}>();
const checked = ref(on);
</script>

<template>
  <div class="flex items-center justify-between py-3.5">
    <div>
      <div class="text-[13.5px] font-medium text-slate-700">{{ title }}</div>
      <div class="mt-0.5 text-[12px] text-slate-400">{{ desc }}</div>
    </div>
    <Switch :model-value="checked" @update:model-value="checked = $event"></Switch>
  </div>
</template>
