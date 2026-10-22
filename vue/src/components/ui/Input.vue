<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
const props = defineProps<{
  class?: HTMLAttributes['class'];
  value?: string | number;
  defaultValue?: string | number;
}>();
const model = defineModel<string | number>();
function update(event: Event) {
  const el = event.target;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) model.value = el.value;
}
</script>

<template>
  <input
    :class="
      cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        props.class,
      )
    "
    :value="props.value ?? model ?? props.defaultValue"
    @input="update"
  />
</template>
