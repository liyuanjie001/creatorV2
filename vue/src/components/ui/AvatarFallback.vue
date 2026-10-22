<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span :class="cn('bg-muted flex size-full items-center justify-center rounded-full', $props.class)">
    <slot />
  </span>
</template>
