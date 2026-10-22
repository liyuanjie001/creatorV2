<script setup lang="ts">
import { FolderPlus, Play, MoreHorizontal, FolderOpen } from 'lucide-vue-next';
import { PlatformBadge, Thumb } from '@/components/shared';
import type { ConsoleDraft } from '@/types/domain';
import CreationConsole from '@/components/CreationConsole.vue';
import { type Platform } from '@/data/mock';
import { toast } from 'vue-sonner';
import ShowcaseCarousel from '@/components/ShowcaseCarousel.vue';
import { ref } from 'vue';
interface Creation {
  id: number;
  platform: Platform;
  title: string;
  tag: string;
  time: string;
}
const initialCreations: Creation[] = [
  {
    id: 1,
    platform: 'TikTok',
    title: '精华实测 · 悬念开头版',
    tag: '视频',
    time: '昨天 16:20',
  },
  {
    id: 2,
    platform: 'Instagram',
    title: '品牌 KV · 蓝白主视觉',
    tag: '图文',
    time: '昨天 10:05',
  },
  {
    id: 3,
    platform: 'YouTube',
    title: '投影仪露营测评 · 篝火段',
    tag: '视频',
    time: '10-19 14:32',
  },
];
const generating = ref(false);
const creations = ref<Creation[]>(initialCreations);
const handleDone = (items: ConsoleDraft[]) => {
  creations.value = [
    ...items.map((d, i) => ({
      id: Date.now() + i,
      platform: d.platform,
      title: d.title,
      tag: d.tag,
      time: '刚刚',
    })),
    ...creations.value,
  ];
  generating.value = false;
  toast.success(`已生成 ${items.length} 条内容，已加入「我的创作」`);
};
</script>

<template>
  <div class="space-y-8">
    <div class="pt-4">
      <ShowcaseCarousel></ShowcaseCarousel>
      <h1 class="mt-2 text-center text-3xl font-bold brand-text">让你的品牌故事鲜活起来</h1>
      <p class="mt-2 text-center text-[13px] text-slate-500">
        描述场景或产品，AI 自动生成面向海外社媒的短视频与图文内容
      </p>
    </div>
    <CreationConsole
      class="mx-auto max-w-4xl"
      @start="generating = true"
      @done="handleDone"
    ></CreationConsole>
    <div class="mx-auto max-w-4xl">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-[15px] font-semibold text-slate-800">我的创作</h2>
        <button
          @click="toast.info('打开素材库（演示）')"
          class="text-[12px] text-slate-400 transition-colors hover:text-sky-600"
        >
          查看全部 →
        </button>
      </div>
      <div class="grid grid-cols-4 gap-3">
        <button
          @click="toast.success('新建创作（演示）')"
          class="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
        >
          <FolderPlus class="h-6 w-6"></FolderPlus>
          <span class="text-[12px]">新建创作</span>
        </button>
        <template v-if="generating">
          <div class="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50">
            <div class="thumb-gradient h-full w-full rounded-xl opacity-40"></div>
          </div>
        </template>
        <template :key="c.title" v-for="c in creations">
          <div class="group relative aspect-video overflow-hidden rounded-xl border border-slate-200">
            <Thumb class="h-full w-full">
              <span class="absolute left-2 top-2">
                <PlatformBadge :platform="c.platform"></PlatformBadge>
              </span>
              <span
                class="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85"
              >
                <Play class="h-2.5 w-2.5" fill="currentColor"></Play>
                {{ c.tag }}
              </span>
            </Thumb>
            <div
              class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <button
                @click="toast.info('预览（演示）')"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600"
              >
                <Play class="h-3.5 w-3.5" fill="currentColor"></Play>
              </button>
              <button
                @click="toast.success('已加入项目素材（演示）')"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600"
              >
                <FolderOpen class="h-3.5 w-3.5"></FolderOpen>
              </button>
              <button
                @click="toast.info('更多（演示）')"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600"
              >
                <MoreHorizontal class="h-3.5 w-3.5"></MoreHorizontal>
              </button>
            </div>
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-1.5 pt-5"
            >
              <div class="truncate text-[11px] font-medium text-white">
                {{ c.title }}
              </div>
              <div class="text-[10px] text-white/65">{{ c.time }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
