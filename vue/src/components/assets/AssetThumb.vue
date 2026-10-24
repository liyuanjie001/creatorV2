<script setup lang="ts">
import { Image, FileAudio, FileText, Wand2, Play, Folder } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
const { a } = defineProps<{
  a: Asset;
}>();
</script>

<template>
  <div
    :class="
      a.type === '文件夹'
        ? 'relative flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/80'
        : 'thumb-gradient relative flex h-full w-full items-center justify-center'
    "
  >
    <div
      v-if="a.type !== '文件夹'"
      class="absolute -right-3 -top-4 h-16 w-16 rounded-full bg-sky-100 blur-xl"
    />
    <template v-if="a.type === '文件夹'">
      <Folder class="h-12 w-12 text-amber-500/90" fill="currentColor" :strokeWidth="1.25" />
      <span
        v-if="a.itemCount != null"
        class="absolute bottom-1.5 right-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90"
      >
        {{ a.itemCount }} 项
      </span>
    </template>
    <template v-else-if="a.type === '视频'">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110"
      >
        <Play class="h-4 w-4 text-white" fill="currentColor" />
      </span>
      <span
        v-if="a.duration"
        class="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90"
      >
        {{ a.duration }}
      </span>
    </template>
    <template v-else>
      <span class="text-white/70">
        <Image v-if="a.type === '图片'" class="h-6 w-6" />
        <FileAudio v-else-if="a.type === '音频'" class="h-6 w-6" />
        <FileText v-else class="h-6 w-6" />
      </span>
    </template>
    <span
      v-if="a.enhanced"
      class="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-sky-500/90 px-1.5 py-0.5 text-[9.5px] font-medium text-white"
    >
      <Wand2 class="h-2.5 w-2.5" />
      已增强
    </span>
  </div>
</template>
