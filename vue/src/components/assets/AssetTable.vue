<script setup lang="ts">
import { Download, Check, Eye, Folder } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { useVideoPlayer } from '@/composables/useVideoPlayer';
import { useAssetLibraryContext } from '@/composables/useAssetLibrary';

const { list, selected } = defineProps<{
  list: Asset[];
  selected: Set<string>;
}>();
const emit = defineEmits<{ select: [id: string] }>();
const { openAsset } = useVideoPlayer();
const { openFolder } = useAssetLibraryContext();

function openPreview(a: Asset) {
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
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <table class="w-full text-left text-[12.5px]">
      <thead>
        <tr class="border-b border-slate-100 text-[11.5px] text-slate-400">
          <th class="w-10 px-4 py-2.5 font-normal"></th>
          <th class="px-2 py-2.5 font-normal">名称</th>
          <th class="w-20 px-2 py-2.5 font-normal">类型</th>
          <th class="w-44 px-2 py-2.5 font-normal">所属项目</th>
          <th class="w-20 px-2 py-2.5 font-normal">大小</th>
          <th class="w-28 px-2 py-2.5 font-normal">更新时间</th>
          <th class="w-24 px-4 py-2.5 text-right font-normal">操作</th>
        </tr>
      </thead>
      <tbody>
        <template :key="a.id" v-for="a in list">
          <tr class="border-b border-slate-50 transition-colors last:border-0 hover:bg-sky-50/40">
            <td class="px-4 py-2.5">
              <button
                @click="emit('select', a.id)"
                :class="
                  cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    selected.has(a.id)
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-300 bg-white text-transparent',
                  )
                "
              >
                <Check class="h-3 w-3" :strokeWidth="3"></Check>
              </button>
            </td>
            <td class="max-w-72 truncate px-2 py-2.5 font-medium text-slate-700">
              <button
                type="button"
                class="inline-flex max-w-full items-center gap-1.5 truncate text-left hover:text-sky-600"
                :title="a.name"
                @click="openPreview(a)"
              >
                <Folder v-if="a.type === '文件夹'" class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span class="truncate">{{ a.name }}</span>
              </button>
            </td>
            <td class="px-2 py-2.5 text-slate-500">{{ a.type }}</td>
            <td class="truncate px-2 py-2.5 text-slate-500">{{ a.project }}</td>
            <td class="px-2 py-2.5 text-slate-500">
              {{ a.type === '文件夹' ? `${a.itemCount ?? 0} 项` : a.size }}
            </td>
            <td class="px-2 py-2.5 text-slate-400">{{ a.updatedAt }}</td>
            <td class="px-4 py-2.5 text-right">
              <button
                type="button"
                class="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600"
                title="预览"
                @click="openPreview(a)"
              >
                <Eye class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600"
                title="下载"
                @click="toast.success('已开始下载（演示）')"
              >
                <Download class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
