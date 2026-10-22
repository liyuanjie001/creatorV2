<script setup lang="ts">
import { Image, FileAudio, FileText, Wand2, Play } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
const { a } = defineProps<{
  a: Asset;
}>();
</script>

<template>
  <div class="thumb-gradient relative flex h-full w-full items-center justify-center">
    <div class="absolute -right-3 -top-4 h-16 w-16 rounded-full bg-sky-100 blur-xl"></div>
    <template v-if="a.type === '视频'">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110"
      >
        <Play class="h-4 w-4 text-white" fill="currentColor"></Play>
      </span>
      <template v-if="a.duration">
        <span
          class="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90"
        >
          {{ a.duration }}
        </span>
      </template>
    </template>
    <template v-if="a.type !== '视频'">
      <span class="text-white/70">
        <template v-if="a.type === '图片'"><Image class="h-6 w-6"></Image></template>
        <template v-else>
          <template v-if="a.type === '音频'"><FileAudio class="h-6 w-6"></FileAudio></template>
          <template v-else><FileText class="h-6 w-6"></FileText></template>
        </template>
      </span>
    </template>
    <template v-if="a.enhanced">
      <span
        class="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-sky-500/90 px-1.5 py-0.5 text-[9.5px] font-medium text-white"
      >
        <Wand2 class="h-2.5 w-2.5"></Wand2>
        已增强
      </span>
    </template>
  </div>
</template>
