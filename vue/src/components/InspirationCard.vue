<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Play, Star, Heart, MessageCircle, Share2 } from 'lucide-vue-next';
import { Thumb } from '@/components/shared';
import type { Inspiration } from '@/data/mock';
import { projects } from '@/data/mock';
import { toast } from 'vue-sonner';
import { useRemakeDraft } from '@/composables/useRemakeDraft';
import { useOptionalProjectWorkspace } from '@/composables/useProjectWorkspace';
import { useHomeProjects } from '@/composables/useHomeProjects';
import { useAssetFavorites } from '@/composables/useAssetFavorites';
import { useVideoPlayer } from '@/composables/useVideoPlayer';

const { item } = defineProps<{
  item: Inspiration;
}>();

const router = useRouter();
const workspace = useOptionalProjectWorkspace();
const { homeProjects } = useHomeProjects();
const { seedRemake } = useRemakeDraft();
const { addInspirationFavorite, removeInspirationFavorite } = useAssetFavorites();
const { openInspiration } = useVideoPlayer();

const favorited = ref(false);
const comments = computed(() => item.comments ?? `${Math.max(1, Math.round(item.heat / 10))}K`);
const shares = computed(() => item.shares ?? `${Math.max(1, Math.round(item.heat / 8))}K`);
const durationLabel = computed(() => {
  if (item.duration === '图文') return '时长 图文';
  const raw = item.duration.replace(/^00:/, '').replace(/^0/, '');
  return `时长 ${raw}`;
});

function remake() {
  seedRemake(item);
  if (workspace) {
    workspace.section.value = 'gen';
    toast.success('已跳转自由创作并填入翻拍脚本');
    return;
  }
  const target = homeProjects.value[0] ?? projects[0];
  if (!target) {
    toast.error('暂无可用项目');
    return;
  }
  router.push(`/projects/${target.id}`);
  toast.success('已跳转自由创作并填入翻拍脚本');
}

function favorite() {
  if (favorited.value) return;
  favorited.value = true;
  addInspirationFavorite(item, workspace?.project.value.name);
  toast.success('已收藏至素材库，点击查看', {
    action: {
      label: '查看',
      onClick: () => {
        void router.push('/assets');
      },
    },
  });
}

function toggleFavorite() {
  if (favorited.value) {
    favorited.value = false;
    removeInspirationFavorite(item.id);
    toast.success('已取消收藏');
    return;
  }
  favorite();
}

function openPlayer() {
  openInspiration(item, {
    primaryAction: { label: '一键翻拍', run: remake },
    secondaryAction: {
      label: favorited.value ? '已收藏' : '收藏',
      run: () => {
        if (!favorited.value) favorite();
      },
    },
  });
}
</script>

<template>
  <div class="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-sm">
    <div class="relative aspect-[3/4] cursor-pointer overflow-hidden" @click="openPlayer">
      <Thumb class="h-full w-full">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white/70 ring-1 ring-white/25 backdrop-blur-sm"
        >
          <Play class="h-3.5 w-3.5 translate-x-px" fill="currentColor" />
        </span>
      </Thumb>

      <button
        type="button"
        title="收藏"
        class="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-amber-500"
        :class="favorited && 'text-amber-500'"
        @click.stop="toggleFavorite"
      >
        <Star class="h-4 w-4" :fill="favorited ? 'currentColor' : 'none'" />
      </button>

      <div
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-16 text-white"
      >
        <div class="text-[14px] text-white/90">{{ durationLabel }}</div>
        <div class="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[14px] text-white/95">
          <span class="inline-flex items-center gap-1.5">
            <Play class="h-4 w-4 opacity-80" fill="currentColor" />
            <span class="opacity-75">播放</span>
            <span class="font-semibold tabular-nums">{{ item.views }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Heart class="h-4 w-4 opacity-80" />
            <span class="opacity-75">点赞</span>
            <span class="font-semibold tabular-nums">{{ item.likes }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <MessageCircle class="h-4 w-4 opacity-80" />
            <span class="opacity-75">评论</span>
            <span class="font-semibold tabular-nums">{{ comments }}</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Share2 class="h-4 w-4 opacity-80" />
            <span class="opacity-75">分享</span>
            <span class="font-semibold tabular-nums">{{ shares }}</span>
          </span>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-xl border border-white/25 bg-white/20 py-2.5 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
          @click.stop="remake"
        >
          一键翻拍
        </button>
      </div>
    </div>
  </div>
</template>
