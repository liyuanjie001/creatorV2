import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft, FileText, Clapperboard, FolderOpen,
  Plus, Trash2,
  Play, RotateCcw, Wand2, User, Clock,
  ShoppingBag, Lightbulb, Sparkles,
  Users, Rocket, MousePointerClick, CalendarClock, Check, Link2, X, Orbit,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PlatformBadge, Thumb } from '@/components/shared'
import CreationConsole, { consoleDraftPool, type ConsoleDraft } from '@/components/CreationConsole'
import InspirationHitCard from '@/components/InspirationHitCard'
import Topbar from '@/layout/Topbar'
import {
  loadProjects, generations, engagement7d, platformColors, deletedAssets,
  accounts, tasks, products, inspirations,
  type Generation, type Platform, type Product,
} from '@/data/mock'
import { REMAKE_PROMPT, toRemakeReference, type RemakeReference } from '@/lib/remake'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ---------------- 常量 ---------------- */

type SectionKey = 'gen' | 'brief' | 'product' | 'inspire' | 'account' | 'publish' | 'attribution' | 'schedule' | 'trash'

const sectionTitles: Record<SectionKey, string> = {
  gen: '全部生成', brief: '项目简报', product: '产品卡', inspire: '灵感库',
  account: '账号管理', publish: '发布管理', attribution: '数据归因', schedule: '任务调度',
  trash: '回收站',
}

/** 这些分区不展示底部 AI 输入框（含管理分组） */
const hideConsoleSections: SectionKey[] = [
  'brief', 'product', 'inspire',
  'account', 'publish', 'attribution', 'schedule', 'trash',
]

const dayOrder = ['今天', '昨天', '近7天'] as const

const statusStyle: Record<Generation['status'], string> = {
  已发布: 'bg-emerald-50 text-emerald-600',
  待发布: 'bg-amber-50 text-amber-600',
  草稿: 'bg-slate-100 text-slate-500',
}

/* ---------------- 产品卡详情表单 ---------------- */

const galleryHues = [0, 50, 120, 200]
const DRAFT_PRODUCT_ID = '__draft__'

const blankProduct = (projectId: string): Product => ({
  id: DRAFT_PRODUCT_ID,
  projectId,
  name: '',
  price: '',
  sellingPoint: '',
  sales: '',
  desc: '',
  link: '',
  points: [],
})

const aiDescByImage = [
  '根据商品主图识别：轻量化便携设计，主打户外与差旅场景，画面突出产品体积对比与使用氛围，适合短视频开箱与场景种草。',
  'AI 识图结果：产品外观简洁、卖点视觉清晰，建议强调便携性、画质/音质表现与续航能力，文案语气偏北美生活方式。',
  '基于上传图片生成：主体产品居中、背景干净，适合独立站详情页与社媒轮播；描述突出核心参数与即开即用体验。',
]

const aiPointsPool = [
  ['轻巧便携，随身带走不占空间', '核心性能稳定，日常场景够用', '上手简单，开箱即可使用', '续航表现出色，出门更省心', '性价比突出，送礼自用都合适'],
  ['外观简约耐看，出片属性强', '关键参数扎实，实测表现可靠', '多场景适配，居家差旅都能用', '配件齐全，开箱即享完整体验', '售后友好，海外买家更安心'],
  ['主打刚需痛点，转化路径清晰', '材质做工细致，质感一眼可见', '智能辅助功能，降低使用门槛', '能耗控制优秀，长时间更省电', '社媒热门款同款卖点，易出爆款'],
]

