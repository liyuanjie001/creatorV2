import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PlatformBadge } from '@/components/shared'
import MetricValue from './MetricValue'
import { useAnalyticsWorkspace } from '@/hooks/useAnalyticsWorkspace'
import { summarizeVideos, videoDiagnostics } from '@/lib/analytics'
import { metricOptions } from '@/lib/windowMetrics'

export default function ContentPanel() {
  const { videos, accounts, days, setVideoDetailId } = useAnalyticsWorkspace()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')

  const rows = useMemo(
    () =>
      videos
        .map((video) => ({
          video,
          account: accounts.find((a) => a.id === video.accountId),
          summary: summarizeVideos([video], days),
        }))
        .filter(
          (row) =>
            `${row.video.title} ${row.account?.handle ?? ''}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()) &&
            (status === 'all' || (status === 'ready' ? row.summary.complete : !row.summary.complete)),
        ),
    [videos, accounts, days, search, status],
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
          aria-label="搜索分析视频"
          placeholder="搜索视频标题或账号…"
          className="max-w-sm border-slate-200 bg-white text-[12px]"
        />
        <select
          value={status}
          aria-label="筛选视频数据"
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] text-slate-600"
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">全部采集状态</option>
          <option value="ready">区间数据完整</option>
          <option value="missing">数据待补齐</option>
        </select>
        <span className="ml-auto text-[11px] text-slate-400">当前区间表现，不代表推荐状态</span>
      </div>
      <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[11px] text-slate-400">
              <tr>
                <th className="px-5 py-3 font-normal">视频 / 所属账号</th>
                {metricOptions.map((item) => (
                  <th key={item.key} className="px-3 py-3 text-right font-normal">
                    {item.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-normal">完播率</th>
                <th className="px-3 py-3 font-normal">发布时间</th>
                <th className="px-5 py-3 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((currentPage - 1) * 8, currentPage * 8).map((row) => (
                <tr key={row.video.id} className="border-t border-slate-100 hover:bg-sky-50/30">
                  <td className="max-w-80 px-5 py-4">
                    <button
                      className="block max-w-full truncate text-left font-medium text-slate-700 hover:text-sky-600"
                      title={row.video.title}
                      onClick={() => setVideoDetailId(row.video.id)}
                    >
                      {row.video.title}
                    </button>
                    <div className="mt-1.5 flex items-center gap-2">
                      {row.account && <PlatformBadge platform={row.account.platform} />}
                      <span className="text-[10px] text-slate-400">{row.account?.handle}</span>
                    </div>
                  </td>
                  {metricOptions.map((item) => (
                    <td key={item.key} className="whitespace-nowrap px-3 py-4 text-right text-slate-600">
                      <MetricValue datum={row.summary.metrics[item.key]} />
                    </td>
                  ))}
                  <td className="px-3 py-4 text-right text-slate-600">
                    {row.account && (
                      <MetricValue datum={videoDiagnostics(row.video, row.account).completion} suffix="%" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-[11px] text-slate-400">{row.video.publishedAt}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="whitespace-nowrap text-sky-600" onClick={() => setVideoDetailId(row.video.id)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    没有符合条件的视频
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <span>共 {rows.length} 条视频 · 播放按视频 ID 去重</span>
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
