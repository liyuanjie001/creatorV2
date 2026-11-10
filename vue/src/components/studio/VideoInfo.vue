<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { studio } from '@/services/studio';
import { platformName } from '@/services/accounts';
import { currentUser } from '@/services/identity';
import { getMedia } from '@/services/media';
import type { VideoRow } from '@/services/videoManagement';
import { cover, dateTime, duration, scheduledDateTime, rowPlatforms } from '@/services/videoManagement';
import { Clock3, FileText } from 'lucide-vue-next';
defineEmits<{ open: []; rename: [value: string] }>();
const props = defineProps<{ row: VideoRow; published: boolean; rename: boolean; missing?: boolean }>();
const imageUrl = ref('');
const imageIds = computed(() => props.row.content?.imageMediaIds ?? props.row.task?.imageMediaIds ?? props.row.film?.mediaIds ?? []);
const isImageWork = computed(() => props.row.film?.type === '图文' || props.row.content?.type === '图文');
watch(() => imageIds.value[0], async id => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = '';
  if (!id || !currentUser.value) return;
  const blob = await getMedia(currentUser.value.id, id);
  if (blob) imageUrl.value = URL.createObjectURL(blob);
}, { immediate: true });
onBeforeUnmount(() => { if (imageUrl.value) URL.revokeObjectURL(imageUrl.value); });
</script>
<template>
  <div class="flex items-center gap-3">
    <button
      class="relative flex h-[72px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100"
      :aria-label="`查看 ${row.title}`"
      @click="$emit('open')"
    >
      <FileText v-if="row.film?.resultKind === 'script-breakdown'" class="h-7 w-7 text-sky-500" />
      <img
        v-else-if="!row.job && isImageWork && imageUrl"
        :src="imageUrl"
        alt="图文首图封面"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <img
        v-else-if="!row.job && !isImageWork && !missing"
        :src="cover(row.film?.id || row.content?.id || row.id)"
        alt="视频封面"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <span v-else class="px-1 text-center text-[10px] text-slate-500">{{ missing || (isImageWork && !imageUrl) ? '媒体丢失' : row.generation }}</span>
      <span
        v-if="!row.job && row.film?.type === '视频' && row.film.resultKind !== 'script-breakdown'"
        class="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-[9px] font-medium tabular-nums text-white"
      >
        {{ duration(row.film.duration) }}
      </span>
    </button>
    <div class="w-64 min-w-0">
      <input
        v-if="rename"
        :value="row.title"
        :title="row.title"
        :aria-label="`修改视频名称 ${row.title}`"
        class="h-8 w-full truncate rounded-md border border-transparent bg-transparent text-xs font-medium text-slate-800 outline-none hover:border-slate-200 hover:bg-slate-50 focus:border-sky-400 focus:bg-white"
        @change="$emit('rename', ($event.target as HTMLInputElement).value)"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
        @keydown.esc="
          ($event.target as HTMLInputElement).value = row.title;
          ($event.target as HTMLInputElement).blur();
        "
      />
      <button
        v-else
        class="line-clamp-2 text-left text-xs font-medium leading-5 text-slate-800 hover:text-sky-600"
        :title="row.title"
        @click="$emit('open')"
      >
        {{ row.title || '无发布文案' }}
      </button>
      <p
        v-if="row.task?.status === '已排期'"
        class="mt-1 inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-1 text-[10px] text-sky-600"
      >
        <Clock3 class="h-3 w-3 shrink-0" />
        {{ scheduledDateTime(row.task.scheduledAt,row.task.timeZone) }}
      </p>
      <p v-else class="mt-1 text-[10px] text-slate-400">{{ dateTime(row.date) }}</p>
      <p v-if="rowPlatforms(studio,row,!published).length" class="mt-1 text-[10px] text-sky-600">{{ rowPlatforms(studio,row,!published).map(p=>platformName(p)).join(' · ') }}</p><p v-if="isImageWork" class="mt-0.5 text-[10px] text-slate-400">{{ imageIds.length ? `${imageIds.length} 张图片` : '图文图片不可用' }}</p>
    </div>
  </div>
</template>
