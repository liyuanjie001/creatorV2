<script setup lang="ts">
import { PenTool } from 'lucide-vue-next';
import { Thumb } from '@/components/shared';
import { toast } from 'vue-sonner';
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <button
      @click="toast.success('新建画板（演示）')"
      class="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
    >
      <PenTool class="h-6 w-6"></PenTool>
      <span class="text-[12px]">新建画板</span>
    </button>
    <template :key="i" v-for="(c, i) in ['脚本分镜板', '品牌情绪板', '黑五排期板']">
      <button
        @click="toast.info(`打开画板（演示）：${c}`)"
        class="group relative aspect-video overflow-hidden rounded-xl border border-slate-200"
      >
        <Thumb class="h-full w-full"></Thumb>
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-left"
        >
          <div class="text-[12.5px] font-medium text-white">
            {{ c }}
          </div>
          <div class="text-[10.5px] text-white/65">
            {{ ['昨天 18:20', '10-19 11:04', '10-17 09:30'][i] }}
            更新
          </div>
        </div>
      </button>
    </template>
  </div>
</template>
