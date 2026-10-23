import { useMemo, useSyncExternalStore } from 'react'
import { z } from 'zod'
import {
  DEMO_TODAY,
  demoAccounts,
  demoBindings,
  demoDate,
  demoVideos,
  demoWindows,
  roxyProjects,
} from '@/data/windowDemo'
import type { PlatformAccount, PublishedVideo } from '@/types/windows'
import { resetAnalyticsStages } from './useAnalyticsStages'

export const WINDOW_STORAGE_KEY = 'chuhai-window-demo-v1'

const snapshotSchema = z.discriminatedUnion('kind', [
  z.object({ version: z.literal(1), kind: z.literal('unbound') }),
  z.object({
    version: z.literal(1),
    kind: z.literal('ready'),
    projectIds: z.array(z.string()).min(1),
    recoveredAccountIds: z.array(z.string()),
    collectedAccountIds: z.array(z.string()).default([]),
    syncedAt: z.string(),
  }),
])

type Snapshot = z.infer<typeof snapshotSchema>
const initialSnapshot = (): Snapshot => ({ version: 1, kind: 'unbound' })

function readSnapshot(): Snapshot {
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(localStorage.getItem(WINDOW_STORAGE_KEY) ?? 'null'))
    if (!parsed.success) return initialSnapshot()
    const value = parsed.data
    if (
      value.kind === 'ready' &&
      (!value.projectIds.every((id) => roxyProjects.some((p) => p.id === id)) ||
        !value.recoveredAccountIds.every((id) => demoAccounts.some((a) => a.id === id)) ||
        !value.collectedAccountIds.every((id) => demoAccounts.some((a) => a.id === id)))
    )
      return initialSnapshot()
    return value
  } catch {
    return initialSnapshot()
  }
}

let snapshot = readSnapshot()
let storageUnavailable = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return snapshot
}

function save(value: Snapshot) {
  snapshot = value
  try {
    localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(value))
    storageUnavailable = false
  } catch {
    storageUnavailable = true
  }
  emit()
}

function derive(current: Snapshot) {
  const selectedProjectIds = current.kind === 'ready' ? current.projectIds : []
  const windows = demoWindows.filter((window) => selectedProjectIds.includes(window.roxyProjectId))
  const recovered = current.kind === 'ready' ? current.recoveredAccountIds : []
  const accounts: PlatformAccount[] = demoAccounts
    .filter((account) =>
      demoBindings.some(
        (binding) =>
          binding.accountId === account.id && windows.some((window) => window.id === binding.windowId),
      ),
    )
    .map((account) => ({
      ...account,
      status: recovered.includes(account.id) ? '正常' : account.status,
    }))
  const collected = current.kind === 'ready' ? current.collectedAccountIds : []
  const videos: PublishedVideo[] = demoVideos
    .filter((video) => accounts.some((account) => account.id === video.accountId))
    .map((video): PublishedVideo => {
      if (!collected.includes(video.accountId) || video.collection.kind === 'ready') return video
      return {
        ...video,
        collection: {
          kind: 'ready',
          since: video.collection.kind === 'uncollected' ? DEMO_TODAY : demoDate(89),
          collectedAt: `${DEMO_TODAY}T10:00:00Z`,
        },
      }
    })
  return {
    bound: current.kind === 'ready',
    selectedProjectIds,
    syncedAt: current.kind === 'ready' ? current.syncedAt : '',
    windows,
    accounts,
    videos,
  }
}

export function synchronizeWindows(projectIds: string[], recoverAccountIds: string[] = []) {
  const unique = roxyProjects.filter((p) => projectIds.includes(p.id)).map((p) => p.id)
  if (unique.length === 0) return false
  const recovered = snapshot.kind === 'ready' ? snapshot.recoveredAccountIds : []
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
    collectedAccountIds: snapshot.kind === 'ready' ? snapshot.collectedAccountIds : [],
    syncedAt: new Date().toISOString(),
  })
  return true
}

export function retryCollection(accountId: string) {
  const derived = derive(snapshot)
  if (snapshot.kind !== 'ready' || !derived.accounts.some((a) => a.id === accountId && a.status === '正常'))
    return false
  save({
    ...snapshot,
    collectedAccountIds: [...new Set([...snapshot.collectedAccountIds, accountId])],
    syncedAt: new Date().toISOString(),
  })
  return true
}

export function resetWindowDemo() {
  save(initialSnapshot())
  resetAnalyticsStages()
}

export function useWindowManager() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return useMemo(() => {
    const derived = derive(current)
    const windowAccounts = (windowId: string) =>
      derived.accounts.filter((a) =>
        demoBindings.some((binding) => binding.windowId === windowId && binding.accountId === a.id),
      )
    const accountWindows = (accountId: string) =>
      derived.windows.filter((window) =>
        demoBindings.some((binding) => binding.windowId === window.id && binding.accountId === accountId),
      )
    return {
      ...derived,
      storageUnavailable,
      synchronize: synchronizeWindows,
      retryCollection,
      reset: resetWindowDemo,
      windowAccounts,
      accountWindows,
      accountsForWindows: (windowIds: string[]) =>
        derived.accounts.filter((a) => accountWindows(a.id).some((w) => windowIds.includes(w.id))),
      accountVideos: (accountId: string) => derived.videos.filter((v) => v.accountId === accountId),
      projectForWindow: (windowId: string) =>
        roxyProjects.find((p) => p.id === derived.windows.find((w) => w.id === windowId)?.roxyProjectId),
      windowsForProject: (projectId: string) =>
        derived.windows.filter((w) =>
          roxyProjects.some((p) => p.id === w.roxyProjectId && p.workspaceProjectId === projectId),
        ),
    }
  }, [current])
}

export type WindowManager = ReturnType<typeof useWindowManager>
