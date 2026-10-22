<script setup lang="ts">
import type { Component } from 'vue';
defineProps<{
  icon: Component;
  value: string;
  title?: string;
}>();
const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    :title="title"
    class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600"
    @click="emit('click')"
  >
    <component :is="icon" class="size-3.5 text-slate-400" />
    <span class="max-w-28 truncate">{{ value }}</span>
  </button>
</template>
