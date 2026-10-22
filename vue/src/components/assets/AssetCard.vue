<script setup lang="ts">
import { Heart, Download, Copy, Maximize2, MoreHorizontal, Check } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import AssetThumb from '@/components/assets/AssetThumb.vue';
import { computed, ref } from 'vue';
const { a, selected } = defineProps<{
  a: Asset;
  selected: boolean;
}>();
const emit = defineEmits<{ select: [] }>();
const fav = ref(!!a.favorite);
const actions = computed(() => [
  {
    icon: Heart,
    label: '收藏',
    onClick: () => {
      fav.value = !fav.value;
      toast.success(fav.value ? '已收藏' : '已取消收藏');
    },
  },
  {
    icon: Download,
    label: '下载',
    onClick: () => toast.success('已开始下载（演示）'),
  },
  {
    icon: Copy,
    label: '创建副本',
    onClick: () => toast.success('已创建副本（演示）'),
  },
  {
    icon: Maximize2,
    label: '预览',
    onClick: () => toast.info('打开预览（演示）'),
  },
]);
</script>

<template>
  <div
    :class="
      cn(
        'group relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all',
        selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-transparent hover:border-sky-200',
      )
    "
    @click="emit('select')"
  >
    <AssetThumb :a="a"></AssetThumb>
    <div class="absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
      <div class="absolute right-1.5 top-1.5 flex flex-col gap-1">
        <template :key="label" v-for="{ icon: Icon, label, onClick } in actions">
          <button
            :title="label"
            @click="
              $event.stopPropagation();
              onClick();
            "
            class="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-sky-600"
          >
            <component
              :is="Icon"
              :class="cn('h-3.5 w-3.5', label === '收藏' && fav && 'fill-rose-500 text-rose-500')"
            ></component>
          </button>
        </template>
      </div>
      <button
        title="更多"
        @click="
          $event.stopPropagation();
          toast.info('更多操作（演示）');
        "
        class="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-sky-600"
      >
        <MoreHorizontal class="h-3.5 w-3.5"></MoreHorizontal>
      </button>
      <div class="absolute bottom-1.5 left-1.5 right-9 truncate text-[10.5px] text-white/90">
        {{ a.name }}
      </div>
    </div>
    <span
      :class="
        cn(
          'absolute left-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition-all',
          a.enhanced ? 'top-7' : 'top-1.5',
          selected
            ? 'border-sky-500 bg-sky-500 text-white opacity-100'
            : 'border-white/80 bg-black/25 text-transparent opacity-0 group-hover:opacity-100',
        )
      "
    >
      <Check class="h-3 w-3" :strokeWidth="3"></Check>
    </span>
  </div>
</template>
