<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { PlatformBadge, Thumb } from '@/components/shared';
import type { ConsoleDraft } from '@/types/domain';
import CreationConsole from '@/components/CreationConsole.vue';
import { type Platform } from '@/data/mock';
import { toast } from 'vue-sonner';
import ShowcaseCarousel from '@/components/ShowcaseCarousel.vue';
import { computed, ref } from 'vue';
import { useVideoPlayer } from '@/composables/useVideoPlayer';

interface Creation {
  id: number;
  platform: Platform;
  title: string;
  tag: string;
  duration: string;
}

const { openVideo } = useVideoPlayer();

function openCreation(c: Creation) {
  openVideo({
    kind: 'generic',
    id: String(c.id),
    title: c.title,
    duration: c.duration,
    platform: c.platform,
    typeLabel: c.tag,
    primaryAction: {
      label: '下载',
      run: () => toast.success('已开始下载（演示）'),
    },
  });
}
const initialCreations: Creation[] = [
  {
    id: 1,
    platform: 'TikTok',
    title: '精华实测 · 悬念开头版',
    tag: '视频',
    duration: '16:20',
  },
  {
    id: 2,
    platform: 'Instagram',
    title: '品牌 KV · 蓝白主视觉',
    tag: '图文',
    duration: '10:05',
  },
  {
    id: 3,
    platform: 'YouTube',
    title: '投影仪露营测评 · 篝火段',
    tag: '视频',
    duration: '14:32',
  },
];
const generating = ref(false);
const creations = ref<Creation[]>(initialCreations);
const query = ref('');
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return creations.value;
  return creations.value.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q),
  );
});
const handleDone = (items: ConsoleDraft[]) => {
  creations.value = [
    ...items.map((d, i) => ({
      id: Date.now() + i,
      platform: d.platform,
      title: d.title,
      tag: d.tag === '转化导向' ? '图文' : '视频',
      duration: '00:15',
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
        可选择产品卡与目标项目；未选项目时点击生成会自动新建项目
      </p>
    </div>
    <CreationConsole
      class="mx-auto max-w-4xl"
      placeholder="描述你的场景，使用 @ 添加产品卡信息"
      @start="generating = true"
      @done="handleDone"
    ></CreationConsole>
    <div>
      <div class="mb-3 flex items-center gap-3">
        <h2 class="shrink-0 text-[15px] font-semibold text-slate-800">创作记录</h2>
        <div class="relative w-64 max-w-full">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            v-model="query"
            placeholder="搜索标题、平台、类型…"
            class="h-8 border-slate-200 bg-slate-50 pl-9 text-[12.5px] placeholder:text-slate-300 focus-visible:ring-sky-300"
          />
        </div>
      </div>
      <div class="grid grid-cols-5 gap-3">
        <template v-if="generating">
          <div class="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50">
            <div class="thumb-gradient h-full w-full rounded-xl opacity-40"></div>
          </div>
        </template>
        <template :key="c.title" v-for="c in filtered">
          <div class="group relative aspect-video overflow-hidden rounded-xl border border-slate-200">
            <Thumb class="h-full w-full">
              <span class="absolute left-2 top-2">
                <PlatformBadge :platform="c.platform"></PlatformBadge>
              </span>
            </Thumb>
            <div
              class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <button
                type="button"
                class="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600"
                @click="openCreation(c)"
              >
                查看
              </button>
              <button
                @click="toast.success('已开始下载（演示）')"
                class="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600"
              >
                下载
              </button>
            </div>
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8"
            >
              <div class="truncate text-[12px] font-medium text-white">
                {{ c.title }}
              </div>
              <div class="mt-1 flex items-center justify-between text-[10px] text-white/80">
                <span>时长: {{ c.duration }}</span>
                <span class="rounded bg-white/20 px-1.5 py-0.5 text-white/90">{{ c.tag }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
