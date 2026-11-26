<script setup lang="ts">
import { Info } from 'lucide-vue-next';
import { ref } from 'vue';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui';
defineProps<{ text: string; triggerClass?: string }>();
const open = ref(false);
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <TooltipRoot v-model:open="open" disable-closing-trigger>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-flex shrink-0 items-center align-middle transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          :class="triggerClass ?? 'ml-1 text-slate-400 hover:text-sky-600 focus-visible:rounded-full'"
          :aria-label="text"
          :aria-expanded="open"
          @click.prevent.stop="open = !open"
        >
          <slot name="trigger"><Info class="h-3.5 w-3.5" /></slot>
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side="top"
          :side-offset="7"
          :collision-padding="12"
          class="z-[100] max-w-64 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg"
        >
          <slot>{{ text }}</slot>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
