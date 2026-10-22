import { Link } from 'react-router'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Sparkles, ArrowRight, Clock, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, PlatformBadge, Thumb, Delta, HeatBar } from '@/components/shared'
import {
  kpis, exposureTrend, platformShare, tasks, aiSuggestions, inspirations, platformColors, type Platform,
} from '@/data/mock'
import { cn } from '@/lib/utils'

const statusColor: Record<string, string> = {
  待发布: 'bg-sky-400/10 text-sky-600 border-sky-400/20',
  发布中: 'bg-sky-50 text-sky-600 border-sky-200',
  已完成: 'bg-emerald-400/10 text-emerald-600 border-emerald-400/20',
  已失败: 'bg-rose-400/10 text-rose-600 border-rose-400/20',
}

export default function Dashboard() {
  const running = tasks.filter((t) => t.status === '发布中' || t.status === '待发布').slice(0, 4)
  const hot = inspirations.slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        desc="下午好，林悦 👋 矩阵今日运行正常，4 个任务正在分发中"
        extra={
          <Link to="/projects/new" className="flex items-center gap-2 rounded-lg brand-gradient px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" /> 新建项目
          </Link>
        }
      />

      {/* KPI 卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="glass-card border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">{k.label}</span>
              <Delta value={k.delta} up={k.up} />
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{k.value}</div>
            <div className="mt-1.5 text-[11px] text-slate-400">{k.hint}</div>
          </Card>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-medium text-slate-900">近 30 天曝光与互动趋势</h3>
              <p className="mt-0.5 text-[12px] text-slate-400">全矩阵 · 6 个平台汇总（单位：千次）</p>
            </div>
            <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-600">
              曝光 ↑ 34.2%
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={exposureTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(100,116,139,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Area type="monotone" dataKey="曝光" stroke="#8b5cf6" strokeWidth={2} fill="url(#gExp)" />
                <Area type="monotone" dataKey="互动" stroke="#22d3ee" strokeWidth={2} fill="url(#gEng)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-slate-200 p-5">
          <h3 className="text-[15px] font-medium text-slate-900">平台发布占比</h3>
          <p className="mt-0.5 text-[12px] text-slate-400">近 30 天内容分发结构</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformShare} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                  {platformShare.map((p) => (
                    <Cell key={p.name} fill={platformColors[p.name as Platform]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, '占比']}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI 洞察 + 任务 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card relative overflow-hidden border-sky-200 p-5">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-50 blur-3xl" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <h3 className="text-[15px] font-medium text-slate-900">AI 运营洞察</h3>
          </div>
          <div className="mt-4 space-y-3">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600">
                {s}
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-slate-900">进行中的任务</h3>
            <Link to="/tasks" className="flex items-center gap-1 text-[12px] text-sky-600 hover:text-sky-600">
              全部任务 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {running.map((t) => (
              <div key={t.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-slate-900">{t.title}</span>
                    <Badge variant="outline" className={cn('shrink-0 border', statusColor[t.status])}>{t.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{t.project}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    <span>{t.schedule}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {t.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                </div>
                <div className="w-32 shrink-0">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                    <span>分发进度</span>
                    <span className="text-slate-600">{t.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${t.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 热门灵感 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-slate-900">今日高潜灵感</h3>
          <Link to="/inspiration" className="flex items-center gap-1 text-[12px] text-sky-600 hover:text-sky-600">
            进入灵感库 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {hot.map((v) => (
            <Card key={v.id} className="glass-card group cursor-pointer overflow-hidden border-slate-200">
              <Thumb className="aspect-video w-full rounded-t-xl">
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85">{v.duration}</span>
                <span className="absolute left-2 top-2"><PlatformBadge platform={v.platform} /></span>
              </Thumb>
              <div className="p-3">
                <div className="truncate text-[13px] font-medium text-slate-900">{v.title}</div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{v.author} · {v.views} 播放</span>
                </div>
                <div className="mt-2"><HeatBar value={v.heat} /></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
