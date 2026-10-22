import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, CalendarRange } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { engagement7d, audienceAge, topPosts, platformColors } from '@/data/mock'
import { cn } from '@/lib/utils'

const ranges = ['近 7 天', '近 30 天', '近 90 天'] as const

export default function Analytics() {
  const [range, setRange] = useState<(typeof ranges)[number]>('近 7 天')

  return (
    <div className="space-y-6">
      <PageHeader
        title="数据分析"
        desc="跨平台内容表现透视：曝光、互动、转化与受众画像，一屏看清"
        extra={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12px] transition-colors',
                    range === r ? 'brand-gradient text-white' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <Download className="h-3.5 w-3.5" /> 导出报告
            </Button>
          </div>
        }
      />

      {/* 分平台互动 + 受众画像 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-slate-900">分平台互动量对比</h3>
            <span className="text-[11px] text-slate-400">单位：千次</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagement7d} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke="rgba(100,116,139,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(100,116,139,0.08)' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Bar dataKey="TikTok" fill={platformColors.TikTok} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                <Bar dataKey="Instagram" fill={platformColors.Instagram} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                <Bar dataKey="YouTube" fill={platformColors.YouTube} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-slate-200 p-5">
          <h3 className="text-[15px] font-medium text-slate-900">受众年龄分布</h3>
          <p className="mt-0.5 text-[12px] text-slate-400">全矩阵粉丝画像</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={audienceAge} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                  {audienceAge.map((_, i) => (
                    <Cell key={i} fill={['#8b5cf6', '#6366f1', '#22d3ee', '#f472b6', '#94a3b8'][i]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${v}%`, '占比']} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600">
            25-34 岁为核心受众（41%），与 GlowUp 目标客群高度重合；18-24 岁占比环比 +3pt。
          </div>
        </Card>
      </div>

      {/* 曝光趋势 + Top 内容 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <h3 className="mb-3 text-[15px] font-medium text-slate-900">曝光增长曲线</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagement7d} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(100,116,139,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="TikTok" stroke={platformColors.TikTok} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Instagram" stroke={platformColors.Instagram} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="YouTube" stroke={platformColors.YouTube} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-slate-900">Top 5 内容</h3>
            <CalendarRange className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {topPosts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold',
                  i < 3 ? 'brand-gradient text-white' : 'bg-slate-100 text-slate-400'
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-slate-700">{p.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                    <PlatformBadge platform={p.platform} />
                    <span>{p.views} 曝光</span>
                    <span>互动 {p.engagement}</span>
                    {p.roas && <span className="text-emerald-600">ROAS {p.roas}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
