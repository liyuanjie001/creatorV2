import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Modal from '@/components/Modal'
import { PlatformBadge } from '@/components/shared'
import DataChart from '@/components/DataChart'
import MetricCards from './MetricCards'
import MetricValue from './MetricValue'
import StageSelect from './StageSelect'
import { useAnalyticsWorkspace } from '@/hooks/useAnalyticsWorkspace'
import { available, growthMetric, summarizeVideos, unavailable, videoDiagnostics } from '@/lib/analytics'
import { formatCount, metricOptions, metricTrend } from '@/lib/windowMetrics'
import type { MetricKey } from '@/types/windows'

export default function AnalyticsDetails() {
  const { manager, accounts, days, accountDetailId, setAccountDetailId, videoDetailId, setVideoDetailId, manageAccount } =
    useAnalyticsWorkspace()
  const account = accounts.find((a) => a.id === accountDetailId)
  const video = manager.videos.find((v) => v.id === videoDetailId)
  const videoAccount = manager.accounts.find((a) => a.id === video?.accountId)
  const accountVideos = account ? manager.accountVideos(account.id) : []
  const accountSummary = summarizeVideos(accountVideos, days)
  const videoSummary = summarizeVideos(video ? [video] : [], days)
  const diagnostics = video && videoAccount ? videoDiagnostics(video, videoAccount) : undefined
  const [metric, setMetric] = useState<MetricKey>('views')
  const metricLabel = metricOptions.find((item) => item.key === metric)?.label ?? '播放量'
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBusy(false)
  }, [accountDetailId])

  useEffect(() => {
    if (videoDetailId) setAccountDetailId('')
  }, [videoDetailId, setAccountDetailId])

  function collect() {
    if (!account) return
    const id = account.id
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      if (manager.retryCollection(id)) toast.success('演示采集完成，已有历史范围之外的数据不会补造')
      else toast.warning('请先到窗口管理恢复登录')
    }, 1100)
  }

  const profileViews = useMemo(
    () =>
      !account
        ? unavailable('未采集', '未选择账号')
        : account.platform === 'TikTok' && accountSummary.complete && accountSummary.total > 0
          ? available(4100, '演示数据 · 平台主页访客示例，非官网进站')
          : unavailable('未采集', '尚无该账号可验证的主页访问数据'),
    [account, accountSummary.complete, accountSummary.total],
  )

  return (
    <>
      <Modal open={Boolean(account)} onClose={() => setAccountDetailId('')} className="max-w-4xl">
          <h2 className="text-lg font-semibold text-slate-800">{account?.name} · 账号详情</h2>
          <p className="text-[12px] text-slate-400">
            {account?.platform} · {account?.handle} · 平台账号 ID {account?.platformAccountId}
          </p>
          {account && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
                <PlatformBadge platform={account.platform} />
                <StageSelect accountId={account.id} label={`${account.name} ${account.platform}`} />
                <span className={`text-[12px] ${account.status === '正常' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  登录：{account.status}
                </span>
                <Button size="sm" variant="outline" className="ml-auto text-slate-500" onClick={() => manageAccount(account.id)}>
                  管理所属窗口
                </Button>
                <Button
                  size="sm"
                  className="brand-gradient text-white"
                  disabled={busy || account.status !== '正常'}
                  onClick={collect}
                >
                  {busy ? '正在采集…' : '重新采集（演示）'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[12px]">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-slate-400">当前粉丝</p>
                  <p className="mt-2 text-xl font-semibold text-slate-700">{formatCount(account.followers)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-slate-400">周涨粉</p>
                  <div className="mt-2 text-xl font-semibold text-slate-700">
                    <MetricValue datum={growthMetric(account)} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-slate-400">平台主页访客 · 近 7 天</p>
                  <div className="mt-2 text-xl font-semibold text-slate-700">
                    <MetricValue datum={profileViews} />
                  </div>
                </div>
              </div>
              <MetricCards
                metrics={accountSummary.metrics}
                caption={`近 ${days} 天 · 已覆盖 ${accountSummary.included}/${accountSummary.total} 条视频`}
              />
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-slate-700">账号内容趋势</h3>
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
              </div>
              {accountSummary.videos.length ? (
                <div className="h-48">
                  <DataChart
                    type="line"
                    data={metricTrend([{ name: metricLabel, videos: accountSummary.videos }], days, metric)}
                    series={[{ name: metricLabel, color: '#0ea5e9', type: 'area' }]}
                  />
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 py-8 text-center text-[12px] text-slate-400">暂无完整的区间趋势数据</p>
              )}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-[13px] font-medium text-slate-700">粉丝画像</h3>
                {account.platform === 'TikTok' && accountSummary.complete && accountSummary.total ? (
                  <p className="mt-3 text-[12px] leading-7 text-slate-500">
                    女性 67% · 男性 33%
                    <br />
                    18–24 岁 31% · 25–34 岁 42% · 35 岁及以上 27%
                    <br />
                    主要地域：美国 41% · 英国 22% · 其他 37%
                  </p>
                ) : (
                  <p className="mt-3 text-[12px] text-slate-400">— 未采集 · 当前没有可验证的粉丝画像数据</p>
                )}
                <p className="mt-2 text-[10px] text-slate-400">
                  后台能力示例 · 粉丝画像与单条视频观众画像分开统计，真实采集需逐平台验证
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-[13px] font-medium text-slate-700">账号视频 · {accountVideos.length} 条</h3>
                <div className="max-h-44 divide-y divide-slate-100 overflow-y-auto">
                  {accountVideos.map((item) => (
                    <button
                      key={item.id}
                      className="flex w-full items-center justify-between gap-4 py-3 text-left text-[12px] text-slate-600 hover:text-sky-600"
                      onClick={() => {
                        setAccountDetailId('')
                        setVideoDetailId(item.id)
                      }}
                    >
                      <span>{item.title}</span>
                      <span className="whitespace-nowrap text-[11px] text-slate-400">{item.publishedAt} →</span>
                    </button>
                  ))}
                  {!accountVideos.length && (
                    <p className="py-8 text-center text-[12px] text-slate-400">账号暂无已发布视频</p>
                  )}
                </div>
              </div>
            </>
          )}
      </Modal>
      <Modal open={Boolean(video)} onClose={() => setVideoDetailId('')} className="max-w-4xl">
          <h2 className="pr-5 text-lg font-semibold leading-7 text-slate-800">{video?.title}</h2>
          <p className="text-[12px] text-slate-400">
            {videoAccount?.platform} · {videoAccount?.handle} · {video?.publishedAt} 发布 · 时长 {video?.duration}
          </p>
          {video && videoAccount && diagnostics && (
            <>
              <div className="rounded-lg bg-sky-50 px-4 py-3 text-[12px] leading-6 text-sky-700">
                单条视频表现 · 近 {days} 天 · 演示数据。缺失指标显示原因，不根据播放量推断平台推荐状态。
              </div>
              <MetricCards metrics={videoSummary.metrics} caption={`近 ${days} 天增量`} />
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { label: '前 3 秒留存', value: diagnostics.retention, suffix: '%' },
                    { label: '完播率', value: diagnostics.completion, suffix: '%' },
                    { label: '平均观看时长', value: diagnostics.averageWatch, suffix: ' 秒' },
                    { label: '发布后 1 小时播放量', value: diagnostics.firstHour, suffix: '' },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[12px] text-slate-400">{item.label}</p>
                    <div className="mt-2 text-lg font-medium text-slate-700">
                      <MetricValue datum={item.value} suffix={item.suffix} />
                    </div>
                    {item.value.kind === 'unavailable' && (
                      <p className="mt-2 text-[11px] leading-5 text-slate-400">{item.value.detail}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {metricOptions.map((item) => (
                  <button
                    key={item.key}
                    className={`rounded px-3 py-1.5 text-[12px] ${metric === item.key ? 'bg-sky-50 text-sky-600' : 'text-slate-400'}`}
                    onClick={() => setMetric(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-slate-400">
                  {video.collection.kind === 'ready'
                    ? `最近采集 ${video.collection.collectedAt.slice(0, 16).replace('T', ' ')} UTC`
                    : '暂无有效采集时间'}
                </span>
              </div>
              {videoSummary.complete ? (
                <div className="h-52">
                  <DataChart
                    type="line"
                    data={metricTrend([{ name: metricLabel, videos: [video] }], days, metric)}
                    series={[{ name: metricLabel, color: '#0ea5e9', type: 'area' }]}
                  />
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 py-10 text-center text-[12px] text-slate-400">
                  数据不完整，暂不展示该范围的趋势
                </p>
              )}
            </>
          )}
      </Modal>
    </>
  )
}
