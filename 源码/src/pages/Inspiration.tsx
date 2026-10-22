import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Copy, Bookmark, Search, SlidersHorizontal, Flame } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, PlatformBadge, Thumb, HeatBar } from '@/components/shared'
import TrendsPanel from '@/components/TrendsPanel'
import { NotesPanel } from './Notes'
import { inspirations, platforms, type Platform } from '@/data/mock'
import { cn } from '@/lib/utils'

const filters = ['全部', '高热度', '可翻拍', '视频', '图文'] as const

const tabs = [
  { key: 'inspire', label: '内容灵感', desc: '采集海外全平台爆款内容，拆解脚本结构，一键翻拍为你的品牌素材' },
  { key: 'trends', label: '热点趋势', desc: '实时追踪海外 6 大平台热搜话题与关键词走势，抢在流量爆发前布局' },
  { key: 'notes', label: '妙记', desc: 'AI 灵感对话自动保存的备忘，随时回看并复用你之前的想法' },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function Inspiration() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'inspire') as TabKey
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'inspire'

  const [platform, setPlatform] = useState<Platform | '全部'>('全部')
  const [filter, setFilter] = useState<(typeof filters)[number]>('全部')

  const list = inspirations.filter((v) => platform === '全部' || v.platform === platform)
  const meta = tabs.find((t) => t.key === activeTab)!

  return (
    <div className="space-y-6">
      <PageHeader
        title="创意中心"
        desc={meta.desc}
        extra={
          activeTab === 'inspire' ? (
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <SlidersHorizontal className="h-3.5 w-3.5" /> 批量操作
            </Button>
          ) : undefined
        }
      />

      {/* 标签页 */}
      <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100/80 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key }, { replace: true })}
            className={cn(
              'rounded-lg px-4 py-1.5 text-[13px] transition-all',
              activeTab === t.key ? 'bg-white font-medium text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'inspire' && (
        <>
          {/* 筛选栏 */}
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索灵感关键词、话题、作者…"
                className="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(['全部', ...platforms] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                    platform === p
                      ? 'brand-gradient font-medium text-white'
                      : 'border border-slate-200 text-slate-500 hover:text-slate-800'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-[12px] transition-colors',
                    filter === f ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 灵感卡片网格 */}
          <div className="grid grid-cols-3 gap-4">
            {list.map((v) => (
              <Card key={v.id} className="glass-card group overflow-hidden border-slate-200">
                <div className="relative">
                  <Thumb className="aspect-video w-full">
                    <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85">{v.duration}</span>
                    <span className="absolute left-2 top-2"><PlatformBadge platform={v.platform} /></span>
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-amber-300">
                      <Flame className="h-3 w-3" /> 热度 {v.heat}
                    </span>
                  </Thumb>
                  {/* hover 操作 */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" className="gap-1.5 brand-gradient text-white hover:opacity-90">
                      <Copy className="h-3.5 w-3.5" /> 一键翻拍
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white">
                      <Bookmark className="h-3.5 w-3.5" /> 收藏
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[14px] font-medium leading-snug text-slate-800">{v.title}</div>
                  <div className="mt-1.5 text-[12px] text-slate-400">{v.author} · {v.views} 播放 · {v.likes} 点赞</div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {v.tags.map((t) => (
                      <Badge key={t} variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-normal text-slate-500">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3"><HeatBar value={v.heat} /></div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'trends' && <TrendsPanel />}

      {activeTab === 'notes' && <NotesPanel embedded />}
    </div>
  )
}
