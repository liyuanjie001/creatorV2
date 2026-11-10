<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', $props.class)">
    <slot />
  </span>
</template>
