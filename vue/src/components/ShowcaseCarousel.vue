<script setup lang="ts">
import { useDemoTimers } from '@/composables/useDemoTimers';
const { repeat } = useDemoTimers();
import { Play } from 'lucide-vue-next';
import { type Platform } from '@/data/mock';
import { cn } from '@/lib/utils';
import { ref, onMounted, computed } from 'vue';
const showcase = [
  {
    title: '精华实测 · Before/After',
    project: 'GlowUp 美妆出海',
    platform: 'TikTok' as Platform,
  },
  {
    title: '露营夜晚投影实拍',
    project: 'TechNova 北美',
    platform: 'YouTube' as Platform,
  },
  {
    title: '黑五倒计时短片',
    project: 'BlackFriday 大促',
    platform: 'Instagram' as Platform,
  },
  {
    title: '圣诞礼盒开箱',
    project: 'Noël 欧洲站',
    platform: 'Instagram' as Platform,
  },
  {
    title: '数字人口播 · 六国语言',
    project: 'LinguaVoice',
    platform: 'TikTok' as Platform,
  },
];
const active = ref(0);
const len = showcase.length;
onMounted(() => {
  repeat(() => (active.value = (active.value + 1) % len), 3500);
});
const slides = computed(() =>
  showcase.map((s, i) => {
    let offset = (i - active.value + len) % len;
    if (offset > len / 2) offset -= len;
    return {
      ...s,
      offset,
      abs: Math.abs(offset),
    };
  }),
);
</script>

<template>
  <div class="relative mx-auto h-44 max-w-3xl select-none">
    <template :key="s.title" v-for="s in slides">
      <div
        class="absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
        :style="{
          transform: `translate(-50%, -50%) translateX(${s.offset * 200}px) scale(${s.abs === 0 ? 1 : 0.82})`,
          zIndex: 20 - s.abs,
          opacity: s.abs > 2 ? 0 : 1 - s.abs * 0.25,
        }"
      >
        <div
          :class="
            cn(
              'thumb-gradient relative aspect-video overflow-hidden rounded-xl border shadow-lg',
              s.abs === 0 ? 'border-white shadow-sky-200' : 'border-white/60',
            )
          "
        >
          <Play
            class="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white/80"
            fill="currentColor"
          ></Play>
          <div class="absolute bottom-2 left-2 right-2">
            <div class="truncate text-[11px] font-medium text-white">
              {{ s.title }}
            </div>
            <div class="text-[10px] text-white/70">{{ s.project }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
