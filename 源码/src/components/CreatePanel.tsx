import { useEffect, useState } from 'react'
import { FolderPlus, Play, MoreHorizontal, FolderOpen } from 'lucide-react'
import { PlatformBadge, Thumb } from '@/components/shared'
import CreationConsole, { type ConsoleDraft } from '@/components/CreationConsole'
import { type Platform } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ---------------- 顶部展示轮播 ---------------- */

const showcase = [
  { title: '精华实测 · Before/After', project: 'GlowUp 美妆出海', platform: 'TikTok' as Platform },
  { title: '露营夜晚投影实拍', project: 'TechNova 北美', platform: 'YouTube' as Platform },
  { title: '黑五倒计时短片', project: 'BlackFriday 大促', platform: 'Instagram' as Platform },
  { title: '圣诞礼盒开箱', project: 'Noël 欧洲站', platform: 'Instagram' as Platform },
  { title: '数字人口播 · 六国语言', project: 'LinguaVoice', platform: 'TikTok' as Platform },
]

function ShowcaseCarousel() {
  const [active, setActive] = useState(0)
  const len = showcase.length
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % len), 3500)
    return () => clearInterval(t)
  }, [len])

  return (
    <div className="relative mx-auto h-44 max-w-3xl select-none">
      {showcase.map((s, i) => {
        let offset = (i - active + len) % len
        if (offset > len / 2) offset -= len
        const abs = Math.abs(offset)
        return (
          <div
            key={s.title}
            className="absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{
              transform: `translate(-50%, -50%) translateX(${offset * 200}px) scale(${abs === 0 ? 1 : 0.82})`,
              zIndex: 20 - abs,
              opacity: abs > 2 ? 0 : 1 - abs * 0.25,
            }}
          >
            <div className={cn('thumb-gradient relative aspect-video overflow-hidden rounded-xl border shadow-lg', abs === 0 ? 'border-white shadow-sky-200' : 'border-white/60')}>
              <Play className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white/80" fill="currentColor" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="truncate text-[11px] font-medium text-white">{s.title}</div>
                <div className="text-[10px] text-white/70">{s.project}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- 我的创作 ---------------- */

interface Creation {
  id: number
  platform: Platform
  title: string
  tag: string
  time: string
}

const initialCreations: Creation[] = [
  { id: 1, platform: 'TikTok', title: '精华实测 · 悬念开头版', tag: '视频', time: '昨天 16:20' },
  { id: 2, platform: 'Instagram', title: '品牌 KV · 蓝白主视觉', tag: '图文', time: '昨天 10:05' },
  { id: 3, platform: 'YouTube', title: '投影仪露营测评 · 篝火段', tag: '视频', time: '10-19 14:32' },
]

export default function CreatePanel() {
  const [generating, setGenerating] = useState(false)
  const [creations, setCreations] = useState<Creation[]>(initialCreations)

  const handleDone = (items: ConsoleDraft[]) => {
    setCreations((prev) => [
      ...items.map((d, i) => ({ id: Date.now() + i, platform: d.platform, title: d.title, tag: d.tag, time: '刚刚' })),
      ...prev,
    ])
    setGenerating(false)
    toast.success(`已生成 ${items.length} 条内容，已加入「我的创作」`)
  }

  return (
    <div className="space-y-8">
      {/* 顶部轮播 + 主标题 */}
      <div className="pt-4">
        <ShowcaseCarousel />
        <h1 className="mt-2 text-center text-3xl font-bold brand-text">让你的品牌故事鲜活起来</h1>
        <p className="mt-2 text-center text-[13px] text-slate-500">描述场景或产品，AI 自动生成面向海外社媒的短视频与图文内容</p>
      </div>

      {/* 创作控制台 */}
      <CreationConsole
        className="mx-auto max-w-4xl"
        onStart={() => setGenerating(true)}
        onDone={handleDone}
      />

      {/* 我的创作 */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-800">我的创作</h2>
          <button onClick={() => toast.info('打开素材库（演示）')} className="text-[12px] text-slate-400 transition-colors hover:text-sky-600">查看全部 →</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {/* 新建卡片 */}
          <button
            onClick={() => toast.success('新建创作（演示）')}
            className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
          >
            <FolderPlus className="h-6 w-6" />
            <span className="text-[12px]">新建创作</span>
          </button>

          {generating && (
            <div className="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50">
              <div className="thumb-gradient h-full w-full rounded-xl opacity-40" />
            </div>
          )}

          {creations.map((c) => (
            <div key={c.id} className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200">
              <Thumb className="h-full w-full">
                <span className="absolute left-2 top-2"><PlatformBadge platform={c.platform} /></span>
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85">
                  <Play className="h-2.5 w-2.5" fill="currentColor" /> {c.tag}
                </span>
              </Thumb>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => toast.info('预览（演示）')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600">
                  <Play className="h-3.5 w-3.5" fill="currentColor" />
                </button>
                <button onClick={() => toast.success('已加入项目素材（演示）')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600">
                  <FolderOpen className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toast.info('更多（演示）')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-1.5 pt-5">
                <div className="truncate text-[11px] font-medium text-white">{c.title}</div>
                <div className="text-[10px] text-white/65">{c.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
