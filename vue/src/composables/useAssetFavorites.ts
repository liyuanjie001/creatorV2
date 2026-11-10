import { computed } from 'vue';
import { inspirations, assets, type Asset, type Inspiration } from '@/data/mock';

import { studio } from '@/services/studio';
export function useAssetFavorites() {
  const extra = computed<Asset[]>(() => studio.value.favorites.map(id => ({ id: `FAV-${id}`, name: inspirations.find(i => i.id === id)?.title ?? studio.value.references.find(r => r.id === id)?.title ?? `收藏参考 ${id}`, type: '视频', size: '—', duration: '00:24', updatedAt: '已收藏', project: '爆款视频', day: '今天', favorite: true })));
  const allAssets = computed(() => [...extra.value, ...assets]);

  function addInspirationFavorite(item: Inspiration, projectName?: string) {
    if (!studio.value.favorites.includes(item.id)) studio.value.favorites.push(item.id);
    void projectName;
  }

  function removeInspirationFavorite(itemId: string) { studio.value.favorites = studio.value.favorites.filter(id => id !== itemId); }

  return {
    extraFavorites: extra,
    allAssets,
    addInspirationFavorite,
    removeInspirationFavorite,
  };
}
