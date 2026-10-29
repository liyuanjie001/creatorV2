<script setup lang="ts">
import { ArrowLeft, Sparkles, Rocket, Layers, Zap, type LucideIcon } from 'lucide-vue-next';
import { computed } from 'vue';

const props = withDefaults(
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

const featureDescMap: Record<string, string> = {
  多平台管号: '统一接入 TikTok、Instagram 等多平台账号，矩阵投放一处统筹。',
  窗口同步: '浏览器窗口与项目账号实时同步，切换环境不再反复登录。',
  身份隔离: '独立 Cookie 与登录态隔离，降低串号与风控风险。',
  多维对比: '按窗口、账号、平台横向对比核心指标，快速找差异。',
  爆款洞察: '锁定高播放与高互动内容，复用成功素材结构。',
  统一口径: '播放、互动统一统计口径，报表结论可直接对齐投放。',
};

const featureCards = computed(() =>
  props.highlights.slice(0, 3).map((title, index) => ({
    title,
    desc: featureDescMap[title] ?? '该能力正在加速打磨，上线后将与现有工作流无缝衔接。',
    icon: chipIcons[index % chipIcons.length] as LucideIcon,
  })),
);

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
    class="absolute inset-0 z-30 flex items-stretch justify-stretch p-4 pt-14 sm:p-5 sm:pt-14"
    role="status"
  >
    <div
      class="absolute inset-0 bg-white/45 backdrop-blur-[8px] backdrop-saturate-150"
      aria-hidden="true"
    />

    <button
      type="button"
      class="absolute left-5 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:border-sky-200 hover:bg-white hover:text-sky-600"
      @click="emit('back')"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      {{ backLabel }}
    </button>

    <div
      class="coming-soon-card relative z-10 flex w-full flex-1 flex-col overflow-y-auto rounded-[24px] border border-white/90 px-6 py-7 text-center shadow-[0_20px_50px_-16px_rgba(14,165,233,0.18)] scroll-slim sm:px-10 sm:py-9"
    >
      <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <!-- 顶部插图 + 文案 -->
        <div class="mx-auto mb-6 flex h-40 w-full max-w-[300px] items-center justify-center sm:h-44" aria-hidden="true">
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

        <p class="text-[26px] font-semibold tracking-tight text-slate-800 sm:text-[28px]">
          {{ title }}
        </p>
        <p class="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
          {{ desc }}
        </p>

        <!-- 能力亮点 -->
        <div
          v-if="featureCards.length"
          class="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3"
        >
          <div
            v-for="item in featureCards"
            :key="item.title"
            class="rounded-2xl border border-sky-100/80 bg-white/85 px-4 py-4 shadow-sm shadow-sky-100/30"
          >
            <div class="flex items-center gap-2.5">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <component :is="item.icon" class="h-5 w-5" />
              </span>
              <div class="text-[15px] font-semibold text-slate-800">{{ item.title }}</div>
            </div>
            <p class="mt-2.5 text-[13px] leading-5 text-slate-500">{{ item.desc }}</p>
          </div>
        </div>

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
    linear-gradient(180deg, #dbeefe 0%, #f3faff 22%, #ffffff 42%);
}
</style>
