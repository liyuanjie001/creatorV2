import { assets, projects, type Asset, type AssetElement } from '@/data/mock';
import { ref, computed, provide, inject, type InjectionKey } from 'vue';
import { useRouter } from 'vue-router';
type NavKey = 'all' | 'project' | 'favorite' | 'element' | 'trash' | Asset['type'] | 'enhanced';

const dayOrder = ['今天', '昨天', '近7天'] as const;

function createAssetLibrary() {
  const router = useRouter();
  const nav = ref<NavKey>('all');
  const elemKind = ref<'全部' | AssetElement['kind']>('全部');
  const view = ref<'grid' | 'list'>('grid');
  const query = ref('');
  const filterOpen = ref(false);
  const favOnly = ref(false);
  const selected = ref<Set<string>>(new Set());
  const list = computed(() => {
    let l = assets;
    if (nav.value === 'favorite') l = l.filter((a) => a.favorite);
    else if (nav.value === '图片' || nav.value === '视频' || nav.value === '音频' || nav.value === '文案')
      l = l.filter((a) => a.type === nav.value);
    else if (nav.value === 'enhanced') l = l.filter((a) => a.enhanced);
    if (favOnly.value) l = l.filter((a) => a.favorite);
    if (query.value.trim())
      l = l.filter((a) => a.name.toLowerCase().includes(query.value.trim().toLowerCase()));
    return l;
  });
  const sections = computed(() => {
    if (nav.value === 'project') {
      return projects
        .map((p) => ({
          key: p.name,
          dot: p.color,
          items: list.value.filter((a) => a.project === p.name),
        }))
        .filter((s) => s.items.length > 0);
    }
    return dayOrder
      .map((d) => ({
        key: d,
        items: list.value.filter((a) => a.day === d),
      }))
      .filter((s) => s.items.length > 0);
  });
  const toggleSelect = (id: string) =>
    (selected.value = ((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    })(selected.value));
  const toggleSection = (ids: string[]) =>
    (selected.value = ((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allIn) next.delete(id);
        else next.add(id);
      });
      return next;
    })(selected.value));
  const showSections = computed(
    () => nav.value !== 'favorite' && nav.value !== 'element' && nav.value !== 'trash',
  );

  return {
    router,
    nav,
    elemKind,
    view,
    query,
    filterOpen,
    favOnly,
    selected,
    list,
    sections,
    toggleSelect,
    toggleSection,
    showSections,
  };
}
type AssetLibrary = ReturnType<typeof createAssetLibrary>;
const libraryKey: InjectionKey<AssetLibrary> = Symbol('asset-library');
export function useAssetLibrary() {
  const library = createAssetLibrary();
  provide(libraryKey, library);
  return library;
}
export function useAssetLibraryContext() {
  const library = inject(libraryKey);
  if (!library) throw new Error('Asset panels require an asset library');
  return library;
}