function ProductForm({ product, isNew = false }: { product: Product; isNew?: boolean }) {
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price)
  const [sales, setSales] = useState(product.sales)
  const [link, setLink] = useState(product.link ?? '')
  const [desc, setDesc] = useState(product.desc ?? '')
  const [points, setPoints] = useState<string[]>(product.points ?? [])
  const [newPoint, setNewPoint] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [descLoading, setDescLoading] = useState(false)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [descIdx, setDescIdx] = useState(0)
  const [pointsIdx, setPointsIdx] = useState(0)

  const addPoint = () => {
    const v = newPoint.trim()
    if (!v) return
    setPoints([...points, v])
    setNewPoint('')
  }

  const generateDescFromImage = () => {
    if (descLoading) return
    setDescLoading(true)
    toast.info('正在根据商品图识别并生成描述…')
    window.setTimeout(() => {
      setDesc(aiDescByImage[descIdx % aiDescByImage.length])
      setDescIdx((i) => i + 1)
      setDescLoading(false)
      toast.success('已根据商品图生成产品描述')
    }, 1100)
  }

  const generatePoints = () => {
    if (pointsLoading) return
    setPointsLoading(true)
    toast.info('AI 正在生成 5 条卖点…')
    window.setTimeout(() => {
      setPoints(aiPointsPool[pointsIdx % aiPointsPool.length])
      setPointsIdx((i) => i + 1)
      setPointsLoading(false)
      toast.success('已生成 5 条产品卖点')
    }, 1100)
  }

  return (
    <div className="flex gap-5">
      {/* 画廊 */}
      <div className="w-60 shrink-0">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <Thumb className={cn('aspect-square w-full transition-all', activeImg !== 0 && `[filter:hue-rotate(${galleryHues[activeImg]}deg)]`)}>
            <ShoppingBag className="h-10 w-10 text-white/70" />
          </Thumb>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {galleryHues.map((h, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={cn(
                'overflow-hidden rounded-lg border-2 transition-all',
                activeImg === i ? 'border-sky-500' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Thumb className={cn('aspect-square w-full', i !== 0 && `[filter:hue-rotate(${h}deg)]`)}>
                <ShoppingBag className="h-3.5 w-3.5 text-white/70" />
              </Thumb>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">商品图 · 点击缩略图切换</p>
        <Button
          size="sm"
          variant="outline"
          disabled={descLoading}
          className="mt-3 w-full gap-1.5 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
          onClick={generateDescFromImage}
        >
          {descLoading ? <Wand2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {descLoading ? '识别生成中…' : 'AI 识图生成描述'}
        </Button>
      </div>

      {/* 信息表单 */}
      <div className="min-w-0 flex-1">
        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-500">标题</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入产品标题" className="border-slate-200 bg-white text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-slate-500">价格</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$0.00" className="border-slate-200 bg-white text-[13px]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-slate-500">销量</label>
              <Input value={sales} onChange={(e) => setSales(e.target.value)} placeholder="如：月销 1.5w" className="border-slate-200 bg-white text-[13px]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-slate-500">商品链接</label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className="border-slate-200 bg-white pl-9 text-[13px] text-sky-600" />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-500">描述</label>
              <button
                type="button"
                disabled={descLoading}
                onClick={generateDescFromImage}
                className="flex items-center gap-1 text-[11.5px] font-medium text-sky-600 transition-colors hover:text-sky-700 disabled:opacity-60"
              >
                {descLoading ? <Wand2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI 根据图片生成
              </button>
            </div>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="可手动填写，或根据左侧商品图 AI 生成"
              className="resize-none border-slate-200 bg-white text-[13px] leading-relaxed"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-500">卖点</label>
              <button
                type="button"
                disabled={pointsLoading}
                onClick={generatePoints}
                className="flex items-center gap-1 text-[11.5px] font-medium text-sky-600 transition-colors hover:text-sky-700 disabled:opacity-60"
              >
                {pointsLoading ? <Wand2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI 一键生成 5 条
              </button>
            </div>
            <div className="space-y-2">
              {points.map((pt, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="min-w-0 flex-1 text-[12.5px] text-slate-700">{pt}</span>
                  <button onClick={() => setPoints(points.filter((_, j) => j !== i))} className="shrink-0 text-slate-300 transition-colors hover:text-rose-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Input
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
                placeholder="输入卖点，回车添加"
                className="border-dashed border-slate-300 bg-white text-[12.5px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4">
          <Button size="sm" className="gap-1.5 brand-gradient text-white hover:opacity-90" onClick={() => toast.success(isNew ? '产品卡已创建（演示）' : '产品卡已保存（演示）')}>
            <Check className="h-3.5 w-3.5" /> 保存
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700" onClick={() => toast.success('已进入立即创作（演示）')}>
            <Sparkles className="h-3.5 w-3.5" /> 立即创作
          </Button>
          <span className="ml-auto text-[11px] text-slate-400">{isNew ? '新建产品卡' : product.sellingPoint}</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- 产出卡片 ---------------- */

function GenCard({
  g,
  highlighted,
  onOpen,
}: {
  g: Generation
  highlighted?: boolean
  onOpen?: (g: Generation) => void
}) {
  return (
    <div
      id={`gen-${g.id}`}
      className={cn(
        'group relative aspect-video overflow-hidden rounded-xl border transition-all',
        highlighted ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200',
      )}
    >
      <Thumb className="h-full w-full">
        <span className="absolute left-2 top-2"><PlatformBadge platform={g.platform} /></span>
        <span className="absolute right-2 top-2"><Badge className={cn('border-0 text-[10px]', statusStyle[g.status])}>{g.status}</Badge></span>
        {g.duration && <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">{g.duration}</span>}
      </Thumb>
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onOpen?.(g)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:text-sky-600"
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
        </button>
        <button type="button" onClick={() => toast.success('已加入发布任务（演示）')} className="rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-slate-700 hover:text-sky-600">
          去发布
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-1.5 pt-6">
        <div className="truncate text-[11px] font-medium text-white">{g.title}</div>
      </div>
    </div>
  )
}

/* ---------------- 项目简报 ---------------- */

function BriefPanel({ projectId }: { projectId: string }) {
  const project = loadProjects().find((p) => p.id === projectId)!
  const mainPlatform = project.platforms[0] as Platform | undefined
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '累计曝光', value: project.exposure },
          { label: '平均互动率', value: project.engagement },
          { label: '已发布内容', value: `${project.contentCount} 条` },
          { label: '整体进度', value: `${project.progress}%` },
        ].map((k) => (
          <Card key={k.label} className="glass-card border-slate-200 p-4">
            <div className="text-[12px] text-slate-400">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{k.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2 border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-slate-800">分日互动表现</h3>
            <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
              <Clock className="h-3.5 w-3.5" /> {project.start} ~ {project.end}
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagement7d} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(100,116,139,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(100,116,139,0.08)' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e9ee', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="TikTok" fill={mainPlatform ? platformColors[mainPlatform] : '#11a3fd'} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="glass-card border-slate-200 p-5">
          <h3 className="mb-4 text-[15px] font-medium text-slate-800">项目信息</h3>
          <div className="space-y-3.5 text-[12.5px]">
            <div className="flex justify-between"><span className="text-slate-400">负责人</span><span className="flex items-center gap-1.5 text-slate-700"><User className="h-3.5 w-3.5 text-slate-400" />{project.owner}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">周期</span><span className="text-slate-700">{project.start} ~ {project.end}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">平台</span><span className="flex gap-1">{project.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}</span></div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-[11.5px] text-slate-400">
              <span>整体进度</span>
              <span className="font-medium text-slate-600">{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="brand-gradient h-full rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- 主页面 ---------------- */

type GenNavState = {
  autoGenerate?: boolean
  brief?: string
  batch?: number
  mode?: '视频' | '图文'
  openGenerationId?: string
}

/** 防止 StrictMode 下重复自动生成 */
const autoGenStarted = new Set<string>()

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const projectList = loadProjects()
  const project = projectList.find((p) => p.id === id) ?? projectList[0]

  const [seed] = useState<GenNavState>(() => (location.state as GenNavState | null) ?? {})
  const [seedBrief] = useState(() => seed.brief ?? '')
  const [seedBatch] = useState(() => seed.batch ?? 1)
  const [seedMode] = useState(() => seed.mode)
  const [openGenerationId] = useState(() => seed.openGenerationId ?? '')
  const autoGenerate = !!seed.autoGenerate
  const clearedNav = useRef(false)
  const openedFromNav = useRef(false)

  const [section, setSection] = useState<SectionKey>('gen')
  const projectProducts = products.filter((p) => p.projectId === project.id)
  const [selProductId, setSelProductId] = useState(projectProducts[0]?.id ?? '')
  const [draftKey, setDraftKey] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [extraGens, setExtraGens] = useState<Generation[]>([])
  const [remakeRef, setRemakeRef] = useState<RemakeReference | null>(null)
  const [remakeBrief, setRemakeBrief] = useState('')
  const [remakeKey, setRemakeKey] = useState(0)
  const [previewGen, setPreviewGen] = useState<Generation | null>(null)
  const [highlightGenId, setHighlightGenId] = useState('')

  /* 从自由创作跳入：直接在本项目开始生成，无需再点「生成」 */
  useEffect(() => {
    if (!autoGenerate || !id) return
    const key = `${id}:${seedBrief}:${seedBatch}:${seedMode ?? ''}`
    if (autoGenStarted.has(key)) return
    autoGenStarted.add(key)

    if (!clearedNav.current) {
      clearedNav.current = true
      navigate('.', { replace: true, state: null })
    }

    setSection('gen')
    setGenerating(true)
    toast.info('AI 开始生成，预计 30 秒（演示）')

    window.setTimeout(() => {
      const items = Array.from(
        { length: seedBatch },
        (_, i) => consoleDraftPool[i % consoleDraftPool.length],
      )
      setExtraGens((prev) => [
        ...items.map((d, i) => ({
          id: `N-${Date.now()}-${i}`,
          projectId: id,
          title: d.title,
          type: '视频' as const,
          duration: '00:15',
          platform: d.platform,
          day: '今天' as const,
          status: '草稿' as const,
        })),
        ...prev,
      ])
      setGenerating(false)
      toast.success(`已生成 ${items.length} 条内容到本项目`)
    }, 1600)
    // 不清理 timer，避免 React StrictMode 卸载时取消自动生成
  }, [autoGenerate, id, seedBrief, seedBatch, seedMode, navigate])

  /* 从首页创作记录跳入：定位到对应生成内容并打开预览 */
  useEffect(() => {
    if (!openGenerationId || openedFromNav.current) return
    openedFromNav.current = true
    setSection('gen')
    setHighlightGenId(openGenerationId)
    const target =
      generations.find((g) => g.id === openGenerationId)
      ?? null
    if (target) setPreviewGen(target)
    if (!clearedNav.current) {
      clearedNav.current = true
      navigate('.', { replace: true, state: null })
    }
    const t = window.setTimeout(() => {
      document.getElementById(`gen-${openGenerationId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [openGenerationId, navigate])

  /* 批量生成 */
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchDone, setBatchDone] = useState<number | null>(null)
  const [batchCount, setBatchCount] = useState(10)
  const [batchPlatforms, setBatchPlatforms] = useState<Platform[]>(project.platforms)
  const [batchThemes, setBatchThemes] = useState<string[]>(['商品种草'])

  const related = [...extraGens, ...generations.filter((g) => g.projectId === project.id)]

  /** 按时间依次排列，不再按「今天 / 昨天 / 近7天」分组 */
  const sortedGens = dayOrder.flatMap((d) => related.filter((g) => g.day === d))

  const projectAccounts = accounts.filter((a) => project.platforms.includes(a.platform))
  const projectTasks = tasks.filter((t) => t.project === project.name)
  const recs = (() => {
    const matched = inspirations.filter((i) => project.platforms.includes(i.platform))
    const rest = inspirations.filter((i) => !project.platforms.includes(i.platform)).sort((a, b) => b.heat - a.heat)
    return [...matched, ...rest].slice(0, 6)
  })()

  const handleDone = (items: ConsoleDraft[]) => {
    setExtraGens((prev) => [
      ...items.map((d, i) => ({
        id: `N-${Date.now()}-${i}`, projectId: project.id, title: d.title, type: '视频' as const,
        duration: '00:15', platform: d.platform, day: '今天' as const, status: '草稿' as const,
      })),
      ...prev,
    ])
    setGenerating(false)
    setSection('gen')
    toast.success(`已生成 ${items.length} 条内容到本项目`)
  }

  /* 批量生成执行 */
  const batchThemeDefs = [
    { key: '商品种草', suffix: '种草短片' },
    { key: '场景展示', suffix: '场景展示' },
    { key: '促销转化', suffix: '促销切片' },
    { key: '用户证言', suffix: 'UGC 证言' },
  ]
  const batchStages = ['撰写脚本', '生成画面', '渲染视频', '生成封面']

  const runBatch = () => {
    if (batchRunning) return
    if (batchPlatforms.length === 0) { toast.warning('至少选择一个平台'); return }
    setBatchRunning(true)
    setBatchProgress(0)
    setBatchDone(null)
    let p = 0
    const timer = setInterval(() => {
      p += 4 + Math.floor(Math.random() * 7)
      if (p >= 100) {
        clearInterval(timer)
        setBatchProgress(100)
        const pool = projectProducts.length > 0 ? projectProducts : [{ name: project.name }]
        const themes = batchThemeDefs.filter((t) => batchThemes.includes(t.key))
        const useThemes = themes.length > 0 ? themes : batchThemeDefs
        const items: Generation[] = Array.from({ length: batchCount }, (_, i) => {
          const prod = pool[i % pool.length]
          const th = useThemes[i % useThemes.length]
          const isImage = i % 4 === 3
          return {
            id: `B-${Date.now()}-${i}`, projectId: project.id,
            title: `${prod.name} · ${th.suffix} #${i + 1}`,
            type: isImage ? '图片' as const : '视频' as const,
            duration: isImage ? undefined : `00:${String(15 + ((i * 7) % 40)).padStart(2, '0')}`,
            platform: batchPlatforms[i % batchPlatforms.length],
            day: '今天' as const, status: '草稿' as const,
          }
        })
        setExtraGens((prev) => [...items, ...prev])
        setBatchRunning(false)
        setBatchDone(batchCount)
        toast.success(`批量生成完成，${batchCount} 条内容已加入「全部生成」`)
      } else {
        setBatchProgress(p)
      }
    }, 160)
  }

  const navItem = (key: SectionKey, label: string, Icon: typeof FolderOpen) => (
    <button
      onClick={() => setSection(key)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
        section === key ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 项目内侧边栏（全高，顶栏不占其位置） */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
          <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40">
            <Orbit className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-slate-800">出海动力</div>
            <div className="text-[10.5px] text-slate-400">项目工作区</div>
          </div>
        </div>
        <button
          onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/projects'))}
          className="mx-2.5 mb-1 mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-sky-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 返回
        </button>
        <div className="flex-1 overflow-y-auto scroll-slim px-2.5 pb-2">
          <div className="mb-3 flex items-center gap-2 px-2.5">
            <span className="h-3.5 w-3.5 shrink-0 rounded-[5px]" style={{ backgroundColor: project.color }} />
            <span className="truncate text-[13px] font-semibold text-slate-800">{project.name}</span>
          </div>

          <nav className="space-y-0.5">
            {navItem('gen', '全部生成', Clapperboard)}
            {navItem('brief', '项目简报', FileText)}
            {navItem('product', '产品卡', ShoppingBag)}
            {navItem('inspire', '灵感库', Lightbulb)}
          </nav>

          <div className="mb-1.5 mt-5 px-2.5 text-[11px] font-medium tracking-wider text-slate-400">管理</div>
          <nav className="space-y-0.5">
            {navItem('account', '账号管理', Users)}
            {navItem('publish', '发布管理', Rocket)}
            {navItem('attribution', '数据归因', MousePointerClick)}
            {navItem('schedule', '任务调度', CalendarClock)}
          </nav>
        </div>
        <div className="border-t border-slate-100 px-2.5 py-2.5">
          <button
            onClick={() => setSection('trash')}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
              section === 'trash' ? 'bg-sky-50 font-medium text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            )}
          >
            <Trash2 className="h-4 w-4 shrink-0" /> 回收站
          </button>
        </div>
      </aside>

      {/* 右侧：顶栏 + 主内容区 + 底部固定输入框 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">
          <div className="px-6 py-5">
          {/* 头部：各分区仅展示标题，不展示右上角操作按钮 */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-800">{sectionTitles[section]}</h1>
          </div>

          <div className="mt-5">
            {/* 全部生成：视频依次排列 */}
            {section === 'gen' && (
              <div>
                <div className="grid grid-cols-4 gap-3">
                  {generating && (
                    <div className="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50">
                      <div className="thumb-gradient h-full w-full rounded-xl opacity-40" />
                    </div>
                  )}
                  {sortedGens.map((g) => (
                    <GenCard
                      key={g.id}
                      g={g}
                      highlighted={g.id === highlightGenId}
                      onOpen={(item) => {
                        setPreviewGen(item)
                        setHighlightGenId(item.id)
                      }}
                    />
                  ))}
                </div>
                {sortedGens.length === 0 && !generating && (
                  <p className="py-16 text-center text-[13px] text-slate-400">还没有生成内容，在下方描述想法开始创作</p>
                )}
              </div>
            )}

            {section === 'brief' && <BriefPanel projectId={project.id} />}

            {/* 商品：品牌 + 产品双栏管理 */}
            {section === 'product' && (
              <div className="flex gap-4">
                {/* 左栏 */}
                <div className="flex w-60 shrink-0 flex-col gap-5">
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">品牌设置</p>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: project.color }} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">{project.name}</p>
                          <p className="text-[11px] text-slate-400">品牌主页</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => toast.info('视觉标识设置（演示）')} className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                      <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white">
                        {project.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-slate-800">视觉标识</span>
                        <span className="block text-[11px] text-slate-400">Logo / 主色 / 字体</span>
                      </span>
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">产品</p>
                    <button
                      onClick={() => {
                        setSelProductId(DRAFT_PRODUCT_ID)
                        setDraftKey((k) => k + 1)
                        toast.success('已新建空白产品卡，请填写信息')
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed p-2.5 transition-colors',
                        selProductId === DRAFT_PRODUCT_ID
                          ? 'border-sky-300 bg-sky-50 text-sky-600'
                          : 'border-slate-200 bg-white/60 text-slate-400 hover:border-sky-300 hover:text-sky-500',
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Plus className="h-4 w-4" />
                      </span>
                      <span className="text-[12.5px] font-medium">创建产品卡</span>
                    </button>
                    <div className="mt-2 space-y-1">
                      {projectProducts.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => setSelProductId(p.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors',
                            selProductId === p.id ? 'border-sky-200 bg-sky-50' : 'border-transparent hover:bg-slate-50',
                          )}
                        >
                          <Thumb className={cn('h-9 w-9 shrink-0 rounded-lg', i % 2 === 1 && '[filter:hue-rotate(40deg)]')}>
                            <ShoppingBag className="h-4 w-4 text-white/70" />
                          </Thumb>
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium text-slate-800">{p.name}</span>
                            <span className="block text-[11px] text-slate-400">{p.price} · {p.sales}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右栏：选中 / 新建产品卡详情 */}
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/70 p-5">
                  {selProductId === DRAFT_PRODUCT_ID ? (
                    <ProductForm key={`${DRAFT_PRODUCT_ID}-${draftKey}`} product={blankProduct(project.id)} isNew />
                  ) : projectProducts.find((p) => p.id === selProductId) ? (
                    <ProductForm key={selProductId} product={projectProducts.find((p) => p.id === selProductId)!} />
                  ) : (
                    <p className="py-20 text-center text-[13px] text-slate-400">暂无产品卡，点击左侧「创建产品卡」开始</p>
                  )}
                </div>
              </div>
            )}

            {/* 灵感库：默认推荐始终展示；文案随是否有产品卡变化 */}
            {section === 'inspire' && (
              <div>
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-[12.5px] text-sky-700">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {projectProducts.length > 0 ? (
                    <span>基于产品信息推荐近期爆款</span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <span>将基于产品信息推荐近期爆款</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSection('product')
                          setSelProductId(DRAFT_PRODUCT_ID)
                          setDraftKey((k) => k + 1)
                        }}
                        className="font-medium text-sky-600 underline underline-offset-2 transition-colors hover:text-sky-700"
                      >
                        去创建产品卡
                      </button>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                  {recs.map((v) => (
                    <InspirationHitCard
                      key={v.id}
                      item={v}
                      onRemake={() => {
                        setRemakeRef(toRemakeReference(v))
                        setRemakeBrief(REMAKE_PROMPT)
                        setRemakeKey((k) => k + 1)
                        setSection('gen')
                        toast.success('已填入项目创作输入框')
                      }}
                      onFavorite={() =>
                        toast.success('已收藏至素材库，点击查看', {
                          action: {
                            label: '查看',
                            onClick: () => navigate('/assets'),
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            {/* 账号管理 */}
            {section === 'account' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                      <th className="w-28 px-4 py-2.5 font-normal">平台</th>
                      <th className="px-2 py-2.5 font-normal">账号</th>
                      <th className="w-20 px-2 py-2.5 font-normal">粉丝</th>
                      <th className="w-16 px-2 py-2.5 font-normal">地区</th>
                      <th className="w-24 px-2 py-2.5 font-normal">状态</th>
                      <th className="w-24 px-2 py-2.5 font-normal">最近活跃</th>
                      <th className="w-28 px-4 py-2.5 text-right font-normal">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projectAccounts.length > 0 ? projectAccounts : accounts).map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-sky-50/40">
                        <td className="px-4 py-2.5"><PlatformBadge platform={a.platform} /></td>
                        <td className="px-2 py-2.5">
                          <div className="font-medium text-slate-700">{a.name}</div>
                          <div className="text-[11px] text-slate-400">{a.handle}</div>
                        </td>
                        <td className="px-2 py-2.5 text-slate-600">{a.followers}</td>
                        <td className="px-2 py-2.5 text-slate-500">{a.region}</td>
                        <td className="px-2 py-2.5">
                          <Badge className={cn('border-0 text-[10.5px]',
                            a.status === '正常' ? 'bg-emerald-50 text-emerald-600' :
                            a.status === '待授权' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-2.5 text-slate-400">{a.lastActive}</td>
                        <td className="px-4 py-2.5 text-right">
                          {a.status === '待授权' ? (
                            <Button size="sm" className="h-7 brand-gradient px-3 text-[11.5px] text-white hover:opacity-90" onClick={() => toast.success('已发送授权请求（演示）')}>去授权</Button>
                          ) : (
                            <button onClick={() => toast.info('账号详情（演示）')} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600">查看</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 发布管理 */}
            {section === 'publish' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                      <th className="px-4 py-2.5 font-normal">内容</th>
                      <th className="w-28 px-2 py-2.5 font-normal">平台</th>
                      <th className="w-28 px-2 py-2.5 font-normal">排期时间</th>
                      <th className="w-20 px-2 py-2.5 font-normal">状态</th>
                      <th className="w-36 px-4 py-2.5 text-right font-normal">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.map((g, i) => (
                      <tr key={g.id} className="border-b border-slate-50 last:border-0 hover:bg-sky-50/40">
                        <td className="max-w-72 truncate px-4 py-2.5 font-medium text-slate-700">{g.title}</td>
                        <td className="px-2 py-2.5"><PlatformBadge platform={g.platform} /></td>
                        <td className="px-2 py-2.5 text-slate-500">{['今天 20:00', '明天 09:30', '明天 18:00', '10-23 12:00', '10-24 20:00'][i % 5]}</td>
                        <td className="px-2 py-2.5"><Badge className={cn('border-0 text-[10.5px]', statusStyle[g.status])}>{g.status}</Badge></td>
                        <td className="px-4 py-2.5 text-right">
                          <Button size="sm" variant="outline" className="mr-1.5 h-7 border-slate-200 px-3 text-[11.5px] text-slate-500 hover:text-slate-900" onClick={() => toast.info('调整排期（演示）')}>改期</Button>
                          <Button size="sm" className="h-7 brand-gradient px-3 text-[11.5px] text-white hover:opacity-90" onClick={() => toast.success('已加入发布队列（演示）')}>发布</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {related.length === 0 && <p className="py-16 text-center text-[13px] text-slate-400">暂无待发布内容</p>}
              </div>
            )}

            {/* 数据归因 */}
            {section === 'attribution' && (
              <div className="grid grid-cols-5 gap-4">
                {/* 转化漏斗 */}
                <Card className="glass-card col-span-3 border-slate-200 p-5">
                  <h3 className="mb-4 text-[14px] font-medium text-slate-800">转化漏斗（近 30 天）</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: '曝光', value: '1,248,300', pct: 100, rate: null },
                      { label: '点击', value: '96,400', pct: 68, rate: 'CTR 7.7%' },
                      { label: '进站', value: '38,200', pct: 44, rate: '落地 39.6%' },
                      { label: '加购', value: '6,180', pct: 26, rate: '转化 16.2%' },
                      { label: '成交', value: '2,940', pct: 15, rate: '客单 $31.2' },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-3">
                        <span className="w-10 shrink-0 text-[12px] text-slate-500">{f.label}</span>
                        <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-50">
                          <div className="brand-gradient flex h-full items-center rounded-lg pl-3" style={{ width: `${f.pct}%`, opacity: 0.35 + f.pct / 160 }}>
                            <span className="text-[11.5px] font-medium text-white">{f.value}</span>
                          </div>
                        </div>
                        {f.rate && <span className="w-24 shrink-0 text-right text-[11px] text-slate-400">{f.rate}</span>}
                      </div>
                    ))}
                  </div>
                </Card>
                {/* 平台归因 */}
                <Card className="glass-card col-span-2 border-slate-200 p-5">
                  <h3 className="mb-4 text-[14px] font-medium text-slate-800">成交归因 · 按平台</h3>
                  <div className="space-y-4">
                    {project.platforms.map((p, i) => {
                      const shares = [46, 31, 19]
                      return (
                        <div key={p}>
                          <div className="mb-1 flex items-center justify-between text-[12px]">
                            <span className="flex items-center gap-1.5 text-slate-600"><PlatformBadge platform={p} /></span>
                            <span className="font-medium text-slate-700">{shares[i % 3]}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full" style={{ width: `${shares[i % 3]}%`, backgroundColor: platformColors[p] }} />
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">成交 {Math.round(2940 * shares[i % 3] / 100).toLocaleString()} 单</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-[11.5px] leading-relaxed text-sky-700">
                    TikTok 种草 → Instagram 复购路径贡献最高，建议加大 Reels 投放（演示洞察）
                  </div>
                </Card>
              </div>
            )}

            {/* 任务调度 */}
            {section === 'schedule' && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12.5px] text-slate-400">按排期自动发布到已绑定账号，失败自动重试并通知</p>
                  <Button size="sm" className="gap-1.5 brand-gradient text-[12px] text-white hover:opacity-90" onClick={() => toast.success('新建调度（演示）')}>
                    <Plus className="h-3.5 w-3.5" /> 新建调度
                  </Button>
                </div>
                <div className="space-y-2">
                  {projectTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full',
                        t.status === '发布中' ? 'bg-sky-500' : t.status === '待发布' ? 'bg-amber-400' :
                        t.status === '已完成' ? 'bg-emerald-500' : 'bg-rose-500')} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-slate-800">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
                          <CalendarClock className="h-3 w-3" /> {t.schedule}
                          <span className="flex gap-1">{t.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-slate-200 text-[11px] font-normal text-slate-500">{t.status}</Badge>
                      <div className="hidden w-32 shrink-0 md:block">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="brand-gradient h-full rounded-full" style={{ width: `${t.progress}%` }} />
                        </div>
                        <div className="mt-1 text-right text-[10.5px] text-slate-400">{t.progress}%</div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900" onClick={() => toast.info('调度详情（演示）')}>详情</Button>
                    </div>
                  ))}
                  {projectTasks.length === 0 && <p className="py-16 text-center text-[13px] text-slate-400">该项目暂无调度任务</p>}
                </div>
              </div>
            )}

            {/* 回收站 */}
            {section === 'trash' && (
              <div className="space-y-2">
                {deletedAssets.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-slate-700">{a.name}</div>
                      <div className="text-[11.5px] text-slate-400">{a.type} · {a.size} · 删除于 {a.updatedAt}</div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900" onClick={() => toast.success('已恢复（演示）')}>
                      <RotateCcw className="h-3.5 w-3.5" /> 恢复
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* 底部固定创作控制台：简报 / 产品卡 / 灵感库 不展示 */}
        {!hideConsoleSections.includes(section) && (
          <div className="shrink-0 bg-[#f5f8fb] px-6 pb-4 pt-2">
            <CreationConsole
              key={`${project.id}-${remakeKey}`}
              className="border border-slate-200 bg-white shadow-sm"
              placeholder={`为「${project.name}」描述场景，使用 @ 添加产品卡信息`}
              initialBrief={remakeBrief || seedBrief}
              initialReference={remakeRef}
              initialBatch={seedBatch}
              initialMode={seedMode}
              onStart={() => { setGenerating(true); setSection('gen') }}
              onDone={handleDone}
            />
          </div>
        )}

        {/* 生成内容预览 */}
        <Dialog open={!!previewGen} onOpenChange={(o) => { if (!o) setPreviewGen(null) }}>
          <DialogContent className="border-slate-200 bg-white p-0 sm:max-w-2xl overflow-hidden">
            {previewGen && (
              <>
                <div className="relative aspect-video w-full bg-slate-900">
                  <Thumb className="h-full w-full">
                    <button
                      type="button"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-sky-600 shadow-lg"
                      onClick={() => toast.success('正在播放（演示）')}
                    >
                      <Play className="h-6 w-6" fill="currentColor" />
                    </button>
                  </Thumb>
                  {previewGen.duration && (
                    <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white/90">
                      {previewGen.duration}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <DialogHeader>
                    <DialogTitle className="text-[16px] text-slate-800">{previewGen.title}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 text-[12.5px]">
                      <PlatformBadge platform={previewGen.platform} />
                      <span>{previewGen.type}</span>
                      <Badge className={cn('border-0 text-[10.5px]', statusStyle[previewGen.status])}>{previewGen.status}</Badge>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-slate-200"
                      onClick={() => setPreviewGen(null)}
                    >
                      关闭
                    </Button>
                    <Button
                      className="brand-gradient text-white hover:opacity-90"
                      onClick={() => {
                        toast.success('已加入发布任务（演示）')
                        setPreviewGen(null)
                      }}
                    >
                      去发布
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* 批量生成弹窗 */}
        <Dialog open={batchOpen} onOpenChange={(o) => { if (!batchRunning) setBatchOpen(o) }}>
          <DialogContent className="border-slate-200 bg-white p-6 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-[16px] text-slate-800">批量生成</DialogTitle>
              <DialogDescription className="text-[12.5px]">
                基于项目商品与主题，一次性生成多条内容并进入「全部生成」
              </DialogDescription>
            </DialogHeader>

            {batchDone === null ? (
              <div className="mt-2 space-y-4">
                {/* 数量 */}
                <div>
                  <div className="mb-1.5 text-[12.5px] font-medium text-slate-600">生成数量</div>
                  <div className="flex gap-1.5">
                    {[10, 20, 30].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBatchCount(n)}
                        className={cn(
                          'rounded-lg border px-4 py-1.5 text-[12.5px] transition-colors',
                          batchCount === n ? 'brand-gradient font-medium text-white' : 'border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600'
                        )}
                      >
                        {n} 条
                      </button>
                    ))}
                    <span className="ml-auto self-center text-[11.5px] text-slate-400">预计消耗 {batchCount * 20} 积分</span>
                  </div>
                </div>
                {/* 平台 */}
                <div>
                  <div className="mb-1.5 text-[12.5px] font-medium text-slate-600">发布平台（可多选）</div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setBatchPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                          batchPlatforms.includes(p) ? 'border-sky-300 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 主题 */}
                <div>
                  <div className="mb-1.5 text-[12.5px] font-medium text-slate-600">内容主题（可多选，不选则全部轮换）</div>
                  <div className="flex flex-wrap gap-1.5">
                    {batchThemeDefs.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setBatchThemes((prev) => prev.includes(t.key) ? prev.filter((x) => x !== t.key) : [...prev, t.key])}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                          batchThemes.includes(t.key) ? 'border-sky-300 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                        )}
                      >
                        {t.key}
                      </button>
                    ))}
                  </div>
                </div>

                {batchRunning ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-[12px] text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                        正在{batchStages[Math.min(batchStages.length - 1, Math.floor(batchProgress / 25))]} · 第 {Math.min(batchCount, Math.max(1, Math.ceil(batchProgress / 100 * batchCount)))} / {batchCount} 条
                      </span>
                      <span className="font-medium text-sky-600">{batchProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="brand-gradient h-full rounded-full transition-all duration-200" style={{ width: `${batchProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <Button onClick={runBatch} className="gap-2 brand-gradient px-6 text-white hover:opacity-90">
                      <Sparkles className="h-4 w-4" /> 开始批量生成
                    </Button>
                    <span className="text-[11.5px] text-slate-400">AI 将自动轮换商品与主题，生成不同角度版本</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                  </span>
                  <div className="mt-3 text-[14.5px] font-semibold text-slate-800">批量生成完成</div>
                  <p className="mt-1 text-[12.5px] text-slate-500">{batchDone} 条内容已加入「全部生成」，可在生成墙中预览并安排发布</p>
                  <div className="mt-4 flex gap-2.5">
                    <Button className="gap-2 brand-gradient px-5 text-white hover:opacity-90" onClick={() => { setBatchOpen(false); setSection('gen') }}>
                      查看结果
                    </Button>
                    <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-slate-900" onClick={() => { setBatchDone(null); setBatchProgress(0) }}>
                      再生成一批
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
