import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Globe2, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlatformBadge, HeatBar } from '@/components/shared'
import { trends, exposureTrend } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const regions = ['全球', '美国', '欧洲', '东南亚', '日本', '中东'] as const

export default function TrendsPanel() {
  const [region, setRegion] = useState<(typeof regions)[number]>('全球')

  return (
    <div className="space-y-4">
      {/* 地区切换 */}
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-slate-400" />
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
              region === r ? 'brand-gradient font-medium text-white' : 'border border-slate-200 text-slate-500 hover:text-slate-800'
            )}
          >
            {r}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-2 border-slate-200 text-slate-500 hover:text-slate-800"
          onClick={() => toast.success('已订阅趋势预警（演示）')}
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" /> 订阅趋势预警
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 热搜榜 */}
        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-slate-800">{region} · 实时热搜榜</h3>
            <span className="text-[11px] text-slate-400">每 15 分钟更新 · 数据来自各平台公开热榜</span>
          </div>
          <div className="space-y-2.5">
            {trends.map((t) => (
              <div key={t.rank} className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 transition-colors hover:border-sky-200">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                    t.rank <= 3 ? 'brand-gradient text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {t.rank}
                </span>
                <div className="w-52 shrink-0">
                  <div className="text-[13px] font-medium text-slate-800">{t.keyword}</div>
                  <div className="text-[11px] text-slate-400">{t.category} · {t.region}</div>
                </div>
                <div className="w-24 shrink-0"><PlatformBadge platform={t.platform} /></div>
                <div className="min-w-0 flex-1"><HeatBar value={t.heat} /></div>
                <span
                  className={cn(
                    'flex w-16 shrink-0 items-center justify-end gap-0.5 text-[12px] font-medium',
                    t.change >= 0 ? 'text-emerald-600' : 'text-rose-500'
                  )}
                >
                  {t.change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {Math.abs(t.change)}%
                </span>
                <Button
                  size="sm" variant="outline"
                  className="shrink-0 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                  onClick={() => toast.info('已创建跟进任务（演示）')}
                >
                  创作跟进
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* 右侧：关键词走势 + 话题云 */}
        <div className="space-y-4">
          <Card className="glass-card border-slate-200 p-5">
            <h3 className="text-[15px] font-medium text-slate-800">站内曝光热度走势</h3>
            <p className="mt-0.5 text-[12px] text-slate-400">可用于对比话题生命周期</p>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exposureTrend.slice(-14)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(100,116,139,0.12)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }} />
                  <Line type="monotone" dataKey="曝光" stroke="#f472b6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="glass-card border-slate-200 p-5">
            <h3 className="text-[15px] font-medium text-slate-800">上升话题词云</h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {['#CozyAutumn', 'GRWM', 'mini projector', 'AI voiceover', 'Black Friday', 'sourdough', 'VanLife', 'DeskSetup', 'ASMR unboxing', 'ootd'].map((w, i) => (
                <span
                  key={w}
                  className={cn(
                    'cursor-pointer rounded-full border px-2.5 py-1 transition-colors hover:border-sky-300 hover:text-sky-600',
                    i % 3 === 0 ? 'border-sky-200 text-sky-600 text-[13px]' :
                    i % 3 === 1 ? 'border-sky-100 text-sky-500 text-[12px]' :
                    'border-slate-200 text-slate-400 text-[11px]'
                  )}
                >
                  {w}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-[12px] leading-relaxed text-amber-700">
              ⏰ 预警：「Black Friday deals」预计 5 天后进入爆发期，黑五预热项目已生成 3 条内容建议。
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
