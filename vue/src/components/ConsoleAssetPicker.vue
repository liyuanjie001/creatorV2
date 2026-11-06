<script setup lang="ts">
import { ChevronDown, ChevronRight, Folder, Search, Star, Upload } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { type Asset } from '@/data/mock';
import AssetThumb from '@/components/assets/AssetThumb.vue';
import { cn } from '@/lib/utils';
import { toast } from 'vue-sonner';
import { eventValue } from '@/lib/events';
import { useAssetFavorites } from '@/composables/useAssetFavorites';
import { saveMedia } from '@/services/media';
import { currentUser } from '@/services/identity';
import { uid } from '@/services/storage';

const { projectName } = defineProps<{
  projectName?: string;
}>();
const emit = defineEmits<{
  pick: [asset: Asset];
  upload: [asset: Asset, mediaId: string];
}>();

const { allAssets } = useAssetFavorites();
const query = ref('');
const searchOpen = ref(false);
const tree = ref<'all' | 'favorite'>('all');
const expanded = ref({ all: true, favorite: true });
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

/** 优先本项目素材；新建/自定义项目名对不上 mock 时回退全部，避免面板空白 */
const scoped = computed(() => {
  const pool = allAssets.value;
  if (!projectName) return pool;
  const matched = pool.filter((item) => item.project === projectName);
  return matched.length > 0 ? matched : pool;
});
const favorites = computed(() => scoped.value.filter((item) => item.favorite));
const library = computed(() => (tree.value === 'favorite' ? favorites.value : scoped.value));
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  const media = library.value.filter((item) => item.type === '视频' || item.type === '图片');
  if (!q) return media;
  return media.filter((item) => item.name.toLowerCase().includes(q));
});

function openAll() {
  tree.value = 'all';
  expanded.value = { ...expanded.value, all: true };
}
function openFavorite() {
  tree.value = 'favorite';
  expanded.value = { ...expanded.value, favorite: true };
}
function pick(asset: Asset) {
  emit('pick', asset);
}
function chooseLocal() {
  fileInput.value?.click();
}
async function addFiles(files: FileList | File[]) {
  const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
  if (!accepted.length) return;
  if (!currentUser.value) {
    toast.error('请先登录后再上传素材');
    return;
  }
  try {
    for (const file of accepted) {
      const mediaId = await saveMedia(currentUser.value.id, file);
      emit('upload', {
        id: uid(),
        name: file.name,
        type: file.type.startsWith('video/') ? '视频' : '图片',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        updatedAt: new Date().toISOString(),
        project: projectName ?? '当前项目',
        day: '今天',
      }, mediaId);
    }
    toast.success(`已上传 ${accepted.length} 个素材`);
  } catch (error) {
    toast.error((error as Error).message || '上传失败，请重试');
  }
}
function onFiles(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.length) return;
  void addFiles(input.files);
  input.value = '';
}
function onDrop(event: DragEvent) {
  event.preventDefault();
  dragging.value = false;
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  void addFiles(files);
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
    <div class="px-4 pb-1 pt-3 text-[12px] font-medium text-slate-500">本地上传</div>
    <div class="px-4">
      <button
        type="button"
        class="flex h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-[12.5px] transition-colors"
        :class="
          dragging
            ? 'border-sky-400 bg-sky-50 text-sky-600'
            : 'border-slate-200 bg-slate-50/60 text-slate-400 hover:border-sky-300 hover:text-sky-600'
        "
        @click="chooseLocal"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop="onDrop"
      >
        <Upload class="h-5 w-5" />
        上传媒体
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*,video/*"
        class="hidden"
        multiple
        @change="onFiles"
      />
    </div>
    <div class="mt-4 flex items-center justify-between px-4">
      <div class="text-[12px] font-medium text-slate-500">素材库上传</div>
      <button
        type="button"
        title="搜索"
        class="rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-sky-600"
        @click="searchOpen = !searchOpen"
      >
        <Search class="h-4 w-4" />
      </button>
    </div>
    <div v-if="searchOpen" class="px-4 pt-2">
      <input
        :value="query"
        placeholder="搜索素材"
        class="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12px] outline-none placeholder:text-slate-400 focus:border-sky-300"
        @input="query = eventValue($event)"
      />
    </div>
    <div class="mt-2 flex h-[220px] border-t border-slate-100">
      <div class="w-[200px] shrink-0 overflow-y-auto scroll-slim border-r border-slate-100 px-2 py-2">
        <button
          type="button"
          class="flex w-full items-center gap-1 rounded-lg px-1.5 py-1.5 text-[12.5px] text-slate-600 hover:bg-slate-50"
          @click="
            expanded.all = !expanded.all;
            openAll();
          "
        >
          <component :is="expanded.all ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 text-slate-400" />
          <Folder class="h-4 w-4 text-sky-500" />
          <span :class="cn('flex-1 text-left', tree === 'all' && 'font-medium text-sky-600')">全部素材</span>
        </button>
        <div v-if="expanded.all" class="ml-6 space-y-0.5">
          <button
            v-for="item in scoped.slice(0, 6)"
            :key="item.id"
            type="button"
            class="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            :title="item.name"
            @click="pick(item)"
          >
            {{ item.name.replace(/\.[^.]+$/, '') }}
          </button>
        </div>
        <button
          type="button"
          class="mt-1 flex w-full items-center gap-1 rounded-lg px-1.5 py-1.5 text-[12.5px] text-slate-600 hover:bg-slate-50"
          @click="
            expanded.favorite = !expanded.favorite;
            openFavorite();
          "
        >
          <component :is="expanded.favorite ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 text-slate-400" />
          <Star class="h-4 w-4 text-amber-500" />
          <span :class="cn('flex-1 text-left', tree === 'favorite' && 'font-medium text-sky-600')">收藏</span>
          <span class="text-[11px] text-amber-500">{{ favorites.length }}项</span>
        </button>
        <div v-if="expanded.favorite" class="ml-6 space-y-0.5">
          <button
            v-for="item in favorites"
            :key="item.id"
            type="button"
            class="block w-full truncate rounded-md px-1.5 py-1 text-left text-[11.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            :title="item.name"
            @click="pick(item)"
          >
            {{ item.name.replace(/\.[^.]+$/, '') }}
          </button>
        </div>
      </div>
      <div class="min-w-0 flex-1 overflow-y-auto scroll-slim p-2">
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="item in visible.slice(0, 8)"
            :key="item.id"
            type="button"
            class="group overflow-hidden rounded-lg border border-slate-200 text-left hover:border-sky-300"
            @click="pick(item)"
          >
            <div class="relative aspect-video">
              <AssetThumb :a="item" />
              <span
                class="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/90"
              >
                {{ item.type }}
              </span>
            </div>
            <div class="truncate px-1.5 py-1 text-[11px] text-slate-600" :title="item.name">
              {{ item.name.replace(/\.[^.]+$/, '') }}
            </div>
          </button>
        </div>
        <p v-if="visible.length === 0" class="py-10 text-center text-[12px] text-slate-400">没有匹配的素材</p>
      </div>
    </div>
  </div>
</template>
