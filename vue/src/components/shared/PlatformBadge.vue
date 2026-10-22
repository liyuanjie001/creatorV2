<script setup lang="ts">
import { platformColors, type Platform } from '@/data/mock';
defineProps<{
  platform: Platform;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
    :style="{
      color: platformColors[platform],
      backgroundColor: `${platformColors[platform]}1a`,
    }"
  >
    <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: platformColors[platform] }" />
    {{ platform }}
  </span>
</template>
