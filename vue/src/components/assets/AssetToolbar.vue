<script setup lang="ts">
import { eventValue } from '@/lib/events';
import {
  Search,
  SlidersHorizontal,
  FolderPlus,
  UploadCloud,
  Trash2,
  LayoutGrid,
  List,
  Star,
  Wand2,
  Check,
  X,
} from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';

const { view, query, filterOpen, favOnly, selected, setNav } = useAssetLibraryContext();
</script>

<template>
  <div class="flex items-center justify-end gap-2">
    <template v-if="selected.size > 0">
      <span class="mr-auto flex items-center gap-2 rounded-full bg-sky-50 py-1 pl-3 pr-1.5 text-[12px] text-sky-600">
        已选 {{ selected.size }} 项
        <button class="rounded-full p-0.5 hover:bg-sky-100" @click="selected = new Set()">
          <X class="h-3 w-3" />
        </button>
      </span>
    </template>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        :value="query"
        @input="query = eventValue($event)"
        placeholder="搜索素材…"
        class="h-9 w-44 border-slate-200 bg-white pl-9 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
      />
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
        <SlidersHorizontal class="h-4 w-4" />
        筛选
      </Button>
      <div
        v-if="filterOpen"
        class="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60"
      >
        <button
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
          @click="favOnly = !favOnly"
        >
          <Star :class="cn('h-3.5 w-3.5', favOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-300')" />
          仅看收藏
          <Check v-if="favOnly" class="ml-auto h-3.5 w-3.5 text-sky-500" />
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-600 hover:bg-slate-50"
          @click="
            setNav('enhanced');
            filterOpen = false;
          "
        >
          <Wand2 class="h-3.5 w-3.5 text-slate-300" />
          仅看已增强
        </button>
      </div>
    </div>
    <Button
      variant="outline"
      size="sm"
      class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
      @click="toast.success('已创建文件夹（演示）')"
    >
      <FolderPlus class="h-4 w-4" />
      新建文件夹
    </Button>
    <Button
      size="sm"
      class="h-9 gap-2 brand-gradient px-4 text-white hover:opacity-90"
      @click="toast.success('上传功能为演示占位')"
    >
      <UploadCloud class="h-4 w-4" />
      上传文件
    </Button>
    <Button
      variant="outline"
      size="sm"
      class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
      @click="setNav('trash')"
    >
      <Trash2 class="h-4 w-4" />
      回收站
    </Button>
    <div class="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
      <button
        title="网格视图"
        :class="
          cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            view === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
          )
        "
        @click="view = 'grid'"
      >
        <LayoutGrid class="h-4 w-4" />
      </button>
      <button
        title="列表视图"
        :class="
          cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            view === 'list' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
          )
        "
        @click="view = 'list'"
      >
        <List class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
