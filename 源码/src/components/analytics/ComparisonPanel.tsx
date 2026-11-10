import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Modal from '@/components/Modal'
import { PlatformBadge } from '@/components/shared'
import DataChart from '@/components/DataChart'
import MetricValue from './MetricValue'
import { useAnalyticsWorkspace, type CompareDimension } from '@/hooks/useAnalyticsWorkspace'
import { platforms, type Platform } from '@/data/mock'
import type { MetricKey, PublishedVideo } from '@/types/windows'
import { summarizeVideos, uniqueVideos } from '@/lib/analytics'
import { metricOptions, metricTrend } from '@/lib/windowMetrics'

const dimensionTabs: { key: CompareDimension; name: string }[] = [
  { key: 'window', name: '按窗口' },
  { key: 'account', name: '按账号' },
  { key: 'video', name: '按视频' },
  { key: 'platform', name: '按平台' },
]
const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b']

interface Row {
  id: string
  name: string
  caption: string
  videos: PublishedVideo[]
  platform?: Platform
}

export default function ComparisonPanel() {
  const scope = useAnalyticsWorkspace()
  const { compareDimension: dimension, setCompareDimension, days, platform, accounts, windows, videos, manager, project, windowId } =
    scope
  const [localPlatform, setLocalPlatform] = useState<Platform>('TikTok')
  const [metric, setMetric] = useState<MetricKey>('views')
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [page, setPage] = useState(1)
  const effectivePlatform = platform === 'all' ? localPlatform : platform

  const eligibleAccounts = useMemo(
    () => accounts.filter((a) => dimension === 'platform' || a.platform === effectivePlatform),
    [accounts, dimension, effectivePlatform],
  )

  const rows = useMemo(() => {
    const accountVideos = (ids: string[]) => videos.filter((v) => ids.includes(v.accountId))
    let items: Row[]
    if (dimension === 'platform')
      items = platforms.map((p) => ({
        id: p,
        name: p,
        platform: p,
        caption: `${accounts.filter((a) => a.platform === p).length} 个去重账号`,
        videos: accountVideos(accounts.filter((a) => a.platform === p).map((a) => a.id)),
      }))
    else if (dimension === 'window')
      items = windows
        .filter((w) =>
          manager.windowAccounts(w.id).some((a) => eligibleAccounts.some((candidate) => candidate.id === a.id)),
        )
        .map((w) => ({
          id: w.id,
          name: w.name,
          caption: `#${w.serial} · ${manager.projectForWindow(w.id)?.name ?? ''}`,
          videos: accountVideos(
            manager
              .windowAccounts(w.id)
              .filter((a) => a.platform === effectivePlatform)
              .map((a) => a.id),
          ),
        }))
    else if (dimension === 'account')
      items = eligibleAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        caption: a.handle,
        platform: a.platform,
        videos: accountVideos([a.id]),
      }))
    else
      items = videos
        .filter((v) => eligibleAccounts.some((a) => a.id === v.accountId))
        .map((v) => ({
          id: v.id,
          name: v.title,
          caption: v.publishedAt,
          platform: effectivePlatform,
          videos: [v],
        }))
    return items
      .map((item) => ({ ...item, summary: summarizeVideos(item.videos, days) }))
      .sort((a, b) => {
        const left = a.summary.metrics[metric]
        const right = b.summary.metrics[metric]
        return (right.kind === 'available' ? right.value : -1) - (left.kind === 'available' ? left.value : -1)
      })
  }, [dimension, accounts, windows, videos, manager, eligibleAccounts, effectivePlatform, days, metric])

  useEffect(() => {
    setSelected([])
    setPage(1)
    setComparisonOpen(false)
    setNotice('')
  }, [dimension, project, windowId, platform, effectivePlatform, days, videos])

  const pageCount = Math.max(1, Math.ceil(rows.length / 8))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice((currentPage - 1) * 8, currentPage * 8)
  const chosen = rows.filter((row) => selected.includes(row.id))
  const total = summarizeVideos(
    chosen.flatMap((row) => row.videos),
    days,
  )
  const hasOverlap =
    chosen.reduce((sum, row) => sum + row.videos.length, 0) >
    uniqueVideos(chosen.flatMap((row) => row.videos)).length
  const groups = chosen.map((row, i) => ({ name: `${i + 1}. ${row.name}`, videos: row.videos }))
  const series = groups.map((group, i) => ({ name: group.name, color: colors[i % colors.length], type: 'line' as const }))

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id))
      setNotice('')
      return
    }
    if (selected.length >= 4) {
      setNotice('最多选择 4 项进行对比，请先取消一项。')
      return
    }
    setSelected([...selected, id])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-slate-100/60 p-1">
          {dimensionTabs.map((item) => (
            <button
              key={item.key}
              aria-pressed={dimension === item.key}
              className={`rounded-md px-4 py-1.5 text-[12px] ${dimension === item.key ? 'bg-white font-medium text-sky-600 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setCompareDimension(item.key)}
            >
              {item.name}
            </button>
          ))}
        </div>
        {dimension !== 'platform' && platform === 'all' && (
          <label className="ml-auto flex items-center gap-2 text-[12px] text-slate-500">
            同平台对比
            <select
              value={localPlatform}
              aria-label="对比平台"
              className="h-8 rounded-md border border-slate-200 bg-white px-2"
              onChange={(event) => setLocalPlatform(event.target.value as Platform)}
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-[14px] font-medium text-slate-800">
              {dimension === 'platform'
                ? '平台整体表现'
                : `${effectivePlatform} · ${dimensionTabs.find((item) => item.key === dimension)?.name}对比`}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">选择 2～4 项 · 历史不完整或缺少数据的项目不参与对比</p>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-slate-400">已选 {selected.length} / 4</span>
            {selected.length > 0 && (
              <button
                className="text-slate-500"
                onClick={() => {
                  setSelected([])
                  setNotice('')
                }}
              >
                清空选择
              </button>
            )}
            <Button
              size="sm"
              className="brand-gradient text-white"
              disabled={selected.length < 2}
              onClick={() => setComparisonOpen(true)}
            >
              对比表现
            </Button>
          </div>
        </div>
        {notice && (
          <p role="alert" className="bg-amber-50 px-5 py-2 text-[12px] text-amber-700">
            {notice}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[11px] text-slate-400">
              <tr>
                <th className="w-10 p-4">
                  <span className="sr-only">选择对比项</span>
                </th>
                <th className="px-2 py-3 font-normal">对比项</th>
                <th className="px-3 py-3 text-right font-normal">视频数</th>
                {metricOptions.map((item) => (
                  <th key={item.key} className="px-4 py-3 text-right font-normal">
                    <button onClick={() => setMetric(item.key)}>
                      {item.label}
                      {metric === item.key ? ' ↓' : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-sky-50/30">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      disabled={!row.summary.complete || row.videos.length === 0}
                      aria-label={`对比 ${row.name}`}
                      className="h-3.5 w-3.5 accent-sky-500"
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td className="max-w-80 px-2 py-3">
                    <div className="flex items-center gap-2">
                      {row.platform && <PlatformBadge platform={row.platform} />}
                      {dimension !== 'platform' && (
                        <span className="truncate font-medium text-slate-700" title={row.name}>
                          {row.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{row.caption}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-500">{row.videos.length}</td>
                  {metricOptions.map((item) => (
                    <td key={item.key} className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                      <MetricValue datum={row.summary.metrics[item.key]} />
                    </td>
                  ))}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    暂无匹配数据，请调整筛选条件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <span>共 {rows.length} 项</span>
          <div className="flex gap-3">
            <button disabled={currentPage <= 1} className="disabled:opacity-30" onClick={() => setPage((p) => p - 1)}>
              上一页
            </button>
            {currentPage} / {pageCount}
            <button disabled={currentPage >= pageCount} className="disabled:opacity-30" onClick={() => setPage((p) => p + 1)}>
              下一页
            </button>
          </div>
        </div>
      </Card>
      <Modal open={comparisonOpen} onClose={() => setComparisonOpen(false)} className="max-w-4xl">
          <h2 className="text-lg font-semibold">
            {dimension === 'platform'
              ? '跨平台整体表现对比'
              : `${effectivePlatform} · ${dimension === 'window' ? '窗口' : dimension === 'account' ? '账号' : '视频'}表现对比`}
          </h2>
          <p className="text-[12px] text-slate-400">
            近 {days} 天 · 演示数据 · {chosen.length} 项。
            {dimension === 'platform' ? '播放采用各平台原始口径，不代表去重人数。' : '同一平台、同一时间范围。'}
          </p>
          <div className="flex gap-1">
            {metricOptions.map((item) => (
              <button
                key={item.key}
                className={`rounded px-3 py-1 text-[12px] ${metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'}`}
                onClick={() => setMetric(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="h-64">
            <DataChart type="line" data={metricTrend(groups, days, metric)} series={series} />
          </div>
          {hasOverlap && (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-700">
              这些窗口包含共用账号，各行可分别查看；下方合计按视频 ID 去重，不能直接相加。
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-3 font-normal">对比项</th>
                  {metricOptions.map((item) => (
                    <th key={item.key} className="px-3 py-3 text-right font-normal">
                      {item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chosen.map((row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="max-w-72 py-3 text-slate-700">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colors[index] }} />
                      {index + 1}. {row.name}
                    </td>
                    {metricOptions.map((item) => (
                      <td key={item.key} className="px-3 py-3 text-right text-slate-600">
                        <MetricValue datum={row.summary.metrics[item.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-sky-50/50 font-medium text-slate-700">
                <tr>
                  <td className="px-2 py-3">所选 {chosen.length} 项去重合计</td>
                  {metricOptions.map((item) => (
                    <td key={item.key} className="px-3 py-3 text-right">
                      <MetricValue datum={total.metrics[item.key]} />
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
      </Modal>
    </div>
  )
}
