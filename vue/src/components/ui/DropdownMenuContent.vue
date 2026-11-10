<script setup lang="ts">
import { DropdownMenuPortal, DropdownMenuContent } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
defineOptions({
  inheritAttrs: false,
});
withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
  }>(),
  {
    sideOffset: 4,
  },
);
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="$attrs"
      :align="align"
      :side-offset="sideOffset"
      :class="
        cn(
          'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          $props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
