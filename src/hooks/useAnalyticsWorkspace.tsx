import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { platforms, type Platform } from '@/data/mock'
import { roxyProjects } from '@/data/windowDemo'
import { summarizeVideos } from '@/lib/analytics'
import type { ReportDays } from '@/types/windows'
import { useWindowManager, type WindowManager } from './useWindowManager'

export type CompareDimension = 'window' | 'account' | 'video' | 'platform'
export const analyticsTabs = ['overview', 'accounts', 'content', 'compare'] as const
export type AnalyticsTab = (typeof analyticsTabs)[number]

const querySchema = z.object({
  tab: z.enum(analyticsTabs).optional(),
  project: z.string().optional(),
  window: z.string().optional(),
  platform: z.enum(['all', ...platforms]).optional(),
  days: z.enum(['7', '30', '90']).optional(),
  account: z.string().optional(),
  dimension: z.enum(['window', 'account', 'video', 'platform']).optional(),
})

export interface AnalyticsWorkspace {
  manager: WindowManager
  tab: AnalyticsTab
  setTab: (tab: AnalyticsTab) => void
  compareDimension: CompareDimension
  setCompareDimension: (dimension: CompareDimension) => void
  project: string
  windowId: string
  setWindowId: (id: string) => void
  platform: Platform | 'all'
  setPlatform: (platform: Platform | 'all') => void
  days: ReportDays
  setDays: (days: ReportDays) => void
  accounts: WindowManager['accounts']
  windows: WindowManager['windows']
  projectWindows: WindowManager['windows']
  videos: WindowManager['videos']
  summary: ReturnType<typeof summarizeVideos>
  accountDetailId: string
  setAccountDetailId: (id: string) => void
  videoDetailId: string
  setVideoDetailId: (id: string) => void
  selectProject: (id: string) => void
  clearFilters: () => void
  accountVideos: (id: string) => WindowManager['videos']
  manageAccount: (id: string) => void
}

const AnalyticsContext = createContext<AnalyticsWorkspace | null>(null)

export function AnalyticsWorkspaceProvider({ children }: { children: ReactNode }) {
  const manager = useWindowManager()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
  const query = parsed.success ? parsed.data : {}

  const [tab, setTab] = useState<AnalyticsTab>(query.tab ?? 'overview')
  const [compareDimension, setCompareDimension] = useState<CompareDimension>(query.dimension ?? 'window')
  const [project, setProject] = useState('all')
  const [windowId, setWindowId] = useState('all')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [days, setDays] = useState<ReportDays>(7)
  const [accountDetailId, setAccountDetailId] = useState('')
  const [videoDetailId, setVideoDetailId] = useState('')

  const projectWindows = useMemo(
    () => (project === 'all' ? manager.windows : manager.windowsForProject(project)),
    [manager, project],
  )
  const windows = useMemo(
    () => projectWindows.filter((window) => windowId === 'all' || window.id === windowId),
    [projectWindows, windowId],
  )
  const accounts = useMemo(
    () =>
      manager
        .accountsForWindows(windows.map((window) => window.id))
        .filter((account) => platform === 'all' || account.platform === platform),
    [manager, windows, platform],
  )
  const videos = useMemo(
    () => manager.videos.filter((video) => accounts.some((account) => account.id === video.accountId)),
    [manager.videos, accounts],
  )
  const summary = useMemo(() => summarizeVideos(videos, days), [videos, days])

  useEffect(() => {
    setTab(query.tab ?? 'overview')
    setCompareDimension(query.dimension ?? 'window')
    const nextProject = roxyProjects.some(
      (p) => p.workspaceProjectId === query.project && manager.selectedProjectIds.includes(p.id),
    )
      ? (query.project ?? 'all')
      : 'all'
    setProject(nextProject)
    const nextWindows =
      nextProject === 'all' ? manager.windows : manager.windowsForProject(nextProject)
    setWindowId(nextWindows.some((window) => window.id === query.window) ? (query.window ?? 'all') : 'all')
    setPlatform(query.platform ?? 'all')
    setDays(query.days === '30' ? 30 : query.days === '90' ? 90 : 7)
    if (query.account) setAccountDetailId(query.account)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, manager.selectedProjectIds.join(',')])

  useEffect(() => {
    setAccountDetailId('')
    setVideoDetailId('')
  }, [tab, project, windowId, platform])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (compareDimension !== 'window') params.set('dimension', compareDimension)
    if (project !== 'all') params.set('project', project)
    if (windowId !== 'all') params.set('window', windowId)
    if (platform !== 'all') params.set('platform', platform)
    if (days !== 7) params.set('days', String(days))
    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) navigate({ pathname: '/analytics', search: next ? `?${next}` : '' }, { replace: true })
  }, [tab, project, windowId, platform, days, compareDimension, navigate, searchParams])

  const previousProjectIds = useRef<string | null>(null)
  useEffect(() => {
    const ids = manager.selectedProjectIds.join(',')
    if (previousProjectIds.current === null) {
      previousProjectIds.current = ids
      return
    }
    if (previousProjectIds.current === ids) return
    previousProjectIds.current = ids
    setProject('all')
    setWindowId('all')
    setAccountDetailId('')
    setVideoDetailId('')
  }, [manager.selectedProjectIds])

  const selectProject = useCallback((id: string) => {
    setProject(id)
    setWindowId('all')
  }, [])

  const clearFilters = useCallback(() => {
    setProject('all')
    setWindowId('all')
    setPlatform('all')
  }, [])

  const accountVideos = useCallback(
    (id: string) => videos.filter((video) => video.accountId === id),
    [videos],
  )

  const manageAccount = useCallback(
    (id: string) => {
      const window = manager.accountWindows(id)[0]
      navigate(window ? `/accounts?window=${encodeURIComponent(window.id)}` : '/accounts')
    },
    [manager, navigate],
  )

  const value: AnalyticsWorkspace = {
    manager,
    tab,
    setTab,
    compareDimension,
    setCompareDimension,
    project,
    windowId,
    setWindowId,
    platform,
    setPlatform,
    days,
    setDays,
    accounts,
    windows,
    projectWindows,
    videos,
    summary,
    accountDetailId,
    setAccountDetailId,
    videoDetailId,
    setVideoDetailId,
    selectProject,
    clearFilters,
    accountVideos,
    manageAccount,
  }

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalyticsWorkspace() {
  const value = useContext(AnalyticsContext)
  if (!value) throw new Error('Analytics panels require an analytics workspace')
  return value
}
