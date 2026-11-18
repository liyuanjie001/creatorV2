<script setup lang="ts">
import {
  ArrowUpRight,
  Building2,
  Clapperboard,
  CalendarClock,
  SlidersHorizontal,
  FileText,
  GraduationCap,
  Layers3,
  Globe2,
} from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { platforms } from '@/data/mock';

defineEmits<{ contact: [] }>();

const brands = [
  { name: 'NOVA HOME', detail: '家居生活', style: 'tracking-[0.16em]' },
  { name: 'lumora', detail: '美妆个护', style: 'font-serif italic tracking-wide' },
  { name: 'ORBIT GEAR', detail: '科技数码', style: 'tracking-tight' },
  { name: 'VELA', detail: '服饰配件', style: 'font-serif tracking-[0.24em]' },
  { name: 'MOSS & CO.', detail: '户外运动', style: 'tracking-wider' },
  { name: 'AURA LAB', detail: '健康生活', style: 'tracking-[0.12em]' },
];
const services = [
  {
    icon: SlidersHorizontal,
    title: '灵活用量与报价',
    description: '根据内容产量、账号规模与业务场景，配置专属方案与报价。',
  },
  {
    icon: Clapperboard,
    title: '品牌内容定制',
    description: '围绕品牌调性，规划脚本模板、多语言视频与批量创作流程。',
  },
  {
    icon: CalendarClock,
    title: '定时发布与矩阵规划',
    description: '结合营销节点安排发布日历，规划多平台、多账号的内容节奏。',
  },
  {
    icon: FileText,
    title: '商务采购支持',
    description: '按企业采购流程，沟通合同、对公付款及开票需求。',
  },
  {
    icon: GraduationCap,
    title: '培训与运营陪跑',
    description: '按团队分工规划产品培训、工作流演练与阶段复盘。',
  },
  {
    icon: Layers3,
    title: '团队协作与资产管理',
    description: '按需规划成员权限、素材归档和账号协作，让团队配合更顺畅。',
  },
];
</script>

<template>
  <section
    aria-label="定制化服务"
    class="enterprise-services relative isolate overflow-hidden rounded-[24px] border border-[#282636] bg-[#111018] text-white"
  >
    <div
      class="pointer-events-none absolute -right-24 -top-40 -z-10 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px]"
      aria-hidden="true"
    />
    <div class="px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-xl">
          <p class="mb-3 flex items-center gap-2 text-xs font-medium tracking-widest text-violet-300">
            <Building2 class="h-4 w-4" aria-hidden="true" />
            企业定制 · 专属服务
          </p>
          <h2 class="text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            让品牌内容，
            <span class="enterprise-accent">规模化走向全球</span>
          </h2>
          <p class="mt-3 max-w-lg text-sm leading-7 text-slate-400">
            面向品牌、商家与内容团队，从内容创作到多平台发布，定制适合业务的增长工作流。
          </p>
        </div>
        <dl class="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-8" aria-label="服务规模示例数据">
          <div>
            <dt class="text-[11px] text-slate-400">品牌与团队 · 示例</dt>
            <dd
              class="enterprise-accent mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[30px]"
            >
              1,200+
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-slate-400">已生成视频 · 示例</dt>
            <dd
              class="enterprise-accent mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[30px]"
            >
              240万+
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-slate-400">覆盖社媒平台</dt>
            <dd
              class="enterprise-accent mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[30px]"
            >
              {{ platforms.length }}
              <span class="text-xs font-normal text-slate-400">个</span>
            </dd>
          </div>
        </dl>
      </div>

      <div class="mt-7 border-t border-white/10 pt-5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>
            合作品牌展示
            <span class="ml-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
              MOCK
            </span>
          </p>
          <p>品牌及视频数量为演示数据</p>
        </div>
        <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="模拟合作品牌">
          <li
            v-for="brand in brands"
            :key="brand.name"
            class="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2 py-3 text-center"
          >
            <span class="text-sm font-semibold text-slate-300" :class="brand.style">{{ brand.name }}</span>
            <span class="text-[10px] text-slate-400">{{ brand.detail }}</span>
          </li>
        </ul>
      </div>

      <div class="enterprise-offer mt-6 rounded-2xl border border-white/10 p-5 sm:p-7">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-medium text-fuchsia-300">定制化服务</p>
            <h3 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">面向企业的 AI 内容服务</h3>
            <p class="mt-2 text-xs leading-6 text-slate-400">
              按需组合服务项目，专属对接从需求沟通到上线陪跑。
            </p>
          </div>
          <Button
            class="enterprise-cta h-10 w-fit rounded-xl px-5 text-white hover:brightness-110 focus-visible:ring-violet-300"
            @click="$emit('contact')"
          >
            联系商务
            <ArrowUpRight class="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <ul
          class="mt-6 grid gap-x-8 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="定制服务项目"
        >
          <li v-for="service in services" :key="service.title" class="flex items-start gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/10 text-violet-300"
            >
              <component :is="service.icon" class="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h4 class="text-sm font-medium text-slate-100">{{ service.title }}</h4>
              <p class="mt-1.5 text-xs leading-6 text-slate-400">{{ service.description }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex shrink-0 items-center gap-2 text-xs text-slate-400">
          <Globe2 class="h-4 w-4 text-violet-300" aria-hidden="true" />
          一套工作流，连接全球社媒
        </p>
        <ul class="flex flex-wrap gap-2" aria-label="覆盖社媒平台">
          <li
            v-for="platform in platforms"
            :key="platform"
            class="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-slate-300"
          >
            {{ platform }}
          </li>
        </ul>
      </div>
    </div>
    <div
      class="flex flex-col gap-3 border-t border-white/10 bg-white/[0.025] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
    >
      <div>
        <p class="text-sm font-medium text-slate-100">正在为团队或企业寻找专属方案？</p>
        <p class="mt-1.5 text-xs leading-6 text-slate-400">
          沟通业务目标与内容规模，获取适合团队的服务组合。
        </p>
      </div>
      <Button
        variant="outline"
        class="w-fit rounded-full border-white/20 bg-transparent text-slate-100 hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:ring-violet-300"
        @click="$emit('contact')"
      >
        咨询定制方案
        <ArrowUpRight class="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  </section>
</template>

<style scoped>
.enterprise-accent {
  background: linear-gradient(110deg, #f472b6 5%, #c084fc 90%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.enterprise-offer {
  background: linear-gradient(
    115deg,
    rgba(174, 67, 123, 0.1),
    rgba(110, 67, 163, 0.09) 55%,
    rgba(255, 255, 255, 0.025)
  );
}
.enterprise-cta {
  background: linear-gradient(105deg, #db2777, #9333ea);
}
</style>
