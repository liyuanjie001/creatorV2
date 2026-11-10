import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Play } from 'lucide-react'
import { PlatformBadge, Thumb } from '@/components/shared'
import CreationConsole from '@/components/CreationConsole'
import { addProject, createProjectFromBrief, generations, loadProjects, type Platform } from '@/data/mock'
import { type RemakeReference } from '@/lib/remake'
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

/* ---------------- 创作记录（关联项目生成内容） ---------------- */

interface Creation {
  generationId: string
  projectId: string
  platform: Platform
  title: string
  tag: string
  time: string
}

const CREATION_LINKS: { generationId: string; title: string; tag: string; time: string }[] = [
  { generationId: 'G-01', title: '精华实测 · 悬念开头版', tag: '视频', time: '昨天 16:20' },
  { generationId: 'G-03', title: '品牌 KV · 蓝白主视觉', tag: '图文', time: '昨天 10:05' },
  { generationId: 'G-06', title: '投影仪露营测评 · 篝火段', tag: '视频', time: '10-19 14:32' },
]

const initialCreations: Creation[] = CREATION_LINKS.map((c) => {
  const g = generations.find((x) => x.id === c.generationId)!
  return {
    generationId: c.generationId,
    projectId: g.projectId,
    platform: g.platform,
    title: c.title,
    tag: c.tag,
    time: c.time,
  }
})

type RemakeNavState = {
  remake?: {
    reference: RemakeReference
    brief: string
  }
}

export default function CreatePanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const [creations] = useState<Creation[]>(initialCreations)
  const [remakeSeed] = useState(() => (location.state as RemakeNavState | null)?.remake ?? null)
  const [consoleKey] = useState(() => (remakeSeed ? `remake-${Date.now()}` : 'default'))

  useEffect(() => {
    if (remakeSeed) {
      navigate('.', { replace: true, state: null })
    }
  }, [remakeSeed, navigate])

  return (
    <div className="space-y-8">
      {/* 顶部轮播 + 主标题 */}
      <div className="pt-4">
        <ShowcaseCarousel />
        <h1 className="mt-2 text-center text-3xl font-bold brand-text">让你的品牌故事鲜活起来</h1>
        <p className="mt-2 text-center text-[13px] text-slate-500">可选择产品卡与目标项目；未选项目时点击生成会自动新建项目</p>
      </div>

      {/* 创作控制台：生成 → 新建项目 → 进入项目内生成 */}
      <CreationConsole
        key={consoleKey}
        className="mx-auto max-w-4xl"
        initialBrief={remakeSeed?.brief ?? ''}
        initialReference={remakeSeed?.reference ?? null}
        onStart={() => {}}
        onDone={() => {}}
        onBeforeGenerate={({ brief, batch, mode, projectId, product }) => {
          const mention = product ? `@${product.name}` : ''
          const fullBrief = [mention, brief.replace(mention, '').trim()].filter(Boolean).join(' ').trim()
          const existing = projectId ? loadProjects().find((p) => p.id === projectId) : undefined
          const project = existing ?? createProjectFromBrief(fullBrief || product?.name || '未命名项目')
          if (!existing) {
            addProject(project)
            toast.success(`已创建项目「${project.name}」，正在进入生成…`)
          } else {
            toast.success(`将在项目「${project.name}」中生成…`)
          }
          navigate(`/projects/${project.id}`, {
            state: {
              autoGenerate: true,
              brief: fullBrief,
              batch,
              mode,
              remake: remakeSeed ?? undefined,
            },
          })
          return true
        }}
      />

      {/* 创作记录 */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold text-slate-800">创作记录</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {creations.map((c) => (
            <button
              key={c.generationId}
              type="button"
              onClick={() =>
                navigate(`/projects/${c.projectId}`, {
                  state: { openGenerationId: c.generationId },
                })
              }
              className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 text-left transition-all hover:border-sky-300 hover:shadow-md"
            >
              <Thumb className="h-full w-full">
                <span className="absolute left-2 top-2"><PlatformBadge platform={c.platform} /></span>
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85">
                  <Play className="h-2.5 w-2.5" fill="currentColor" /> {c.tag}
                </span>
              </Thumb>
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-sky-600 shadow-sm">
                  <Play className="h-4 w-4" fill="currentColor" />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-1.5 pt-5">
                <div className="truncate text-[11px] font-medium text-white">{c.title}</div>
                <div className="text-[10px] text-white/65">{c.time}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
