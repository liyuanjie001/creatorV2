import { computed, inject, provide, ref, watch, type InjectionKey } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';
import { platforms } from '@/data/mock';
import { roxyProjects } from '@/data/windowDemo';
import type { Platform } from '@/types/domain';
import type { ReportDays } from '@/types/windows';
import { summarizeVideos } from '@/lib/analytics';
import { useWindowManager } from './useWindowManager';

export type CompareDimension = 'window' | 'account' | 'video' | 'platform';
const tabs = ['overview', 'accounts', 'content', 'compare'] as const;
const querySchema = z.object({
  tab: z.enum(tabs).optional(),
  project: z.string().optional(),
  window: z.string().optional(),
  platform: z.enum(['all', ...platforms]).optional(),
  days: z.enum(['7', '30', '90']).optional(),
  account: z.string().optional(),
  dimension: z.enum(['window', 'account', 'video', 'platform']).optional(),
});
function createAnalyticsWorkspace() {
  const route = useRoute();
  const router = useRouter();
  const manager = useWindowManager();
  const tab = ref<(typeof tabs)[number]>('overview');
  const compareDimension = ref<CompareDimension>('window');
  const project = ref('all');
  const windowId = ref('all');
  const platform = ref<Platform | 'all'>('all');
  const days = ref<ReportDays>(7);
  const accountDetailId = ref('');
  const videoDetailId = ref('');
  const projectWindows = computed(() =>
    project.value === 'all' ? manager.windows.value : manager.windowsForProject(project.value),
  );
  const windows = computed(() =>
    projectWindows.value.filter((window) => windowId.value === 'all' || window.id === windowId.value),
  );
  const accounts = computed(() =>
    manager
      .accountsForWindows(windows.value.map((window) => window.id))
      .filter((account) => platform.value === 'all' || account.platform === platform.value),
  );
  const videos = computed(() =>
    manager.videos.value.filter((video) => accounts.value.some((account) => account.id === video.accountId)),
  );
  const summary = computed(() => summarizeVideos(videos.value, days.value));
  watch(
    () => route.query,
    (raw) => {
      const parsed = querySchema.safeParse(raw);
      if (!parsed.success) return;
      const query = parsed.data;
      tab.value = query.tab ?? 'overview';
      compareDimension.value = query.dimension ?? 'window';
      project.value = roxyProjects.some(
        (p) => p.workspaceProjectId === query.project && manager.selectedProjectIds.value.includes(p.id),
      )
        ? (query.project ?? 'all')
        : 'all';
      windowId.value = projectWindows.value.some((window) => window.id === query.window)
        ? (query.window ?? 'all')
        : 'all';
      platform.value = query.platform ?? 'all';
      days.value = query.days === '30' ? 30 : query.days === '90' ? 90 : 7;
      if (query.account && accounts.value.some((account) => account.id === query.account))
        accountDetailId.value = query.account;
    },
    { immediate: true },
  );
  watch([tab, project, windowId, platform], () => {
    accountDetailId.value = '';
    videoDetailId.value = '';
  });
  watch([tab, project, windowId, platform, days, compareDimension], () => {
    const query = {
      tab: tab.value,
      dimension: compareDimension.value === 'window' ? undefined : compareDimension.value,
      project: project.value === 'all' ? undefined : project.value,
      window: windowId.value === 'all' ? undefined : windowId.value,
      platform: platform.value === 'all' ? undefined : platform.value,
      days: days.value === 7 ? undefined : String(days.value),
    };
    void router.replace({ path: '/analytics', query });
  });
  watch(
    () => manager.selectedProjectIds.value.join(','),
    () => {
      project.value = 'all';
      windowId.value = 'all';
      accountDetailId.value = '';
      videoDetailId.value = '';
    },
  );
  function selectProject(id: string) {
    project.value = id;
    windowId.value = 'all';
  }
  function clearFilters() {
    project.value = 'all';
    windowId.value = 'all';
    platform.value = 'all';
  }
  function accountVideos(id: string) {
    return videos.value.filter((video) => video.accountId === id);
  }
  function manageAccount(id: string) {
    const window = manager.accountWindows(id)[0];
    void router.push({ path: '/accounts', query: window ? { window: window.id } : {} });
  }
  return {
    manager,
    tab,
    compareDimension,
    project,
    windowId,
    platform,
    days,
    accounts,
    windows,
    projectWindows,
    videos,
    summary,
    accountDetailId,
    videoDetailId,
    selectProject,
    clearFilters,
    accountVideos,
    manageAccount,
  };
}
type AnalyticsWorkspace = ReturnType<typeof createAnalyticsWorkspace>;
const key: InjectionKey<AnalyticsWorkspace> = Symbol('analytics-workspace');
export function useAnalyticsWorkspace() {
  const value = createAnalyticsWorkspace();
  provide(key, value);
  return value;
}
export function useAnalyticsContext() {
  const value = inject(key);
  if (!value) throw new Error('Analytics panels require an analytics workspace');
  return value;
}
