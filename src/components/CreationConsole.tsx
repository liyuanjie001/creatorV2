import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles, Monitor, RectangleHorizontal, Clock,
  Volume2, VolumeX, ChevronRight, ChevronDown, Clapperboard, Image as ImageIcon, Wand2, X,
  Plus, Minus, Check, CloudUpload, Search, ListFilter, FileImage, Folder, Star,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Thumb } from '@/components/shared'
import { assets, type Asset, type Platform } from '@/data/mock'
import { type RemakeReference } from '@/lib/remake'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface GenerateIntent {
  brief: string
  batch: number
  mode: '视频' | '图文'
}

export interface ConsoleDraft {
  platform: Platform
  title: string
  tag: string
}

export const consoleDraftPool: ConsoleDraft[] = [
  { platform: 'TikTok', title: '3 秒开箱：把期待感拉满的悬念开头', tag: '悬念钩子' },
  { platform: 'Instagram', title: 'Before / After 对比图文', tag: '转化导向' },
  { platform: 'YouTube', title: '深度测评长视频 + 章节导航', tag: 'SEO 关键词' },
  { platform: 'TikTok', title: '反差剧情：办公室好物脑洞用法', tag: '剧情反转' },
  { platform: 'X', title: 'Thread 长帖：5 个使用场景串讲', tag: '场景营销' },
  { platform: 'Instagram', title: 'UGC 感生活 vlog 切片', tag: '软植入' },
]

const QUALITIES = ['480P', '720P', '1080P'] as const
const RATIOS = ['9:16', '3:4', '1:1', '4:3', '16:9'] as const
const BATCH_MAX = 4
const DURATION_MAX = 30
const DURATION_DEFAULT = 15

const MODELS = [
  { id: 'cs-3.5', name: 'Cinema Studio 3.5', desc: '相机选择、风格预设和 AI 导演' },
  { id: 'cs-3.0', name: 'Cinema Studio 3.0', desc: '增强的运镜和变速控制' },
  { id: 'cs-2.5', name: 'Cinema Studio 2.5', desc: '支持首帧的运镜' },
] as const

type LibraryFolder = 'root' | 'favorites'

function ModelMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600', className)}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 16c3-8 5-4 8 0s5 8 8 0" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function AttachPanel({
  onLocalPick,
  onSelectAsset,
}: {
  onLocalPick: () => void
  onSelectAsset: (asset: Asset) => void
}) {
  const [folder, setFolder] = useState<LibraryFolder>('root')
  const [rootOpen, setRootOpen] = useState(true)
  const [favOpen, setFavOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const mediaAssets = useMemo(
    () => assets.filter((a) => a.type === '图片' || a.type === '视频'),
    [],
  )
  const favoriteList = useMemo(() => mediaAssets.filter((a) => a.favorite), [mediaAssets])
  const treeList = folder === 'favorites' ? favoriteList : mediaAssets
  const gridList = treeList.filter((a) => !query.trim() || a.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {/* 本地上传 */}
      <div className="border-b border-slate-100 px-3.5 py-3">
        <div className="mb-2 text-[12.5px] font-semibold text-sky-600">本地上传</div>
        <button
          type="button"
          onClick={onLocalPick}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-5 text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
            <CloudUpload className="h-5 w-5" />
          </span>
          <span className="text-[12.5px] font-medium">上传媒体</span>
        </button>
      </div>

      {/* 素材库 */}
      <div className="px-3.5 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="text-[12.5px] font-semibold text-sky-600">素材库上传</div>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              title="筛选"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            >
              <ListFilter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="搜索"
              onClick={() => setShowSearch((v) => !v)}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-slate-50',
                showSearch ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {showSearch && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索素材名称…"
            className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-300"
          />
        )}

        <div className="flex h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
          {/* 左侧目录 */}
          <div className="w-[168px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-1.5 scroll-slim">
            <button
              type="button"
              onClick={() => {
                setRootOpen((v) => !v)
                setFolder('root')
              }}
              className={cn(
                'flex w-full items-center gap-1 rounded-md px-1.5 py-1.5 text-left text-[12px] font-medium hover:bg-slate-50',
                folder === 'root' ? 'bg-sky-50 text-sky-700' : 'text-slate-700',
              )}
            >
              {rootOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              <Folder className="h-3.5 w-3.5 text-amber-500" />
              全部素材
            </button>
            {rootOpen && (
              <div className="mb-1 ml-4 space-y-0.5 border-l border-slate-100 pl-1.5">
                {mediaAssets.slice(0, 5).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setFolder('root')
                      onSelectAsset(a)
                    }}
                    className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-[11px] text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
                    title={a.name}
                  >
                    <FileImage className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setFavOpen((v) => !v)
                setFolder('favorites')
              }}
              className={cn(
                'mt-0.5 flex w-full items-center gap-1 rounded-md px-1.5 py-1.5 text-left text-[12px] font-medium hover:bg-slate-50',
                folder === 'favorites' ? 'bg-sky-50 text-sky-700' : 'text-slate-700',
              )}
            >
              {favOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              收藏
            </button>
            {favOpen && (
              <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-1.5">
                {favoriteList.length > 0 ? (
                  favoriteList.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setFolder('favorites')
                        onSelectAsset(a)
                      }}
                      className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-[11px] text-slate-500 hover:bg-slate-50"
                      title={a.name}
                    >
                      <FileImage className="h-3 w-3 shrink-0 text-slate-300" />
                      <span className="truncate">{a.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-1.5 py-1 text-[11px] text-slate-300">暂无收藏</p>
                )}
              </div>
            )}
          </div>

          {/* 右侧预览网格 */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-white p-2.5 scroll-slim">
            <div className="grid grid-cols-2 gap-2">
              {gridList.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAsset(a)}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-all hover:border-sky-300 hover:shadow-sm"
                >
                  <Thumb className="aspect-[4/3] w-full">
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                      {a.type}
                    </span>
                  </Thumb>
                  <div className="truncate px-1.5 py-1.5 text-[10.5px] text-slate-500 group-hover:text-sky-600">
                    {a.name}
                  </div>
                </button>
              ))}
            </div>
            {gridList.length === 0 && (
              <div className="flex h-full items-center justify-center text-[12px] text-slate-400">暂无匹配素材</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreationConsole({
  onStart, onDone, placeholder, className,
  initialBrief = '', initialBatch, initialMode, autoStart = false,
  initialReference, onBeforeGenerate, bare = false,
}: {
  onStart: () => void
  onDone: (items: ConsoleDraft[]) => void
  placeholder?: string
  className?: string
  initialBrief?: string
  initialBatch?: number
  initialMode?: '视频' | '图文'
  initialReference?: RemakeReference | null
  /** 挂载后自动触发一次生成（用于从自由创作跳入项目） */
  autoStart?: boolean
  /** 返回 true 表示已接管生成流程，组件内不再本地生成 */
  onBeforeGenerate?: (intent: GenerateIntent) => boolean | void
  /** 无外层卡片边框，适合底部固定栏 */
  bare?: boolean
}) {
  const [mode, setMode] = useState<'视频' | '图文'>(initialMode ?? '视频')
  const [brief, setBrief] = useState(initialBrief)
  const [reference, setReference] = useState<RemakeReference | null>(initialReference ?? null)
  const [attached, setAttached] = useState<Asset[]>([])
  const [modelId, setModelId] = useState<string>(MODELS[0].id)
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>('1080P')
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>('16:9')
  const [durationText, setDurationText] = useState(String(DURATION_DEFAULT))
  const [audio, setAudio] = useState(true)
  const [batch, setBatch] = useState(() => Math.min(Math.max(initialBatch ?? 1, 1), BATCH_MAX))
  const [attachOpen, setAttachOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draftIdx, setDraftIdx] = useState(0)
  const autoStarted = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0]

  const generate = () => {
    if (generating) return
    if (onBeforeGenerate?.({ brief, batch, mode })) return
    setGenerating(true)
    onStart()
    toast.info('AI 开始生成，预计 30 秒（演示）')
    setTimeout(() => {
      const items = Array.from({ length: batch }, (_, i) => consoleDraftPool[(draftIdx + i) % consoleDraftPool.length])
      setDraftIdx((v) => (v + batch) % consoleDraftPool.length)
      setGenerating(false)
      onDone(items)
      toast.success(`已生成 ${batch} 条内容`)
    }, 1800)
  }

  useEffect(() => {
    if (!autoStart || autoStarted.current) return
    autoStarted.current = true
    const t = window.setTimeout(() => generate(), 80)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  const onLocalUpload = (files: FileList | null) => {
    if (!files?.length) return
    const names = Array.from(files).map((f) => f.name).join('、')
    toast.success(`已添加本地文件：${names}`)
    setAttachOpen(false)
  }

  const onSelectAsset = (asset: Asset) => {
    setAttached((prev) => (prev.some((a) => a.id === asset.id) ? prev : [...prev, asset].slice(-3)))
    toast.success(`已添加素材：${asset.name}`)
    setAttachOpen(false)
  }

  const commitDuration = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '')
    if (!digits) {
      setDurationText(String(DURATION_DEFAULT))
      return
    }
    const next = Math.min(DURATION_MAX, Math.max(1, Number(digits)))
    setDurationText(String(next))
  }

  const chipClass =
    'flex h-[30px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600'

  const body = (
    <div className="flex gap-3">
      {/* 左侧模式切换 */}
      <div className="flex flex-col gap-1 border-r border-slate-100 pr-3">
        {([['视频', Clapperboard], ['图文', ImageIcon]] as const).map(([m, Icon]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex w-14 flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] transition-colors',
              mode === m ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            )}
          >
            <Icon className="h-5 w-5" />
            {m}
          </button>
        ))}
      </div>

      {/* 中间输入区 */}
      <div className="relative min-w-0 flex-1 space-y-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onLocalUpload(e.target.files)
            e.target.value = ''
          }}
        />

        {/* 一键翻拍：参考视频 + 脚本 */}
        <div className={cn(
          'rounded-xl border border-slate-200 bg-white',
          reference || attached.length ? 'p-3' : '',
        )}>
          {(reference || attached.length > 0) && (
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              {reference && (
                <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-1.5 pr-2.5">
                  <Thumb className="h-10 w-10 shrink-0 rounded-md" />
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-slate-800">参考视频</div>
                    <div className="truncate text-[11.5px] text-slate-400">{reference.author}</div>
                  </div>
                  <button
                    type="button"
                    title="移除参考"
                    onClick={() => setReference(null)}
                    className="ml-auto rounded-md p-1.5 text-slate-300 transition-colors hover:bg-white hover:text-slate-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {attached.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 py-1 pl-1 pr-1.5">
                  <Thumb className="h-8 w-8 shrink-0 rounded-md" />
                  <span className="max-w-28 truncate text-[11px] text-slate-600">{a.name}</span>
                  <button
                    type="button"
                    title="移除"
                    onClick={() => setAttached((prev) => prev.filter((x) => x.id !== a.id))}
                    className="rounded p-0.5 text-slate-300 hover:bg-white hover:text-slate-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={placeholder ?? (mode === '视频' ? '描述你的场景，使用 @ 添加产品卡信息' : '描述你想要的图文内容，使用 @ 添加产品卡信息')}
            className={cn(
              'min-h-20 resize-none text-[13.5px] placeholder:text-slate-400 focus-visible:ring-sky-300',
              reference || attached.length ? 'border-0 bg-transparent px-0 shadow-none focus-visible:ring-0' : 'border-slate-200 bg-slate-50/70',
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* + 添加：本地上传 + 素材库内容 */}
            <Popover open={attachOpen} onOpenChange={setAttachOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="添加素材"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-600',
                    attachOpen && 'border-sky-300 text-sky-600',
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-auto border-0 bg-transparent p-0 shadow-none"
              >
                <AttachPanel
                  onLocalPick={() => fileInputRef.current?.click()}
                  onSelectAsset={onSelectAsset}
                />
              </PopoverContent>
            </Popover>

            {/* 模型选择 */}
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-600 transition-colors hover:bg-sky-100"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {selectedModel.name}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-[300px] border-slate-200 bg-white p-2 text-slate-800 shadow-xl"
              >
                <div className="space-y-0.5">
                  {MODELS.map((m) => {
                    const active = m.id === modelId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setModelId(m.id)
                          setModelOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                          active ? 'border border-sky-200 bg-sky-50' : 'border border-transparent hover:bg-slate-50',
                        )}
                      >
                        <ModelMark />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-semibold text-slate-800">{m.name}</div>
                          <div className="mt-0.5 text-[11.5px] text-slate-400">{m.desc}</div>
                        </div>
                        {active && <Check className="h-4 w-4 shrink-0 text-sky-500" />}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title="分辨率" className={chipClass}>
                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                  {quality}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-28 border-slate-200 bg-white text-slate-800 shadow-lg">
                {QUALITIES.map((q) => (
                  <DropdownMenuItem
                    key={q}
                    className={cn('cursor-pointer', quality === q && 'bg-sky-50 font-medium text-sky-600')}
                    onClick={() => setQuality(q)}
                  >
                    {q}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title="画幅比例" className={chipClass}>
                  <RectangleHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  {ratio}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-28 border-slate-200 bg-white text-slate-800 shadow-lg">
                {RATIOS.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    className={cn('cursor-pointer', ratio === r && 'bg-sky-50 font-medium text-sky-600')}
                    onClick={() => setRatio(r)}
                  >
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {mode === '视频' && (
              <div
                title={`时长，最多 ${DURATION_MAX}s`}
                className="flex h-[30px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
                    setDurationText(v)
                  }}
                  onBlur={() => commitDuration(durationText)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitDuration(durationText)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  className="w-6 bg-transparent text-center tabular-nums outline-none"
                  aria-label="时长（秒）"
                />
                <span className="text-slate-400">s</span>
              </div>
            )}

            {/* 配乐 / 批量：与系统浅色 chip 一致 */}
            <button
              type="button"
              title="配乐"
              onClick={() => {
                setAudio((v) => !v)
                toast.success(audio ? '已关闭配乐' : '已开启配乐')
              }}
              className={cn(chipClass, audio && 'border-sky-200 bg-sky-50 text-sky-600')}
            >
              {audio ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
              <span>{audio ? '开' : '关'}</span>
            </button>

            <div
              title="批量个数"
              className="flex h-[30px] items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 text-[12px] text-slate-600"
            >
              <button
                type="button"
                disabled={batch <= 1}
                onClick={() => setBatch((b) => Math.max(1, b - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                aria-label="减少批量"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2.25rem] text-center tabular-nums">
                <span className="font-medium text-slate-800">{batch}</span>
                <span className="text-slate-400">/{BATCH_MAX}</span>
              </span>
              <button
                type="button"
                disabled={batch >= BATCH_MAX}
                onClick={() => setBatch((b) => Math.min(BATCH_MAX, b + 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                aria-label="增加批量"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="ml-auto flex h-[68px] w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl brand-gradient text-white shadow-md shadow-sky-300/40 transition-all hover:opacity-90 disabled:opacity-60"
          >
            <span className="flex items-center gap-1 text-[14.5px] font-semibold">
              {generating ? <Wand2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成
            </span>
            <span className="text-[10px] text-white/75">消耗 20 积分</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (bare) {
    return <div className={cn(className)}>{body}</div>
  }

  return (
    <Card className={cn('glass-card rounded-2xl border-slate-200 p-3', className)}>
      {body}
    </Card>
  )
}
