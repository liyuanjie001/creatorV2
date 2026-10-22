<script setup lang="ts">
defineProps<{
  title: string;
  desc?: string;
}>();
</script>

<template>
  <div class="mb-6 flex items-end justify-between">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ title }}</h1>
      <p v-if="desc" class="mt-1 text-[13px] text-slate-500">{{ desc }}</p>
    </div>
    <slot name="extra" />
  </div>
</template>
