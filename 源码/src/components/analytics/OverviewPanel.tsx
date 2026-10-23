import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlatformBadge } from '@/components/shared'
import DataChart from '@/components/DataChart'
import MetricCards from './MetricCards'
import MetricValue from './MetricValue'
import { useAnalyticsWorkspace } from '@/hooks/useAnalyticsWorkspace'
import { useAnalyticsStages } from '@/hooks/useAnalyticsStages'
import { summarizeVideos } from '@/lib/analytics'
import { metricOptions, metricTrend } from '@/lib/windowMetrics'
import { platforms } from '@/data/mock'
import type { MetricKey } from '@/types/windows'

export default function OverviewPanel() {
  const { accounts, windows, videos, days, summary, setTab, setCompareDimension, setAccountDetailId } =
    useAnalyticsWorkspace()
  const [metric, setMetric] = useState<MetricKey>('views')
  const label = metricOptions.find((item) => item.key === metric)?.label ?? '播放量'
  const stages = useAnalyticsStages()

  const platformRows = useMemo(
    () =>
      platforms
        .map((platform) => {
          const items = accounts.filter((a) => a.platform === platform)
          return {
            platform,
            accounts: items.length,
            summary: summarizeVideos(
              videos.filter((v) => items.some((a) => a.id === v.accountId)),
              days,
            ),
          }
        })
        .filter((row) => row.accounts > 0),
    [accounts, videos, days],
  )

  const reminders = useMemo(
    () =>
      accounts.flatMap((account) => {
        const items = videos.filter((v) => v.accountId === account.id)
        if (account.status === '登录失效')
          return [{ id: account.id, name: account.name, text: '登录失效，请先到窗口管理恢复登录' }]
        const missing = items.find((v) => v.collection.kind !== 'ready')
        if (missing)
          return [
            {
              id: account.id,
              name: account.name,
              text:
                missing.collection.kind === 'failed'
                  ? '内容采集失败，可在账号详情中重试'
                  : '首次识别内容，尚未采集表现数据',
            },
          ]
        if (!summarizeVideos(items, days).complete)
          return [{ id: account.id, name: account.name, text: '历史记录不足，当前区间仅有部分数据' }]
        return []
      }),
    [accounts, videos, days],
  )

  const stats = [
    { label: '当前管理账号', value: accounts.length, hint: '按平台账号 ID 去重' },
    { label: '关联窗口', value: windows.length, hint: '一个账号可关联多个窗口' },
    { label: '已识别视频', value: videos.length, hint: '当前管理范围的内容总数' },
    {
      label: '登录待恢复',
      value: accounts.filter((a) => a.status === '登录失效').length,
      hint: '与运营阶段独立统计',
    },
  ]

  return (
    <div className="space-y-5">
      <dl
        aria-label="当前分析范围概况"
        className="grid grid-cols-2 gap-y-3 rounded-xl border border-slate-200/80 bg-white/60 py-3 sm:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            title={stat.hint}
            className={`flex min-w-0 flex-wrap items-baseline gap-x-2 px-4 ${index ? 'sm:border-l sm:border-slate-200/80' : ''}`}
          >
            <dt className="text-[12px] text-slate-500">{stat.label}</dt>
            <dd className="text-lg font-semibold leading-6 tabular-nums text-slate-600">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <MetricCards metrics={summary.metrics} caption={`近 ${days} 天增量 · 演示数据`} />
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 gap-0 border-slate-200 bg-white p-5 py-5 shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-medium text-slate-800">内容表现趋势</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                统计已覆盖 {summary.included} / {summary.total} 条视频 · 缺少历史的内容未纳入
              </p>
            </div>
            <div className="flex gap-1">
              {metricOptions.map((item) => (
                <button
                  key={item.key}
                  className={`rounded px-3 py-1.5 text-[12px] ${metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'}`}
                  onClick={() => setMetric(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {summary.videos.length ? (
            <div className="h-60">
              <DataChart
                type="line"
                data={metricTrend([{ name: label, videos: summary.videos }], days, metric)}
                series={[{ name: label, color: '#0ea5e9', type: 'area' }]}
              />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-[13px] text-slate-400">
              暂无完整区间数据，调整筛选或采集范围后再查看
            </div>
          )}
        </Card>
        <Card className="gap-0 border-slate-200 bg-white p-5 py-5 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-slate-800">数据提醒</h3>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-600">{reminders.length}</span>
          </div>
          {reminders.length ? (
            <div className="mt-3 space-y-3">
              {reminders.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  className="w-full rounded-lg border border-slate-100 p-3 text-left hover:bg-sky-50/40"
                  onClick={() => setAccountDetailId(item.id)}
                >
                  <p className="text-[12px] font-medium text-slate-700">{item.name}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">{item.text}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-14 text-center text-[12px] text-slate-400">当前没有待处理的数据提醒</p>
          )}
        </Card>
      </div>
      <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[14px] font-medium text-slate-800">平台表现</h3>
            <p className="mt-1 text-[11px] text-slate-400">播放与曝光采用不同口径，此处仅汇总播放，不表示去重人数</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-sky-600"
            onClick={() => {
              setCompareDimension('platform')
              setTab('compare')
            }}
          >
            查看平台对比
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[11px] text-slate-400">
              <tr>
                <th className="px-5 py-3 font-normal">平台</th>
                <th className="px-4 py-3 text-right font-normal">账号数</th>
                <th className="px-4 py-3 text-right font-normal">视频数</th>
                {metricOptions.map((item) => (
                  <th key={item.key} className="px-5 py-3 text-right font-normal">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {platformRows.map((row) => (
                <tr key={row.platform} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <PlatformBadge platform={row.platform} />
                  </td>
                  <td className="px-4 py-4 text-right text-slate-500">{row.accounts}</td>
                  <td className="px-4 py-4 text-right text-slate-500">{row.summary.total}</td>
                  {metricOptions.map((item) => (
                    <td key={item.key} className="px-5 py-4 text-right text-slate-600">
                      <MetricValue datum={row.summary.metrics[item.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[11px] text-slate-400">
        运营阶段由团队手动维护：{accounts.filter((a) => stages.stageFor(a.id) === '测试期').length} 个测试期，
        {accounts.filter((a) => stages.stageFor(a.id) === '放量期').length} 个放量期。未分阶段的账号不会自动推断为测试期。
      </p>
    </div>
  )
}
