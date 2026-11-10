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
  <textarea
    :class="
      cn(
        'border-input placeholder:text-muted-foreground flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.class,
      )
    "
    :value="props.value ?? model ?? props.defaultValue"
    @input="update"
  />
</template>
