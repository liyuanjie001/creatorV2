<script setup lang="ts">
import { Info } from 'lucide-vue-next';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui';
defineProps<{ text: string }>();
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button type="button" class="ml-1 inline-flex shrink-0 items-center align-middle text-slate-400 transition hover:text-sky-600 focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" :aria-label="text" @click.prevent.stop>
          <Info class="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="top" :side-offset="7" :collision-padding="12" class="z-[100] max-w-64 rounded-lg bg-slate-800 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg">{{ text }}</TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
