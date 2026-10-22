<script setup lang="ts">
import { eventValue } from '@/lib/events';
import {
  Star,
  Wand2,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  UploadCloud,
  Check,
  X,
} from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { type Asset } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
type NavKey = 'all' | 'project' | 'favorite' | 'element' | 'trash' | Asset['type'] | 'enhanced';
const navTitles: Record<NavKey, string> = {
  all: '素材',
  project: '项目',
  favorite: '收藏',
  element: '元素',
  trash: '回收站',
  图片: '图片',
  视频: '视频',
  音频: '音频',
  文案: '文案',
  enhanced: '已增强',
};
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';
const { nav, view, query, filterOpen, favOnly, selected } = useAssetLibraryContext();
</script>

<template>
  <div class="flex items-center gap-3">
    <h1 class="text-lg font-semibold text-slate-800">
      {{ navTitles[nav] }}
    </h1>
    <template v-if="selected.size > 0">
      <span class="flex items-center gap-2 rounded-full bg-sky-50 py-1 pl-3 pr-1.5 text-[12px] text-sky-600">
        已选 {{ selected.size }} 项
        <button @click="selected = new Set()" class="rounded-full p-0.5 hover:bg-sky-100">
          <X class="h-3 w-3"></X>
        </button>
      </span>
    </template>
    <div class="ml-auto flex items-center gap-2">
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        ></Search>
        <Input
          :value="query"
          @input="query = eventValue($event)"
          placeholder="搜索素材…"
          class="h-9 w-52 border-slate-200 bg-white pl-9 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
        ></Input>
      </div>
      <div class="relative">
        <Button
          variant="outline"
          size="sm"
          :class="
            cn(
              'h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900',
              filterOpen && 'border-sky-300 bg-sky-50 text-sky-600',
            )
          "
          @click="filterOpen = !filterOpen"
        >
          <SlidersHorizontal class="h-4 w-4"></SlidersHorizontal>
          筛选
        </Button>
        <template v-if="filterOpen">
          <div
            class="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60"
          >
            <button
              @click="favOnly = !favOnly"
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
            >
              <Star
                :class="cn('h-3.5 w-3.5', favOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-300')"
              ></Star>
              仅看收藏
              <template v-if="favOnly"><Check class="ml-auto h-3.5 w-3.5 text-sky-500"></Check></template>
            </button>
            <button
              @click="
                nav = 'enhanced';
                filterOpen = false;
              "
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
            >
              <Wand2 class="h-3.5 w-3.5 text-slate-300"></Wand2>
              仅看已增强
            </button>
          </div>
        </template>
      </div>
      <div class="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
        <button
          @click="view = 'grid'"
          title="网格视图"
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              view === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
            )
          "
        >
          <LayoutGrid class="h-4 w-4"></LayoutGrid>
        </button>
        <button
          @click="view = 'list'"
          title="列表视图"
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              view === 'list' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
            )
          "
        >
          <List class="h-4 w-4"></List>
        </button>
      </div>
      <Button
        size="sm"
        class="h-9 gap-2 brand-gradient px-4 text-white hover:opacity-90"
        @click="toast.success('上传功能为演示占位')"
      >
        <UploadCloud class="h-4 w-4"></UploadCloud>
        上传素材
      </Button>
    </div>
  </div>
</template>
