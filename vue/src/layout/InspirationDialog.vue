<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import InspireGenPanel from '@/components/InspireGenPanel.vue';
import { useInspirationDialog } from '@/composables/useInspirationDialog';

const { inspireOpen } = useInspirationDialog();
</script>

<template>
  <Dialog :open="inspireOpen" @update:open="inspireOpen = $event">
    <DialogContent class="max-h-[85vh] max-w-3xl overflow-y-auto scroll-slim border-slate-200 bg-white p-6">
      <DialogHeader>
        <DialogTitle class="text-[16px] text-slate-800">AI 灵感生成</DialogTitle>
        <DialogDescription class="text-[12.5px]">
          填入零碎想法，AI 自动整合、补充，整理成可执行的宣发方案
        </DialogDescription>
      </DialogHeader>
      <div class="mt-2">
        <InspireGenPanel @confirm="inspireOpen = false" />
      </div>
    </DialogContent>
  </Dialog>
</template>
