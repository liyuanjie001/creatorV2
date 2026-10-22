<script setup lang="ts">
import { DialogPortal, DialogOverlay, DialogContent, DialogClose } from 'reka-ui';
import { X } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
defineOptions({
  inheritAttrs: false,
});
defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="$attrs"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 max-h-[90vh] overflow-y-auto',
          $props.class,
        )
      "
    >
      <slot />
      <DialogClose
        aria-label="关闭"
        class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <X class="size-4" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
