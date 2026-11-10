import { useAnalyticsStages } from './useAnalyticsStages';
import { computed, ref } from 'vue';
import { z } from 'zod';
import {
  DEMO_TODAY,
  demoDate,
  demoAccounts,
  demoBindings,
  demoVideos,
  demoWindows,
  roxyProjects,
} from '@/data/windowDemo';
import type { PlatformAccount, PublishedVideo } from '@/types/windows';

export const WINDOW_STORAGE_KEY = 'chuhai-window-demo-v1';
const snapshotSchema = z.discriminatedUnion('kind', [
  z.object({ version: z.literal(1), kind: z.literal('unbound') }),
  z.object({
    version: z.literal(1),
    kind: z.literal('ready'),
    projectIds: z.array(z.string()).min(1),
    recoveredAccountIds: z.array(z.string()),
    collectedAccountIds: z.array(z.string()).default([]),
    syncedAt: z.iso.datetime(),
  }),
]);
type Snapshot = z.infer<typeof snapshotSchema>;
const initialSnapshot = (): Snapshot => ({ version: 1, kind: 'unbound' });

function readSnapshot(): Snapshot {
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(localStorage.getItem(WINDOW_STORAGE_KEY) ?? 'null'));
    if (!parsed.success) return initialSnapshot();
    const value = parsed.data;
    if (
      value.kind === 'ready' &&
      (!value.projectIds.every((id) => roxyProjects.some((p) => p.id === id)) ||
        !value.recoveredAccountIds.every((id) => demoAccounts.some((a) => a.id === id)) ||
        !value.collectedAccountIds.every((id) => demoAccounts.some((a) => a.id === id)))
    )
      return initialSnapshot();
    return value;
  } catch {
    return initialSnapshot();
  }
}

export function createWindowManager() {
  const snapshot = ref<Snapshot>(readSnapshot());
  const storageUnavailable = ref(false);
  const bound = computed(() => snapshot.value.kind === 'ready');
  const selectedProjectIds = computed(() =>
    snapshot.value.kind === 'ready' ? snapshot.value.projectIds : [],
  );
  const syncedAt = computed(() => (snapshot.value.kind === 'ready' ? snapshot.value.syncedAt : ''));
  const windows = computed(() =>
    demoWindows.filter((window) => selectedProjectIds.value.includes(window.roxyProjectId)),
  );
  const accounts = computed<PlatformAccount[]>(() => {
    const recovered = snapshot.value.kind === 'ready' ? snapshot.value.recoveredAccountIds : [];
    return demoAccounts
      .filter((account) =>
        demoBindings.some(
          (binding) =>
            binding.accountId === account.id &&
            windows.value.some((window) => window.id === binding.windowId),
        ),
      )
      .map((account) => ({
        ...account,
        status: recovered.includes(account.id) ? '正常' : account.status,
      }));
  });
  const videos = computed<PublishedVideo[]>(() => {
    const collected = snapshot.value.kind === 'ready' ? snapshot.value.collectedAccountIds : [];
    return demoVideos
      .filter((video) => accounts.value.some((account) => account.id === video.accountId))
      .map((video): PublishedVideo => {
        if (!collected.includes(video.accountId) || video.collection.kind === 'ready') return video;
        return {
          ...video,
          collection: {
            kind: 'ready',
            since: video.collection.kind === 'uncollected' ? DEMO_TODAY : demoDate(89),
            collectedAt: `${DEMO_TODAY}T10:00:00Z`,
          },
        };
      });
  });

  function save(value: Snapshot) {
    snapshot.value = value;
    try {
      localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(value));
      storageUnavailable.value = false;
    } catch {
      storageUnavailable.value = true;
    }
  }
  function synchronize(projectIds: string[], recoverAccountIds: string[] = []) {
    const unique = roxyProjects.filter((p) => projectIds.includes(p.id)).map((p) => p.id);
    if (unique.length === 0) return false;
    const recovered = snapshot.value.kind === 'ready' ? snapshot.value.recoveredAccountIds : [];
    save({
      version: 1,
      kind: 'ready',
      projectIds: unique,
      recoveredAccountIds: [
        ...new Set([
          ...recovered,
          ...recoverAccountIds.filter((id) => demoAccounts.some((a) => a.id === id)),
        ]),
      ],
      collectedAccountIds: snapshot.value.kind === 'ready' ? snapshot.value.collectedAccountIds : [],
      syncedAt: new Date().toISOString(),
    });
    return true;
  }
  function retryCollection(accountId: string) {
    const current = snapshot.value;
    if (current.kind !== 'ready' || !accounts.value.some((a) => a.id === accountId && a.status === '正常'))
      return false;
    save({
      ...current,
      collectedAccountIds: [...new Set([...current.collectedAccountIds, accountId])],
      syncedAt: new Date().toISOString(),
    });
    return true;
  }
  const windowAccounts = (windowId: string) =>
    accounts.value.filter((a) =>
      demoBindings.some((binding) => binding.windowId === windowId && binding.accountId === a.id),
    );
  const accountWindows = (accountId: string) =>
    windows.value.filter((window) =>
      demoBindings.some((binding) => binding.windowId === window.id && binding.accountId === accountId),
    );
  const accountsForWindows = (windowIds: string[]) =>
    accounts.value.filter((a) => accountWindows(a.id).some((w) => windowIds.includes(w.id)));
  const accountVideos = (accountId: string) => videos.value.filter((v) => v.accountId === accountId);
  const projectForWindow = (windowId: string) =>
    roxyProjects.find((p) => p.id === windows.value.find((w) => w.id === windowId)?.roxyProjectId);
  const windowsForProject = (projectId: string) =>
    windows.value.filter((w) =>
      roxyProjects.some((p) => p.id === w.roxyProjectId && p.workspaceProjectId === projectId),
    );
  function reset() {
    save(initialSnapshot());
    useAnalyticsStages().reset();
  }
  function reload() {
    snapshot.value = readSnapshot();
  }
  return {
    bound,
    selectedProjectIds,
    syncedAt,
    windows,
    accounts,
    videos,
    storageUnavailable,
    synchronize,
    retryCollection,
    reset,
    reload,
    windowAccounts,
    accountWindows,
    accountsForWindows,
    accountVideos,
    projectForWindow,
    windowsForProject,
  };
}

const manager = createWindowManager();
export function useWindowManager() {
  return manager;
}
