import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Monitor, RefreshCw, Plus, ArrowRight, CircleCheck, ShieldAlert, Layers, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Modal from '@/components/Modal'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { synchronizeWindows, useWindowManager } from '@/hooks/useWindowManager'
import { roxyProjects } from '@/data/windowDemo'
import { platforms } from '@/data/mock'
import type { BrowserWindow } from '@/types/windows'
import RoxyBindingDialog from '@/components/windows/RoxyBindingDialog'
import WindowDetailDialog from '@/components/windows/WindowDetailDialog'
import { cn } from '@/lib/utils'

const selectClass =
  'h-9 max-w-52 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100'

export default function Accounts() {
  const manager = useWindowManager()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { bound, windows, accounts, syncedAt, storageUnavailable } = manager
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStart, setWizardStart] = useState<'key' | 'projects'>('key')
  const [resetOpen, setResetOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailWindowId, setDetailWindowId] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const platformCount = new Set(accounts.map((a) => a.platform)).size
  const expiredCount = accounts.filter((a) => a.status === '登录失效').length
  const syncTime = syncedAt ? new Date(syncedAt).toLocaleString('zh-CN', { hour12: false }) : ''

  const filtered = useMemo(
    () =>
      windows.filter((window) => {
        const linked = manager.windowAccounts(window.id)
        const query = search.trim().toLowerCase()
        return (
          (projectFilter === 'all' || window.roxyProjectId === projectFilter) &&
          (platformFilter === 'all' || linked.some((a) => a.platform === platformFilter)) &&
          (statusFilter === 'all' ||
            (statusFilter === 'expired'
              ? linked.some((a) => a.status === '登录失效')
              : statusFilter === 'empty'
                ? linked.length === 0
                : linked.length > 0 && linked.every((a) => a.status === '正常'))) &&
          (!query ||
            [window.name, window.serial, window.region, ...linked.map((a) => a.handle)].some((text) =>
              text.toLowerCase().includes(query),
            ))
        )
      }),
    [windows, manager, search, projectFilter, platformFilter, statusFilter],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const pagedWindows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function windowStatus(window: BrowserWindow) {
    const linked = manager.windowAccounts(window.id)
    return linked.length === 0
      ? '暂无登录账号'
      : linked.some((a) => a.status === '登录失效')
        ? '有账号登录失效'
        : '登录正常'
  }

  function collectionStatus(windowId: string) {
    const linked = manager.windowAccounts(windowId)
    if (!linked.length) return '无账号'
    const content = manager.videos.filter((v) => linked.some((a) => a.id === v.accountId))
    if (!content.length) return '暂无内容'
    if (content.some((v) => v.collection.kind === 'failed')) return '采集失败'
    if (content.some((v) => v.collection.kind === 'uncollected')) return '未采集'
    return '已有采集数据'
  }

  function bind(start: 'key' | 'projects') {
    setWizardStart(start)
    setWizardOpen(true)
  }

  function clear() {
    setSearch('')
    setProjectFilter('all')
    setPlatformFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  function report(id: string) {
    const account = manager.windowAccounts(id)[0]
    const params = new URLSearchParams({ tab: 'compare', window: id })
    const projectId = manager.projectForWindow(id)?.workspaceProjectId
    if (projectId) params.set('project', projectId)
    if (account?.platform) params.set('platform', account.platform)
    navigate(`/analytics?${params.toString()}`)
  }

  useEffect(() => {
    setPage(1)
  }, [search, projectFilter, platformFilter, statusFilter])

  useEffect(() => {
    clear()
  }, [manager.selectedProjectIds.join(',')])

  useEffect(() => {
    if (!bound) return
    const windowId = searchParams.get('window')
    const projectId = searchParams.get('project')
    if (windowId && windows.some((w) => w.id === windowId)) setDetailWindowId(windowId)
    if (projectId)
      setProjectFilter(roxyProjects.find((p) => p.workspaceProjectId === projectId)?.id ?? 'all')
  }, [searchParams, bound, windows])

  const stats = [
    {
      label: '已同步窗口',
      value: windows.length,
      hint: `${manager.selectedProjectIds.length} 个 RoxyBrowser 项目`,
      icon: Monitor,
      warn: false,
    },
    { label: '已识别账号', value: accounts.length, hint: '每个窗口每平台一个账号', icon: CircleCheck, warn: false },
    { label: '覆盖平台', value: platformCount, hint: '多平台统一管理', icon: Layers, warn: false },
    {
      label: '登录待恢复',
      value: expiredCount,
      hint: expiredCount ? '进入窗口详情恢复登录' : '所有已识别账号登录正常',
      icon: ShieldAlert,
      warn: Boolean(expiredCount),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="账号管理"
        desc="连接与同步浏览器窗口，管理账号身份、登录状态和采集入口"
        extra={
          <div className="flex shrink-0 self-start gap-2">
            {bound && (
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600" onClick={() => bind('projects')}>
                <RefreshCw className="h-3.5 w-3.5" />
                同步数据
              </Button>
            )}
            <Button size="sm" className="brand-gradient text-white hover:opacity-90" onClick={() => bind('key')}>
              <Plus className="h-4 w-4" />
              {bound ? '更换绑定' : '绑定 RoxyBrowser'}
            </Button>
          </div>
        }
      />
      {storageUnavailable && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
          浏览器暂时无法保存数据，本次操作仍然生效；刷新后可能需要重新演示。
        </p>
      )}
      {!bound ? (
        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-none">
          <div className="grid grid-cols-2 items-center gap-12 px-10 py-14">
            <div>
              <span className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-600">
                ROXYBROWSER × 出海动力
              </span>
              <h2 className="mt-5 text-3xl font-semibold leading-snug tracking-tight text-slate-800">
                一个窗口，
                <br />
                连接你的多平台矩阵
              </h2>
              <p className="mt-4 max-w-sm text-[13px] leading-7 text-slate-500">
                同步浏览器项目与窗口，识别平台账号并检查登录状态。内容表现统一在数据分析中查看。
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Button className="brand-gradient text-white" onClick={() => bind('key')}>
                  开始绑定与同步
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => synchronizeWindows(roxyProjects.map((p) => p.id))}
                >
                  一键同步演示数据
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">演示模式 · 无需真实 Key · 数据仅保存在当前浏览器</p>
            </div>
            <div className="relative rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-sky-100 pb-4">
                <span className="h-2 w-2 rounded-full bg-rose-200" />
                <span className="h-2 w-2 rounded-full bg-amber-200" />
                <span className="h-2 w-2 rounded-full bg-emerald-200" />
                <span className="ml-3 text-[11px] text-slate-400">RoxyBrowser 窗口</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md shadow-sky-200">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-slate-700">GlowUp · 品牌主窗口</p>
                  <p className="mt-1 text-[11px] text-slate-400">美区矩阵 · 独立浏览器环境</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {(['TikTok', 'Instagram', 'YouTube'] as const).map((p) => (
                  <div key={p} className="flex items-center rounded-xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                    <PlatformBadge platform={p} />
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-600">
                      <CircleCheck className="h-3 w-3" />
                      已识别账号
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-between border-t border-sky-100 pt-4 text-[11px] text-slate-400">
                <span>窗口 → 平台账号 → 视频</span>
                <span className="text-sky-600">统一数据视角</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/60 px-10 py-6">
            {[
              { title: '绑定浏览器', desc: '输入本地 API Key，建立演示连接' },
              { title: '选择同步项目', desc: '按项目选择需要管理的窗口' },
              { title: '检查账号状态', desc: '确认身份与登录，前往数据分析' },
            ].map((step, i) => (
              <div key={step.title} className="flex gap-3">
                <span className="text-lg font-light text-sky-300">0{i + 1}</span>
                <div>
                  <h3 className="text-[13px] font-medium text-slate-700">{step.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
              <CircleCheck className="h-4 w-4" />
            </div>
            <span className="font-medium text-slate-700">RoxyBrowser 已绑定</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">演示</span>
            <span className="ml-auto text-[11px] text-slate-400">最近同步 {syncTime}</span>
            <button className="text-sky-600 hover:text-sky-700" onClick={() => bind('projects')}>
              管理同步项目
            </button>
            <button className="border-l border-slate-200 pl-3 text-slate-400 hover:text-rose-500" onClick={() => setResetOpen(true)}>
              重置演示
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="gap-0 border-slate-200 bg-white p-5 py-5 shadow-none">
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  {stat.label}
                  <stat.icon className={`h-4 w-4 ${stat.warn ? 'text-amber-400' : 'text-sky-400'}`} />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-800">{stat.value}</p>
                <p className="mt-2 text-[11px] text-slate-400">{stat.hint}</p>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-52 flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="搜索窗口"
                placeholder="搜索窗口名称、编号或账号…"
                className="border-slate-200 bg-white pl-9 text-[12px]"
              />
            </div>
            <select value={projectFilter} aria-label="窗口项目" className={selectClass} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">全部项目</option>
              {roxyProjects
                .filter((p) => manager.selectedProjectIds.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select value={platformFilter} aria-label="窗口平台" className={selectClass} onChange={(e) => setPlatformFilter(e.target.value)}>
              <option value="all">全部平台</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select value={statusFilter} aria-label="窗口登录状态" className={selectClass} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">全部登录状态</option>
              <option value="normal">登录正常</option>
              <option value="expired">有账号登录失效</option>
              <option value="empty">暂无登录账号</option>
            </select>
            <button className="text-[12px] text-sky-600" onClick={clear}>
              清除筛选
            </button>
          </div>
          <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50/80 text-[11px] text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-normal">窗口 / 所属项目</th>
                    <th className="px-4 py-3 font-normal">已识别平台账号</th>
                    <th className="px-4 py-3 font-normal">地区</th>
                    <th className="px-4 py-3 font-normal">登录状态</th>
                    <th className="px-4 py-3 font-normal">采集状态</th>
                    <th className="px-5 py-3 text-right font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWindows.map((windowItem) => (
                    <tr key={windowItem.id} className="border-t border-slate-100 hover:bg-sky-50/30">
                      <td className="px-5 py-4">
                        <button
                          className="text-left font-medium text-slate-700 hover:text-sky-600"
                          onClick={() => setDetailWindowId(windowItem.id)}
                        >
                          {windowItem.name}
                        </button>
                        <p className="mt-1 text-[11px] text-slate-400">
                          #{windowItem.serial} · {manager.projectForWindow(windowItem.id)?.name}
                        </p>
                      </td>
                      <td className="max-w-64 px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {manager.windowAccounts(windowItem.id).map((a) => (
                            <span
                              key={a.id}
                              title={`${a.handle} · ${a.status}`}
                              className={cn(
                                'inline-flex items-center gap-1 rounded border px-1.5 py-1',
                                a.status === '正常' ? 'border-slate-100' : 'border-amber-200 bg-amber-50',
                              )}
                            >
                              <PlatformBadge platform={a.platform} />
                              {a.status === '登录失效' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                            </span>
                          ))}
                          {!manager.windowAccounts(windowItem.id).length && (
                            <span className="text-[11px] text-slate-400">暂无账号</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{windowItem.region}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-[10px]',
                            windowStatus(windowItem) === '登录正常'
                              ? 'bg-emerald-50 text-emerald-600'
                              : windowStatus(windowItem) === '暂无登录账号'
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-amber-50 text-amber-600',
                          )}
                        >
                          {windowStatus(windowItem)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[11px] text-slate-500">
                        {collectionStatus(windowItem.id)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button className="text-sky-600" onClick={() => setDetailWindowId(windowItem.id)}>
                          详情
                        </button>
                        <button className="ml-3 text-slate-500 hover:text-sky-600" onClick={() => report(windowItem.id)}>
                          查看数据
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[13px] text-slate-400">
                        没有符合条件的窗口，试试清除筛选
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
              <span>共 {filtered.length} 个窗口 · 平台标记提示账号登录状态</span>
              <div className="flex gap-3">
                <button disabled={currentPage <= 1} className="disabled:opacity-30" onClick={() => setPage((p) => p - 1)}>
                  上一页
                </button>
                <span>
                  {currentPage} / {pages}
                </span>
                <button disabled={currentPage >= pages} className="disabled:opacity-30" onClick={() => setPage((p) => p + 1)}>
                  下一页
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
      {wizardOpen && <RoxyBindingDialog open={wizardOpen} startAt={wizardStart} onOpenChange={setWizardOpen} />}
      <WindowDetailDialog windowId={detailWindowId} onWindowIdChange={setDetailWindowId} onReport={report} />
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} className="max-w-lg">
          <h2 className="text-lg font-semibold text-slate-900">重置窗口管理演示？</h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-500">
            将清除本地绑定、同步项目、登录恢复和运营阶段记录，返回首次绑定引导。你可以随时重新同步演示数据。
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={() => {
                manager.reset()
                setResetOpen(false)
                setDetailWindowId('')
                clear()
              }}
            >
              确认重置
            </Button>
          </div>
      </Modal>
    </div>
  )
}
