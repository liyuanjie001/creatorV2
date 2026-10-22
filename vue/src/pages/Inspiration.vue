<script setup lang="ts">
import { Copy, Bookmark, Search, SlidersHorizontal, Flame } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PageHeader, PlatformBadge, Thumb, HeatBar } from '@/components/shared';
import TrendsPanel from '@/components/TrendsPanel.vue';
import NotesPanel from '@/components/NotesPanel.vue';
import { inspirations, platforms, type Platform } from '@/data/mock';
import { cn } from '@/lib/utils';
import { useRouter, useRoute } from 'vue-router';
import { ref, computed } from 'vue';
const filters = ['全部', '高热度', '可翻拍', '视频', '图文'] as const;
const tabs = [
  {
    key: 'inspire',
    label: '内容灵感',
    desc: '采集海外全平台爆款内容，拆解脚本结构，一键翻拍为你的品牌素材',
  },
  {
    key: 'trends',
    label: '热点趋势',
    desc: '实时追踪海外 6 大平台热搜话题与关键词走势，抢在流量爆发前布局',
  },
  {
    key: 'notes',
    label: '妙记',
    desc: 'AI 灵感对话自动保存的备忘，随时回看并复用你之前的想法',
  },
] as const;
type TabKey = (typeof tabs)[number]['key'];
const route = useRoute();
const router = useRouter();
const searchParams = computed(() => new URLSearchParams(route.fullPath.split('?')[1] ?? ''));
const setSearchParams = (
  query: Record<string, string>,
  options?: {
    replace?: boolean;
  },
) =>
  options?.replace
    ? router.replace({
        query,
      })
    : router.push({
        query,
      });
const tab = computed(() => (searchParams.value.get('tab') ?? 'inspire') as TabKey);
const activeTab = computed(() => (tabs.some((t) => t.key === tab.value) ? tab.value : 'inspire'));
const platform = ref<Platform | '全部'>('全部');
const filter = ref<(typeof filters)[number]>('全部');
const list = computed(() =>
  inspirations.filter((v) => platform.value === '全部' || v.platform === platform.value),
);
const meta = computed(() => tabs.find((t) => t.key === activeTab.value)!);
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="创意中心" :desc="meta.desc">
      <template #extra>
        <template v-if="activeTab === 'inspire'">
          <Button
            variant="outline"
            size="sm"
            class="gap-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <SlidersHorizontal class="h-3.5 w-3.5"></SlidersHorizontal>
            批量操作
          </Button>
        </template>
        <template v-else>{{ undefined }}</template>
      </template>
    </PageHeader>
    <div class="flex w-fit items-center gap-1 rounded-xl bg-slate-100/80 p-1">
      <template :key="t.key" v-for="t in tabs">
        <button
          @click="
            setSearchParams(
              {
                tab: t.key,
              },
              {
                replace: true,
              },
            )
          "
          :class="
            cn(
              'rounded-lg px-4 py-1.5 text-[13px] transition-all',
              activeTab === t.key
                ? 'bg-white font-medium text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
            )
          "
        >
          {{ t.label }}
        </button>
      </template>
    </div>
    <template v-if="activeTab === 'inspire'">
      <div class="flex items-center gap-3">
        <div class="relative w-72">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          ></Search>
          <Input
            placeholder="搜索灵感关键词、话题、作者…"
            class="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
          ></Input>
        </div>
        <div class="flex items-center gap-1.5">
          <template :key="p" v-for="p in ['全部', ...platforms]">
            <button
              @click="platform = p"
              :class="
                cn(
                  'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                  platform === p
                    ? 'brand-gradient font-medium text-white'
                    : 'border border-slate-200 text-slate-500 hover:text-slate-800',
                )
              "
            >
              {{ p }}
            </button>
          </template>
        </div>
        <div class="ml-auto flex items-center gap-1.5">
          <template :key="f" v-for="f in filters">
            <button
              @click="filter = f"
              :class="
                cn(
                  'rounded-lg px-2.5 py-1.5 text-[12px] transition-colors',
                  filter === f ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-800',
                )
              "
            >
              {{ f }}
            </button>
          </template>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <template :key="v.title" v-for="v in list">
          <Card class="glass-card group overflow-hidden border-slate-200">
            <div class="relative">
              <Thumb class="aspect-video w-full">
                <span
                  class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85"
                >
                  {{ v.duration }}
                </span>
                <span class="absolute left-2 top-2">
                  <PlatformBadge :platform="v.platform"></PlatformBadge>
                </span>
                <span
                  class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-amber-300"
                >
                  <Flame class="h-3 w-3"></Flame>
                  热度 {{ v.heat }}
                </span>
              </Thumb>
              <div
                class="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Button size="sm" class="gap-1.5 brand-gradient text-white hover:opacity-90">
                  <Copy class="h-3.5 w-3.5"></Copy>
                  一键翻拍
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  class="gap-1.5 border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white"
                >
                  <Bookmark class="h-3.5 w-3.5"></Bookmark>
                  收藏
                </Button>
              </div>
            </div>
            <div class="p-4">
              <div class="text-[14px] font-medium leading-snug text-slate-800">
                {{ v.title }}
              </div>
              <div class="mt-1.5 text-[12px] text-slate-400">
                {{ v.author }} · {{ v.views }} 播放 · {{ v.likes }} 点赞
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <template :key="t" v-for="t in v.tags">
                  <Badge
                    variant="outline"
                    class="border-slate-200 bg-slate-50 text-[11px] font-normal text-slate-500"
                  >
                    #{{ t }}
                  </Badge>
                </template>
              </div>
              <div class="mt-3">
                <HeatBar :value="v.heat"></HeatBar>
              </div>
            </div>
          </Card>
        </template>
      </div>
    </template>
    <template v-if="activeTab === 'trends'"><TrendsPanel></TrendsPanel></template>
    <template v-if="activeTab === 'notes'"><NotesPanel embedded></NotesPanel></template>
  </div>
</template>
