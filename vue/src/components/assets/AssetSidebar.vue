<script setup lang="ts">
import {
  FolderOpen,
  Folder,
  Star,
  Shapes,
  Trash2,
  Image,
  FileVideo,
  FileAudio,
  FileText,
  Wand2,
  Orbit,
  ArrowLeft,
} from 'lucide-vue-next';
import { assets, projects, assetElements, deletedAssets, type Asset } from '@/data/mock';
import { cn } from '@/lib/utils';
type NavKey = 'all' | 'project' | 'favorite' | 'element' | 'trash' | Asset['type'] | 'enhanced';
const libraryNav: {
  key: NavKey;
  label: string;
  icon: typeof FolderOpen;
  count: number;
}[] = [
  {
    key: 'all',
    label: '素材',
    icon: FolderOpen,
    count: assets.length,
  },
  {
    key: 'project',
    label: '项目',
    icon: Folder,
    count: projects.length,
  },
  {
    key: 'favorite',
    label: '收藏',
    icon: Star,
    count: assets.filter((a) => a.favorite).length,
  },
  {
    key: 'element',
    label: '元素',
    icon: Shapes,
    count: assetElements.length,
  },
  {
    key: 'trash',
    label: '回收站',
    icon: Trash2,
    count: deletedAssets.length,
  },
];
const toolNav: {
  key: NavKey;
  label: string;
  icon: typeof Image;
  count: number;
}[] = [
  {
    key: '图片',
    label: '图片',
    icon: Image,
    count: assets.filter((a) => a.type === '图片').length,
  },
  {
    key: '视频',
    label: '视频',
    icon: FileVideo,
    count: assets.filter((a) => a.type === '视频').length,
  },
  {
    key: '音频',
    label: '音频',
    icon: FileAudio,
    count: assets.filter((a) => a.type === '音频').length,
  },
  {
    key: '文案',
    label: '文案',
    icon: FileText,
    count: assets.filter((a) => a.type === '文案').length,
  },
  {
    key: 'enhanced',
    label: '已增强',
    icon: Wand2,
    count: assets.filter((a) => a.enhanced).length,
  },
];
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';
const { router, nav, selected } = useAssetLibraryContext();
</script>

<template>
  <aside class="flex w-48 shrink-0 flex-col border-r border-slate-200/80 bg-white">
    <div class="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
      <button
        @click="router.push('/')"
        title="返回主页"
        class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-slate-50"
      >
        <div
          class="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40"
        >
          <Orbit class="h-5 w-5 text-white"></Orbit>
        </div>
        <div class="min-w-0">
          <div class="text-[13.5px] font-semibold text-slate-800">出海动力</div>
          <div class="text-[10.5px] text-slate-400">素材库</div>
        </div>
      </button>
    </div>
    <button
      @click="router.push('/')"
      class="mx-2.5 mb-1 mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-sky-600"
    >
      <ArrowLeft class="h-3.5 w-3.5"></ArrowLeft>
      返回
    </button>
    <div class="flex-1 overflow-y-auto scroll-slim px-2.5 py-4">
      <nav class="space-y-0.5">
        <template :key="key" v-for="{ key, label, icon: Icon, count } in libraryNav">
          <button
            @click="
              nav = key;
              selected = new Set();
            "
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                nav === key
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <component :is="Icon" class="h-4 w-4 shrink-0"></component>
            <span class="flex-1 text-left">{{ label }}</span>
            <span class="text-[11px] text-slate-300">{{ count }}</span>
          </button>
        </template>
      </nav>
      <div class="mb-1.5 mt-5 px-2.5 text-[11px] font-medium tracking-wider text-slate-400">工具</div>
      <nav class="space-y-0.5">
        <template :key="key" v-for="{ key, label, icon: Icon, count } in toolNav">
          <button
            @click="
              nav = key;
              selected = new Set();
            "
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                nav === key
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <component :is="Icon" class="h-4 w-4 shrink-0"></component>
            <span class="flex-1 text-left">{{ label }}</span>
            <span class="text-[11px] text-slate-300">{{ count }}</span>
          </button>
        </template>
      </nav>
    </div>
  </aside>
</template>
