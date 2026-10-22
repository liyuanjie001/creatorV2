<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>(),
  {
    variant: 'default',
  },
);
const variants = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-white',
  outline: 'text-foreground',
};
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden',
        variants[variant],
        $props.class,
      )
    "
  >
    <slot />
  </span>
</template>
