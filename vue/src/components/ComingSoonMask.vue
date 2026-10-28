<script setup lang="ts">
import { ArrowLeft, Sparkles, Rocket, Layers, Zap } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    /** entry：标题旁入口；page：盖住当前子页面的磨砂层 + 居中卡片 */
    mode?: 'entry' | 'page';
    title?: string;
    desc?: string;
    /** 短标签，建议不超过 3 个、每项约 6 字 */
    highlights?: string[];
    label?: string;
    backLabel?: string;
  }>(),
  {
    mode: 'entry',
    title: '敬请期待',
    desc: '全新能力加紧打磨中，上线后第一时间开放。敬请稍候，马上就能在这里用起来。',
    highlights: () => [],
    label: '敬请期待',
    backLabel: '返回功能页面',
  },
);

const emit = defineEmits<{
  open: [];
  back: [];
}>();

const chipIcons = [Rocket, Layers, Zap];
</script>

<template>
  <button
    v-if="mode === 'entry'"
    type="button"
    class="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-600 transition-colors hover:border-sky-300 hover:bg-sky-100/80 hover:text-sky-700"
    @click="emit('open')"
  >
    <Sparkles class="h-3 w-3" />
    {{ label }}
  </button>

  <div
    v-else
    class="absolute inset-0 z-30 flex items-center justify-center p-6"
    role="status"
  >
    <div
      class="absolute inset-0 bg-white/45 backdrop-blur-[8px] backdrop-saturate-150"
      aria-hidden="true"
    />

    <button
      type="button"
      class="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:border-sky-200 hover:bg-white hover:text-sky-600"
      @click="emit('back')"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      {{ backLabel }}
    </button>

    <div
      class="coming-soon-card relative z-10 w-full max-w-xl max-h-[calc(100%-2.5rem)] overflow-y-auto rounded-[28px] border border-white/90 px-8 pb-9 pt-8 text-center shadow-[0_20px_50px_-16px_rgba(14,165,233,0.18)] scroll-slim"
    >
      <!-- 插图：即将上线 -->
      <div class="mx-auto mb-5 flex h-36 w-full max-w-[260px] items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 280 160" class="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="140" cy="132" rx="88" ry="14" fill="#BAE6FD" fill-opacity="0.45" />
          <rect x="78" y="48" width="124" height="78" rx="16" fill="white" fill-opacity="0.92" stroke="#7DD3FC" stroke-width="2" />
          <rect x="94" y="64" width="52" height="8" rx="4" fill="#E0F2FE" />
          <rect x="94" y="80" width="72" height="6" rx="3" fill="#F0F9FF" />
          <rect x="94" y="94" width="40" height="6" rx="3" fill="#F0F9FF" />
          <circle cx="188" cy="78" r="22" fill="#38BDF8" fill-opacity="0.18" />
          <path
            d="M178 86c4-14 14-22 22-24-2 10-6 18-14 24-3 2-6 2-8 0z"
            fill="#0EA5E9"
            fill-opacity="0.85"
          />
          <path d="M196 64l8-10 2 8 8 3-8 4-1 8-5-7-9 1 5-7z" fill="#38BDF8" />
          <circle cx="108" cy="40" r="5" fill="#7DD3FC" fill-opacity="0.7" />
          <circle cx="198" cy="46" r="3.5" fill="#BAE6FD" />
          <circle cx="72" cy="88" r="4" fill="#E0F2FE" />
          <path d="M156 36c6-2 10 2 10 6" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" opacity="0.55" />
        </svg>
      </div>

      <p class="mt-1 text-[24px] font-semibold tracking-tight text-slate-800">
        {{ title }}
      </p>

      <p class="mx-auto mt-2.5 max-w-[22rem] text-[14px] leading-6 text-slate-500">
        {{ desc }}
      </p>

      <div
        v-if="highlights.length"
        class="mt-5 flex flex-nowrap items-center justify-center gap-2.5"
      >
        <span
          v-for="(item, index) in highlights.slice(0, 3)"
          :key="index"
          class="inline-flex shrink-0 items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-2.5 text-[15px] font-medium text-slate-700 shadow-sm shadow-sky-100/40"
        >
          <component :is="chipIcons[index % chipIcons.length]" class="h-5 w-5 shrink-0 text-sky-500" />
          {{ item }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 参考 ChatGPT Plus 到期弹窗：顶部青蓝/薄荷 aurora，下半纯白 */
.coming-soon-card {
  background-color: #ffffff;
  background-image:
    radial-gradient(ellipse 48% 38% at 12% -4%, rgba(153, 246, 228, 0.55) 0%, transparent 70%),
    radial-gradient(ellipse 62% 44% at 88% -2%, rgba(125, 211, 252, 0.65) 0%, transparent 68%),
    radial-gradient(ellipse 110% 58% at 50% -18%, rgba(186, 230, 253, 0.9) 0%, rgba(224, 242, 254, 0.35) 42%, transparent 72%),
    linear-gradient(180deg, #dbeefe 0%, #f3faff 28%, #ffffff 48%);
}
</style>
