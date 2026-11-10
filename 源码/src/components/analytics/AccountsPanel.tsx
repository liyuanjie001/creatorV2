import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PlatformBadge } from '@/components/shared'
import MetricValue from './MetricValue'
import StageSelect from './StageSelect'
import { useAnalyticsWorkspace } from '@/hooks/useAnalyticsWorkspace'
import { useAnalyticsStages } from '@/hooks/useAnalyticsStages'
import { available, growthMetric, summarizeVideos, unavailable } from '@/lib/analytics'
import { formatCount } from '@/lib/windowMetrics'
import { operationStages } from '@/types/windows'

export default function AccountsPanel() {
  const { accounts, manager, days, accountVideos, setAccountDetailId } = useAnalyticsWorkspace()
  const stages = useAnalyticsStages()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [page, setPage] = useState(1)

  const rows = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            (stage === 'all' || stages.stageFor(a.id) === stage) &&
            `${a.name} ${a.handle}`.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .map((account) => {
          const videos = accountVideos(account.id)
          const summary = summarizeVideos(videos, days)
          const values = videos
            .map((video) => summarizeVideos([video], days).metrics.views)
            .flatMap((value) => (value.kind === 'available' ? [value.value] : []))
            .sort((a, b) => a - b)
          const center = Math.floor(values.length / 2)
          const median = !summary.complete
            ? unavailable('历史不足', '样本中存在未完整采集的视频，暂不计算中位数')
            : !values.length
              ? unavailable('无可用样本', '账号暂无已发布视频')
              : available(
                  values.length % 2 ? values[center] : (values[center - 1] + values[center]) / 2,
                  `演示数据 · ${values.length} 条视频区间播放中位数`,
                )
          return { account, summary, median, growth: growthMetric(account) }
        }),
    [accounts, stage, search, stages, accountVideos, days],
  )

  const pages = Math.max(1, Math.ceil(rows.length / 8))
  const currentPage = Math.min(page, pages)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          aria-label="搜索分析账号"
          placeholder="搜索账号名称或用户名…"
          className="max-w-xs border-slate-200 bg-white text-[12px]"
        />
        <select
          value={stage}
          aria-label="筛选运营阶段"
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600"
          onChange={(event) => {
            setStage(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">全部运营阶段</option>
          {operationStages.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <span className="ml-auto text-[11px] text-slate-400">运营阶段为内部标签，与平台登录状态无关</span>
      </div>
      {stages.storageUnavailable && (
        <p role="status" className="text-[12px] text-amber-600">
          浏览器无法保存运营标签，本次会话仍可使用
        </p>
      )}
      <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[11px] text-slate-400">
              <tr>
                <th className="px-5 py-3 font-normal">账号 / 平台</th>
                <th className="px-3 py-3 font-normal">所属窗口</th>
                <th className="px-3 py-3 font-normal">运营阶段</th>
                <th className="px-3 py-3 text-right font-normal">当前粉丝</th>
                <th className="px-3 py-3 text-right font-normal">周涨粉</th>
                <th className="px-3 py-3 text-right font-normal">区间播放中位</th>
                <th className="px-3 py-3 font-normal">登录状态</th>
                <th className="px-5 py-3 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((currentPage - 1) * 8, currentPage * 8).map((row) => (
                <tr key={row.account.id} className="border-t border-slate-100 hover:bg-sky-50/30">
                  <td className="px-5 py-4">
                    <button
                      className="font-medium text-slate-700 hover:text-sky-600"
                      onClick={() => setAccountDetailId(row.account.id)}
                    >
                      {row.account.name}
                    </button>
                    <p className="mt-1 text-[10px] text-slate-400">{row.account.handle}</p>
                    <div className="mt-1.5">
                      <PlatformBadge platform={row.account.platform} />
                    </div>
                  </td>
                  <td className="max-w-40 px-3 py-4 text-[11px] leading-5 text-slate-500">
                    {manager.accountWindows(row.account.id).map((windowItem) => (
                      <div key={windowItem.id}>{windowItem.name}</div>
                    ))}
                    {manager.accountWindows(row.account.id).length > 1 && (
                      <span className="text-sky-600">共用账号 · 数据去重</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <StageSelect accountId={row.account.id} label={`${row.account.name} ${row.account.platform}`} />
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums text-slate-600">
                    {formatCount(row.account.followers)}
                  </td>
                  <td className="px-3 py-4 text-right text-slate-600">
                    <MetricValue datum={row.growth} />
                  </td>
                  <td className="px-3 py-4 text-right text-slate-600">
                    <MetricValue datum={row.median} />
                    <span className="mt-1 block text-[10px] text-slate-400">
                      近 {days} 天 · N={row.summary.total}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-4 text-[11px] ${row.account.status === '正常' ? 'text-emerald-600' : 'text-amber-600'}`}
                  >
                    {row.account.status}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="whitespace-nowrap text-sky-600" onClick={() => setAccountDetailId(row.account.id)}>
                      查看账号
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    没有符合条件的账号
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <span>共 {rows.length} 个去重账号</span>
          <div className="flex gap-3">
            <button disabled={currentPage <= 1} className="disabled:opacity-30" onClick={() => setPage((p) => p - 1)}>
              上一页
            </button>
            {currentPage} / {pages}
            <button disabled={currentPage >= pages} className="disabled:opacity-30" onClick={() => setPage((p) => p + 1)}>
              下一页
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
