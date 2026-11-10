<script setup lang="ts">
import { ChevronDown, ChevronRight, Folder, Star, Shapes } from 'lucide-vue-next';
import { assets, assetElements } from '@/data/mock';
import { cn } from '@/lib/utils';
import { computed, ref } from 'vue';
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';

const { nav, selected, query, setNav, clearFolder } = useAssetLibraryContext();
const expanded = ref({ all: true, favorite: true, element: false });
const favorites = computed(() => assets.filter((item) => item.favorite));
const rootFiles = computed(() => assets.filter((item) => item.type !== '文件夹'));

function openAll() {
  setNav('all');
  query.value = '';
}
function openFavorite() {
  setNav('favorite');
  query.value = '';
}
function openElement() {
  setNav('element');
  query.value = '';
}
function pickFile(name: string) {
  setNav('all');
  clearFolder();
  query.value = name;
  selected.value = new Set();
}
</script>

<template>
  <aside class="flex w-[240px] shrink-0 flex-col border-r border-slate-200/80 bg-white">
    <div class="flex-1 overflow-y-auto scroll-slim px-2 pb-4 pt-3">
      <button
        class="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50"
        @click="expanded.all = !expanded.all; openAll()"
      >
        <component :is="expanded.all ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 text-slate-400" />
        <Folder class="h-4 w-4 text-sky-500" />
        <span :class="cn('flex-1 text-left', nav === 'all' && 'font-medium text-sky-600')">全部素材</span>
      </button>
      <div v-if="expanded.all" class="ml-6 space-y-0.5">
        <button
          v-for="item in rootFiles"
          :key="item.id"
          class="block w-full truncate rounded-md px-2 py-1 text-left text-[12px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          :title="item.name"
          @click="pickFile(item.name)"
        >
          {{ item.name }}
        </button>
      </div>
      <button
        class="mt-1 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50"
        @click="expanded.favorite = !expanded.favorite; openFavorite()"
      >
        <component :is="expanded.favorite ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 text-slate-400" />
        <Star class="h-4 w-4 text-amber-500" />
        <span :class="cn('flex-1 text-left', nav === 'favorite' && 'font-medium text-sky-600')">收藏</span>
        <span class="text-[11px] text-amber-500">{{ favorites.length }}项</span>
      </button>
      <div v-if="expanded.favorite" class="ml-6 space-y-0.5">
        <button
          v-for="item in favorites"
          :key="item.id"
          class="block w-full truncate rounded-md px-2 py-1 text-left text-[12px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          :title="item.name"
          @click="pickFile(item.name)"
        >
          {{ item.name }}
        </button>
      </div>
      <button
        class="mt-1 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50"
        @click="openElement()"
      >
        <Shapes class="h-4 w-4 text-slate-400" />
        <span :class="cn('flex-1 text-left', nav === 'element' && 'font-medium text-sky-600')">元素</span>
        <span class="text-[11px] text-slate-300">{{ assetElements.length }}</span>
      </button>
    </div>
  </aside>
</template>
