import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared'
import { AnalyticsWorkspaceProvider, useAnalyticsWorkspace } from '@/hooks/useAnalyticsWorkspace'
import { platforms, type Platform } from '@/data/mock'
import { DEMO_TODAY, roxyProjects } from '@/data/windowDemo'
import type { ReportDays } from '@/types/windows'
import OverviewPanel from '@/components/analytics/OverviewPanel'
import AccountsPanel from '@/components/analytics/AccountsPanel'
import ContentPanel from '@/components/analytics/ContentPanel'
import ComparisonPanel from '@/components/analytics/ComparisonPanel'
import AnalyticsDetails from '@/components/analytics/AnalyticsDetails'
import { cn } from '@/lib/utils'

const ranges: ReportDays[] = [7, 30, 90]
const tabs = [
  { key: 'overview', label: '总览' },
  { key: 'accounts', label: '账号监测' },
  { key: 'content', label: '内容明细' },
  { key: 'compare', label: '对比分析' },
] as const
const selectClass =
  'h-8 rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-600 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100'

function AnalyticsPage() {
  const navigate = useNavigate()
  const {
    manager,
    tab,
    setTab,
    project,
    windowId,
    setWindowId,
    platform,
    setPlatform,
    days,
    setDays,
    projectWindows,
    summary,
    selectProject,
    clearFilters,
  } = useAnalyticsWorkspace()

  return (
    <div className="space-y-5">
      <PageHeader
        title="数据分析"
        desc="统一查看账号与内容表现，按窗口、账号、视频和平台分析对比"
        extra={
          <Button size="sm" variant="outline" className="border-slate-200 text-slate-600" onClick={() => navigate('/accounts')}>
            管理账号
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="rounded bg-sky-50 px-2 py-1 font-medium text-sky-600">演示数据</span>
          <span>统计截至 {DEMO_TODAY} · 来源和采集条件见指标提示</span>
        </div>
        <div className="flex gap-1">
          {ranges.map((range) => (
            <button
              key={range}
              aria-pressed={days === range}
              className={cn(
                'rounded-md px-3 py-1.5 text-[12px]',
                days === range ? 'brand-gradient text-white' : 'text-slate-500 hover:bg-slate-50',
              )}
              onClick={() => setDays(range)}
            >
              近 {range} 天
            </button>
          ))}
        </div>
      </div>
      {manager.bound ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[12px] text-slate-500">
            <label className="flex items-center gap-2">
              项目
              <select
                value={project}
                aria-label="分析项目"
                className={selectClass}
                onChange={(event) => selectProject(event.target.value)}
              >
                <option value="all">全部已同步项目</option>
                {roxyProjects
                  .filter((p) => manager.selectedProjectIds.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.workspaceProjectId}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              窗口
              <select
                value={windowId}
                aria-label="分析窗口"
                className={`${selectClass} max-w-56`}
                onChange={(event) => setWindowId(event.target.value)}
              >
                <option value="all">全部窗口</option>
                {projectWindows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              平台
              <select
                value={platform}
                aria-label="分析平台"
                className={selectClass}
                onChange={(event) => setPlatform(event.target.value as Platform | 'all')}
              >
                <option value="all">全部平台</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <button className="ml-auto text-sky-600" onClick={clearFilters}>
              清除筛选
            </button>
          </div>
          <div className="flex gap-6 border-b border-slate-200">
            {tabs.map((item) => (
              <button
                key={item.key}
                className={cn(
                  'border-b-2 px-1 pb-3 text-[13px] font-medium',
                  tab === item.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-700',
                )}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {!summary.complete && (
            <p role="status" className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] leading-6 text-amber-700">
              当前区间已覆盖 {summary.included}/{summary.total} 条视频。未采集、采集失败或历史不足的内容不计入数值，汇总显示覆盖范围。
            </p>
          )}
          {tab === 'overview' && <OverviewPanel />}
          {tab === 'accounts' && <AccountsPanel />}
          {tab === 'content' && <ContentPanel />}
          {tab === 'compare' && <ComparisonPanel />}
        </>
      ) : (
        <Card className="items-center gap-3 border-dashed border-slate-200 bg-white py-20 text-center shadow-none">
          <h2 className="text-lg font-medium text-slate-700">先同步窗口，再查看内容表现</h2>
          <p className="text-[13px] text-slate-400">在账号管理中绑定 RoxyBrowser，并选择要同步的项目。</p>
          <Button className="brand-gradient mt-2 text-white" onClick={() => navigate('/accounts')}>
            去同步窗口
          </Button>
        </Card>
      )}
      <AnalyticsDetails />
    </div>
  )
}

export default function Analytics() {
  return (
    <AnalyticsWorkspaceProvider>
      <AnalyticsPage />
    </AnalyticsWorkspaceProvider>
  )
}
