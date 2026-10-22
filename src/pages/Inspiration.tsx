import { useNavigate, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared'
import InspirationHitCard from '@/components/InspirationHitCard'
import TrendsPanel from '@/components/TrendsPanel'
import { NotesPanel } from './Notes'
import { inspirations } from '@/data/mock'
import { REMAKE_PROMPT, toRemakeReference } from '@/lib/remake'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'inspire', label: '内容灵感', desc: '采集海外全平台爆款内容，拆解脚本结构，一键翻拍为你的品牌素材' },
  { key: 'trends', label: '热点趋势', desc: '实时追踪海外 6 大平台热搜话题与关键词走势，抢在流量爆发前布局' },
  { key: 'notes', label: '妙记', desc: 'AI 灵感对话自动保存的备忘，随时回看并复用你之前的想法' },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function Inspiration() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'inspire') as TabKey
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'inspire'
  const meta = tabs.find((t) => t.key === activeTab)!

  const remakeToCreate = (item: (typeof inspirations)[number]) => {
    toast.success('已填入自由创作输入框')
    navigate('/create', {
      state: {
        remake: {
          reference: toRemakeReference(item),
          brief: REMAKE_PROMPT,
        },
      },
    })
  }

  const favoriteToAssets = () => {
    toast.success('已收藏至素材库，点击查看', {
      action: {
        label: '查看',
        onClick: () => navigate('/assets'),
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="创意中心" desc={meta.desc} />

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
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索灵感关键词、话题、作者…"
              className="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
            />
          </div>

          {/* 对齐「内容制作 · 爆款社区」竖版卡片网格 */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
            {inspirations.map((v) => (
              <InspirationHitCard
                key={v.id}
                item={v}
                onRemake={() => remakeToCreate(v)}
                onFavorite={favoriteToAssets}
              />
            ))}
          </div>
        </>
      )}

      {activeTab === 'trends' && <TrendsPanel />}

      {activeTab === 'notes' && <NotesPanel embedded />}
    </div>
  )
}
