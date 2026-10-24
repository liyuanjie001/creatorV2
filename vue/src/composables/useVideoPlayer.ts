import { computed, ref } from 'vue';
import type { Asset, Generation, Inspiration, Platform } from '@/types/domain';

export type VideoPlayerKind = 'inspiration' | 'generation' | 'asset' | 'generic';

export type VideoPlayerSource = {
  kind: VideoPlayerKind;
  id: string;
  title: string;
  duration?: string;
  platform?: Platform | string;
  author?: string;
  subtitle?: string;
  views?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  tags?: string[];
  status?: string;
  typeLabel?: string;
  size?: string;
  project?: string;
  updatedAt?: string;
  /** 弹窗内主操作，如「使用此素材」「一键翻拍」 */
  primaryAction?: { label: string; run: () => void };
  secondaryAction?: { label: string; run: () => void };
};

const GLOBAL_KEY = '__chuhai_video_player__';

type Store = {
  open: ReturnType<typeof ref<boolean>>;
  source: ReturnType<typeof ref<VideoPlayerSource | null>>;
};

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Store };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      open: ref(false),
      source: ref<VideoPlayerSource | null>(null),
    };
  }
  return g[GLOBAL_KEY];
}

const { open, source } = getStore();

function openVideo(next: VideoPlayerSource) {
  source.value = next;
  open.value = true;
}

function closeVideo() {
  open.value = false;
}

export function useVideoPlayer() {
  const title = computed(() => source.value?.title ?? '');
  return {
    open,
    source,
    title,
    openVideo,
    closeVideo,
    openInspiration(item: Inspiration, actions?: Partial<Pick<VideoPlayerSource, 'primaryAction' | 'secondaryAction'>>) {
      openVideo({
        kind: 'inspiration',
        id: item.id,
        title: item.title,
        duration: item.duration === '图文' ? undefined : item.duration,
        platform: item.platform,
        author: item.author,
        views: item.views,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
        tags: item.tags,
        typeLabel: item.duration === '图文' ? '图文' : '视频',
        ...actions,
      });
    },
    openGeneration(item: Generation, actions?: Partial<Pick<VideoPlayerSource, 'primaryAction' | 'secondaryAction'>>) {
      openVideo({
        kind: 'generation',
        id: item.id,
        title: item.title,
        duration: item.duration,
        platform: item.platform,
        status: item.status,
        typeLabel: item.type,
        subtitle: item.day,
        ...actions,
      });
    },
    openAsset(item: Asset, actions?: Partial<Pick<VideoPlayerSource, 'primaryAction' | 'secondaryAction'>>) {
      openVideo({
        kind: 'asset',
        id: item.id,
        title: item.name,
        duration: item.duration,
        typeLabel: item.type,
        size: item.size,
        project: item.project,
        updatedAt: item.updatedAt,
        ...actions,
      });
    },
  };
}
