<script setup lang="ts">
import { useDemoTimers } from '@/composables/useDemoTimers';
import { Play } from 'lucide-vue-next';
import { type Platform } from '@/data/mock';
import { cn } from '@/lib/utils';
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { useVideoPlayer } from '@/composables/useVideoPlayer';

const emit = defineEmits<{
  select: [item: (typeof showcase)[number]];
}>();
const { openVideo } = useVideoPlayer();

const showcase = [
  {
    title: '精华实测 · Before/After',
    project: 'GlowUp 美妆出海',
    platform: 'TikTok' as Platform,
  },
  {
    title: '夜晚投影实拍',
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
const paused = ref(false);
const len = showcase.length;
const root = ref<HTMLElement | null>(null);
const width = ref(1200);
const { repeat } = useDemoTimers();
let observer: ResizeObserver | undefined;

function measure() {
  if (!root.value) return;
  const next = root.value.clientWidth;
  if (next > 0) width.value = next;
}

onMounted(async () => {
  await nextTick();
  measure();
  if (root.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure());
    observer.observe(root.value);
  }
  window.addEventListener('resize', measure);
  repeat(() => {
    if (!paused.value) active.value = (active.value + 1) % len;
  }, 3500);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', measure);
});

/** 5 张卡铺满整行：两侧贴边，中间放大 */
const step = computed(() => width.value / 4);
const cardWidth = computed(() => width.value / 3.35);

const slides = computed(() =>
  showcase.map((s, i) => {
    let offset = (i - active.value + len) % len;
    if (offset > len / 2) offset -= len;
    return {
      ...s,
      index: i,
      offset,
      abs: Math.abs(offset),
    };
  }),
);

function onCardClick(index: number) {
  if (index === active.value) {
    const item = showcase[index]!;
    openVideo({
      kind: 'generic',
      id: `showcase-${index}`,
      title: item.title,
      platform: item.platform,
      project: item.project,
      typeLabel: '视频',
      duration: '00:30',
      primaryAction: {
        label: '去翻拍',
        run: () => emit('select', item),
      },
    });
    return;
  }
  active.value = index;
}
</script>

<template>
  <div
    ref="root"
    class="relative h-56 w-full select-none overflow-hidden"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <button
      v-for="s in slides"
      :key="s.title"
      type="button"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
      :style="{
        width: `${cardWidth}px`,
        transform: `translate(-50%, -50%) translateX(${s.offset * step}px) scale(${s.abs === 0 ? 1.05 : 0.86})`,
        zIndex: 20 - s.abs,
        opacity: s.abs > 2 ? 0 : 1 - s.abs * 0.18,
        pointerEvents: s.abs > 2 ? 'none' : 'auto',
      }"
      @click="onCardClick(s.index)"
    >
      <div
        :class="
          cn(
            'thumb-gradient relative aspect-video overflow-hidden rounded-xl border shadow-lg',
            s.abs === 0
              ? 'border-white shadow-[0_12px_28px_rgba(17,163,253,0.28)]'
              : 'border-white/60 shadow-md',
          )
        "
      >
        <Play
          class="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/85"
          fill="currentColor"
        />
        <div class="absolute bottom-2.5 left-2.5 right-2.5 text-left">
          <div class="truncate text-[12px] font-medium text-white">{{ s.title }}</div>
          <div class="mt-0.5 text-[10px] text-white/70">{{ s.project }}</div>
        </div>
      </div>
    </button>
  </div>
</template>
