import { studio } from '@/services/studio';
import { useWindowManager } from '@/composables/useWindowManager';
import { useDemoTimers } from '@/composables/useDemoTimers';
import type { ConsoleDraft } from '@/types/domain';
import {
  projects as originalProjects,
  generations,
  tasks,
  inspirations,
  type Generation,
  type Platform,
  type Product,
} from '@/data/mock';
import { toast } from 'vue-sonner';
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, watch } from 'vue';
import { provide, inject, type InjectionKey } from 'vue';
type SectionKey =
  | 'gen'
  | 'brief'
  | 'product'
  | 'inspire'
  | 'element'
  | 'canvas'
  | 'chat'
  | 'director'
  | 'account'
  | 'publish'
  | 'attribution'
  | 'schedule'
  | 'trash';
const dayOrder = ['今天', '昨天', '近7天'] as const;
function createProjectWorkspace() {
  const { repeat, cancelRepeat } = useDemoTimers();
  const route = useRoute();
  const id = computed(() => String(route.params.id ?? ''));
  const router = useRouter();
  const project = computed(() => ({ ...((route.path.startsWith('/legacy/') ? originalProjects.find(p=>p.id===id.value) : studio.value.projects.find(p => p.id === id.value)) ?? { id: id.value, name: '项目不存在', desc: '', color: '#11a3fd', accountIds: [], archived: false }), platforms: ['TikTok'] as Platform[], status: '进行中', owner: '我', start: '', end: '' }));
  const section = computed<SectionKey>({ get: () => String(route.query.section ?? 'gen') as SectionKey, set: value => { void router.replace({ query: { ...route.query, section: value } }); } });
  const extraProducts = ref<Product[]>([]);
  const projectProducts = computed(() => [
    ...extraProducts.value.filter((p) => p.projectId === project.value.id),
    ...studio.value.products.filter((p) => p.projectId === project.value.id),
  ]);
  const selProductId = ref(projectProducts.value[0]?.id ?? '');
  const view = ref<'grid' | 'list'>('grid');
  const generating = ref(false);
  const extraGens = ref<Generation[]>([]);
  const batchOpen = ref(false);
  const batchRunning = ref(false);
  const batchProgress = ref(0);
  const batchDone = ref<number | null>(null);
  const batchCount = ref(10);
  const batchPlatforms = ref<Platform[]>(project.value.platforms);
  const batchThemes = ref<string[]>(['商品种草']);
  const related = computed(() => [
    ...extraGens.value,
    ...generations.filter((g) => g.projectId === project.value.id),
  ]);
  const sections = computed(() =>
    dayOrder
      .map((d) => ({
        day: d,
        items: related.value.filter((g) => g.day === d),
      }))
      .filter((s) => s.items.length > 0),
  );
  const windowManager = useWindowManager();
  const projectWindows = computed(() => windowManager.windowsForProject(project.value.id));
  const projectTasks = computed(() => tasks.filter((t) => t.project === project.value.name));
  const recs = computed(() =>
    (() => {
      const matched = inspirations.filter((i) => project.value.platforms.includes(i.platform));
      const rest = inspirations
        .filter((i) => !project.value.platforms.includes(i.platform))
        .sort((a, b) => b.heat - a.heat);
      return [...matched, ...rest].slice(0, 6);
    })(),
  );
  const handleDone = (items: ConsoleDraft[]) => {
    extraGens.value = [
      ...items.map((d, i) => ({
        id: `N-${Date.now()}-${i}`,
        projectId: project.value.id,
        title: d.title,
        type: '视频' as const,
        duration: '00:15',
        platform: d.platform,
        day: '今天' as const,
        status: '草稿' as const,
      })),
      ...extraGens.value,
    ];
    generating.value = false;
    section.value = 'gen';
    toast.success(`已生成 ${items.length} 条内容到本项目`);
  };
  const batchThemeDefs = [
    {
      key: '商品种草',
      suffix: '种草短片',
    },
    {
      key: '场景展示',
      suffix: '场景展示',
    },
    {
      key: '促销转化',
      suffix: '促销切片',
    },
    {
      key: '用户证言',
      suffix: 'UGC 证言',
    },
  ];
  const batchStages = ['撰写脚本', '生成画面', '渲染视频', '生成封面'];
  const runBatch = () => {
    if (batchRunning.value) return;
    if (batchPlatforms.value.length === 0) {
      toast.warning('至少选择一个平台');
      return;
    }
    batchRunning.value = true;
    batchProgress.value = 0;
    batchDone.value = null;
    let p = 0;
    const timer = repeat(() => {
      p += 4 + Math.floor(Math.random() * 7);
      if (p >= 100) {
        cancelRepeat(timer);
        batchProgress.value = 100;
        const pool =
          projectProducts.value.length > 0
            ? projectProducts.value
            : [
                {
                  name: project.value.name,
                },
              ];
        const themes = batchThemeDefs.filter((t) => batchThemes.value.includes(t.key));
        const useThemes = themes.length > 0 ? themes : batchThemeDefs;
        const items: Generation[] = Array.from(
          {
            length: batchCount.value,
          },
          (_, i) => {
            const prod = pool[i % pool.length];
            const th = useThemes[i % useThemes.length];
            const isImage = i % 4 === 3;
            return {
              id: `B-${Date.now()}-${i}`,
              projectId: project.value.id,
              title: `${prod.name} · ${th.suffix} #${i + 1}`,
              type: isImage ? ('图片' as const) : ('视频' as const),
              duration: isImage ? undefined : `00:${String(15 + ((i * 7) % 40)).padStart(2, '0')}`,
              platform: batchPlatforms.value[i % batchPlatforms.value.length],
              day: '今天' as const,
              status: '草稿' as const,
            };
          },
        );
        extraGens.value = [...items, ...extraGens.value];
        batchRunning.value = false;
        batchDone.value = batchCount.value;
        toast.success(`批量生成完成，${batchCount.value} 条内容已加入「全部生成」`);
      } else {
        batchProgress.value = p;
      }
    }, 160);
  };
  watch(id, () => {
    extraGens.value = [];
    generating.value = false;
    selProductId.value = projectProducts.value[0]?.id ?? '';
    batchOpen.value = false;
    batchDone.value = null;
    batchProgress.value = 0;
  });
  const selectedProduct = computed(() => projectProducts.value.find((p) => p.id === selProductId.value));
  const addProduct = (item: Product) => {
    studio.value.products.unshift(item);
    selProductId.value = item.id;
  };
  return {
    route,
    id,
    router,
    project,
    section,
    projectProducts,
    selProductId,
    view,
    generating,
    extraGens,
    batchOpen,
    batchRunning,
    batchProgress,
    batchDone,
    batchCount,
    batchPlatforms,
    batchThemes,
    related,
    sections,
    projectWindows,
    projectTasks,
    recs,
    handleDone,
    batchThemeDefs,
    batchStages,
    runBatch,
    selectedProduct,
    extraProducts,
    addProduct,
  };
}
type ProjectWorkspace = ReturnType<typeof createProjectWorkspace>;
const workspaceKey: InjectionKey<ProjectWorkspace> = Symbol('project-workspace');
export function useProjectWorkspace() {
  const workspace = createProjectWorkspace();
  provide(workspaceKey, workspace);
  return workspace;
}
export function useProjectWorkspaceContext() {
  const workspace = inject(workspaceKey);
  if (!workspace) throw new Error('Project panels require a project workspace');
  return workspace;
}
export function useOptionalProjectWorkspace() {
  return inject(workspaceKey, null);
}
