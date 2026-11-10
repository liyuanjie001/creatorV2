<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { currentUser } from '@/services/identity';
import { getMedia } from '@/services/media';
import type { Film } from '@/types/studio';
const props = defineProps<{ film: Film | null }>();
const emit = defineEmits<{ close: [] }>();
const urls = ref<string[]>([]);
const error = ref('');
let revision = 0;
function clear() { urls.value.forEach(url => URL.revokeObjectURL(url)); urls.value = []; }
watch(() => props.film, async film => {
  const request = ++revision;
  clear(); error.value = '';
  if (!film || !currentUser.value) return;
  const owner = currentUser.value.id;
  try {
    const blobs = await Promise.all(film.mediaIds.map(id => getMedia(owner, id)));
    if (request !== revision) return;
    if (blobs.some(blob => !blob)) error.value = '部分本地媒体已丢失，请重新上传。';
    urls.value = blobs.filter((blob): blob is Blob => !!blob).map(blob => URL.createObjectURL(blob));
  } catch (cause) { if (request === revision) error.value = (cause as Error).message; }
}, { immediate: true });
onBeforeUnmount(() => { revision++; clear(); });
</script>
<template>
  <Dialog :open="!!film" @update:open="!$event && emit('close')">
    <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto bg-white p-6">
      <DialogTitle>{{ film?.title }}</DialogTitle>
      <DialogDescription>{{ film?.type }} · {{ film?.ratio }} · {{ film?.source }}</DialogDescription>
      <template v-if="film">
        <video v-if="film.type === '视频' && urls[0]" :src="urls[0]" controls class="max-h-[60vh] w-full rounded-xl bg-slate-950" />
        <div v-else-if="urls.length" class="flex snap-x gap-3 overflow-x-auto">
          <img v-for="url in urls" :key="url" :src="url" :alt="film.title" class="max-h-[60vh] w-full shrink-0 snap-center rounded-xl object-contain" />
        </div>
        <div v-else-if="film.type === '图文'" class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{{ error || '本地图片不可用，请重新上传后查看' }}</div>
        <div v-else class="thumb-gradient flex aspect-video items-center justify-center rounded-xl p-8 text-center text-sm leading-7 text-white">生成效果演示<br>真实视频生成服务接入后将在这里播放成片</div>
        <p v-if="error" role="alert" class="text-xs text-rose-500">{{ error }}</p>
        <p class="max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-500">{{ film.brief }}</p>
        <p v-if="film.reference" class="text-xs text-slate-400">参考来源：{{ film.reference.source }} · {{ film.reference.url || film.reference.title }}</p>
      </template>
    </DialogContent>
  </Dialog>
</template>
