import { computed, ref } from 'vue';
import { assets, type Asset, type Inspiration } from '@/data/mock';

const GLOBAL_KEY = '__chuhai_asset_favorites__';

type FavStore = {
  extra: ReturnType<typeof ref<Asset[]>>;
};

function getStore(): FavStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: FavStore };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { extra: ref<Asset[]>([]) };
  }
  return g[GLOBAL_KEY];
}

const { extra } = getStore();

export function useAssetFavorites() {
  const allAssets = computed(() => [...extra.value, ...assets]);

  function addInspirationFavorite(item: Inspiration, projectName?: string) {
    const id = `FAV-${item.id}`;
    if (extra.value.some((a) => a.id === id) || assets.some((a) => a.id === id && a.favorite)) {
      const existing = assets.find((a) => a.id === id || a.name.includes(item.title));
      if (existing && !existing.favorite) existing.favorite = true;
      return;
    }
    const asset: Asset = {
      id,
      name: item.duration === '图文' ? `${item.title}.png` : `${item.title}.mp4`,
      type: item.duration === '图文' ? '图片' : '视频',
      size: '—',
      duration: item.duration === '图文' ? undefined : item.duration,
      updatedAt: '刚刚',
      project: projectName || item.platform,
      day: '今天',
      favorite: true,
    };
    extra.value = [asset, ...extra.value.filter((a) => a.id !== id)];
  }

  function removeInspirationFavorite(itemId: string) {
    const id = `FAV-${itemId}`;
    extra.value = extra.value.filter((a) => a.id !== id);
  }

  return {
    extraFavorites: extra,
    allAssets,
    addInspirationFavorite,
    removeInspirationFavorite,
  };
}
