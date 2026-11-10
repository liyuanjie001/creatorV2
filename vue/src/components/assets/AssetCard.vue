<script setup lang="ts">
import { Eye, Download, Pencil, Check } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import AssetThumb from '@/components/assets/AssetThumb.vue';
import { useVideoPlayer } from '@/composables/useVideoPlayer';
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';

const { a, selected } = defineProps<{
  a: Asset;
  selected: boolean;
}>();
const emit = defineEmits<{ select: [] }>();
const { openAsset } = useVideoPlayer();
const { openFolder } = useAssetLibraryContext();

function openPreview() {
  if (a.type === '文件夹') {
    openFolder(a.id);
    return;
  }
  if (a.type !== '视频' && a.type !== '图片') {
    toast.info('该类型暂不支持预览（演示）');
    return;
  }
  openAsset(a, {
    primaryAction: {
      label: '用于创作',
      run: () => toast.success(`已准备引用「${a.name}」（演示）`),
    },
    secondaryAction: {
      label: '下载',
      run: () => toast.success('已开始下载（演示）'),
    },
  });
}

function onCardClick() {
  if (a.type === '文件夹') {
    openFolder(a.id);
    return;
  }
  if (a.type === '视频' || a.type === '图片') {
    openPreview();
    return;
  }
  emit('select');
}

const imageDims: Record<string, string> = {
  'M-10': '1000x1250',
  'M-04': '2400x2400',
  'M-14': '2400x1600',
};
function spec(asset: Asset) {
  if (asset.type === '文件夹') return `${asset.itemCount ?? 0} 项素材`;
  if (asset.duration) return `${asset.size} · ${asset.duration}`;
  if (asset.type === '图片') return `${asset.size} · ${imageDims[asset.id] ?? '4096x2400'}`;
  return `${asset.size} · —`;
}
</script>

<template>
  <div class="group cursor-pointer" @click="onCardClick">
    <div
      :class="
        cn(
          'relative aspect-[4/3] overflow-hidden rounded-xl border transition-all',
          selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-200',
        )
      "
    >
      <AssetThumb :a="a" />
      <div
        v-if="a.type !== '文件夹'"
        class="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <div class="absolute right-2 top-2 flex flex-col gap-1">
          <button
            title="预览"
            class="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:text-sky-600"
            @click.stop="openPreview"
          >
            <Eye class="h-3.5 w-3.5" />
          </button>
          <button
            title="下载"
            class="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:text-sky-600"
            @click.stop="toast.success('已开始下载（演示）')"
          >
            <Download class="h-3.5 w-3.5" />
          </button>
          <button
            title="重命名"
            class="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:text-sky-600"
            @click.stop="toast.info('重命名（演示）')"
          >
            <Pencil class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <button
        v-if="a.type !== '文件夹'"
        type="button"
        title="选择"
        :class="
          cn(
            'absolute left-2 flex h-4 w-4 items-center justify-center rounded-full border transition-all',
            a.enhanced ? 'top-8' : 'top-2',
            selected
              ? 'border-sky-500 bg-sky-500 text-white opacity-100'
              : 'border-white/80 bg-black/25 text-transparent opacity-0 group-hover:opacity-100',
          )
        "
        @click.stop="emit('select')"
      >
        <Check class="h-3 w-3" :strokeWidth="3" />
      </button>
    </div>
    <div class="mt-2 truncate text-[13px] font-medium text-slate-800" :title="a.name">{{ a.name }}</div>
    <div class="text-[11px] text-slate-400">{{ spec(a) }}</div>
    <div class="text-[11px] text-slate-400">
      {{ a.type === '文件夹' ? `更新 ${a.updatedAt}` : `上传 ${a.updatedAt}` }}
    </div>
  </div>
</template>
