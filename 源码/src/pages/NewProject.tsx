import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Sparkles, Check, Loader2, Globe, Plus, X, Upload, RotateCcw, ArrowRight, Wand2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { platforms, type Platform } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BrandKit {
  name: string
  website: string
  colors: string[]
  sellingPoints: string[]
  style: string
  fonts: string
  audience: string
  description: string
  socials: string
}

const emptyKit: BrandKit = {
  name: '', website: '', colors: [], sellingPoints: [],
  style: '', fonts: '', audience: '', description: '', socials: '',
}

const aiKit: BrandKit = {
  name: 'GlowUp Skincare',
  website: 'glowupbeauty.com',
  colors: ['#0ea5e9', '#f472b6', '#f8fafc', '#0f172a'],
  sellingPoints: ['14 天淡化痘印', '皮肤科测试认证', '满 $50 免运费', '30 天无理由退换'],
  style: '极简、柔和色调、自然光',
  fonts: 'Playfair Display（标题）+ Inter（正文）',
  audience: '25-34 岁北美女性，关注成分与性价比',
  description: 'GlowUp 是面向北美市场的功效护肤品牌，主打烟酰胺焕肤精华，以临床实证成分与平价策略区别于大牌。',
  socials: 'instagram.com/glowup.beauty · tiktok.com/@glowup.official',
}

const palette = ['#11a3fd', '#1769ff', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6', '#0f172a', '#64748b']

const aiPlan: {
  platforms: { name: Platform; reason: string }[]
  contentDirection: string[]
  schedule: { phase: string; time: string; desc: string }[]
  kpi: { label: string; value: string }[]
} = {
  platforms: [
    { name: 'TikTok', reason: '美妆品类 CTR 最高，#skincare 热度 +38%' },
    { name: 'Instagram', reason: 'before/after 图文转化效果好' },
    { name: 'YouTube', reason: '承接长测评，提升搜索权重' },
  ],
  contentDirection: [
    '以「成分党实测」为主线，前 3 秒产品特写强钩子',
    '搭配 2 条 before/after 对比短片 + 1 条 60 秒深度测评',
    '口播使用美式英语，字幕同步西语覆盖拉美裔人群',
  ],
  schedule: [
    { phase: '预热期', time: '第 1-3 天', desc: '悬念短片 × 3，铺品牌话题' },
    { phase: '爆发期', time: '第 4-7 天', desc: '实测视频日更，KOL 合拍跟进' },
    { phase: '长尾期', time: '第 8-14 天', desc: 'UGC 二创切片，Coupon 导流' },
  ],
  kpi: [
    { label: '预期曝光', value: '350K+' },
    { label: '目标互动率', value: '≥ 6%' },
    { label: '发布内容量', value: '12-15 条' },
  ],
}

function Field({ label, hint, ai, children }: {
  label: string; hint?: string; ai?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[12.5px] font-medium text-slate-600">{label}</label>
        {ai && <Badge className="border-0 bg-sky-50 px-1.5 py-0 text-[10px] text-sky-600">AI 填写</Badge>}
      </div>
      {children}
      {hint && <p className="text-[11.5px] text-slate-400">{hint}</p>}
    </div>
  )
}

export default function NewProject() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<'entry' | 'form'>('entry')
  const [analyzing, setAnalyzing] = useState(false)
  const [kit, setKit] = useState<BrandKit>(emptyKit)
  const [planOn, setPlanOn] = useState(false)
  const [picked, setPicked] = useState<Platform[]>([])
  const [spInput, setSpInput] = useState('')

  const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) => setKit((s) => ({ ...s, [k]: v }))

  const analyze = (manual: boolean) => {
    if (manual) {
      setKit(emptyKit)
      setPlanOn(false)
      setPicked([])
      setMode('form')
      return
    }
    if (!url.trim()) {
      toast.error('请输入网站链接')
      return
    }
    setAnalyzing(true)
    setTimeout(() => {
      setKit({ ...aiKit, website: url.trim() })
      setPicked(aiPlan.platforms.map((p) => p.name))
      setPlanOn(true)
      setAnalyzing(false)
      setMode('form')
      toast.success('AI 已分析网站并生成品牌套件', { description: '所有内容均可编辑，确认后创建项目' })
    }, 1800)
  }

  const completePlan = () => {
    setPicked(aiPlan.platforms.map((p) => p.name))
    setPlanOn(true)
    toast.success('AI 已补全宣发方案')
  }

  const togglePlatform = (p: Platform) =>
    setPicked(picked.includes(p) ? picked.filter((x) => x !== p) : [...picked, p])

  const create = () => {
    if (!kit.name.trim()) {
      toast.error('请填写品牌名称')
      return
    }
    toast.success('项目创建成功（演示）', { description: `${kit.name} · 已加入分发队列` })
    navigate('/')
  }

  /* ---------- 入口：输入网站 ---------- */
  if (mode === 'entry') {
    return (
      <div className="mx-auto max-w-xl pt-14">
        <div className="mb-8 text-center">
          <Badge className="mb-4 border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-600">
            ✦ AI 创建
          </Badge>
          <h1 className="text-2xl font-semibold text-slate-800">输入你的网站</h1>
          <p className="mt-2 text-[13.5px] text-slate-500">我们将分析你的业务并生成品牌套件与宣发方案</p>
        </div>
        <Card className="glass-card space-y-3 border-white/[0.07] p-4">
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze(false)}
              placeholder="www.yourwebsite.com"
              className="h-11 border-slate-200 bg-slate-50 pl-10 text-[14px] focus-visible:ring-sky-300"
            />
          </div>
          <Button
            disabled={analyzing}
            onClick={() => analyze(false)}
            className="h-11 w-full gap-2 brand-gradient text-[14px] text-white hover:opacity-90"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? 'AI 正在分析你的网站…' : 'AI 分析并创建项目'}
          </Button>
        </Card>
        <div className="my-5 flex items-center gap-3 text-[12px] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />或<span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button
          variant="outline"
          onClick={() => analyze(true)}
          className="h-11 w-full border-slate-200 bg-white text-[14px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
        >
          手动创建品牌套件
        </Button>
      </div>
    )
  }

  /* ---------- 品牌套件表单 ---------- */
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="创建你的品牌套件"
        desc="这里的一切都会影响你的宣发内容，所有字段均可编辑"
        extra={
          <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-500 hover:text-slate-800" onClick={() => { setMode('entry'); setUrl('') }}>
            <RotateCcw className="h-3.5 w-3.5" /> 重新开始
          </Button>
        }
      />

      <div className="grid grid-cols-5 gap-5">
        {/* 左列：基础信息 */}
        <Card className="glass-card col-span-2 h-fit space-y-4 border-white/[0.07] p-5">
          <Field label="品牌名称" ai={!!kit.name}>
            <Input value={kit.name} onChange={(e) => set('name', e.target.value)} placeholder="你的品牌名称" className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
          </Field>
          <Field label="网站" ai={!!kit.website}>
            <Input value={kit.website} onChange={(e) => set('website', e.target.value)} placeholder="www.yourwebsite.com" className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
          </Field>
          <Field label="Logo" hint="用于视频片尾与广告角标">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-6 text-[12.5px] text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500">
              <Upload className="h-4 w-4" /> 上传 Logo
            </button>
          </Field>
          <Field label="品牌色" ai={kit.colors.length > 0}>
            <div className="flex flex-wrap items-center gap-2">
              {kit.colors.map((c) => (
                <span key={c} className="group relative h-8 w-8 rounded-full border border-slate-200" style={{ backgroundColor: c }}>
                  <button
                    onClick={() => set('colors', kit.colors.filter((x) => x !== c))}
                    className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-700 text-white group-hover:flex"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {kit.colors.length < 6 && (
                <div className="flex gap-1.5">
                  {palette.filter((c) => !kit.colors.includes(c)).slice(0, 4).map((c) => (
                    <button
                      key={c}
                      title={`添加 ${c}`}
                      onClick={() => set('colors', [...kit.colors, c])}
                      className="h-8 w-8 rounded-full border border-dashed border-slate-300 transition-transform hover:scale-110"
                      style={{ backgroundColor: `${c}33` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Field>
        </Card>

        {/* 右列：品牌属性 */}
        <Card className="glass-card col-span-3 h-fit space-y-4 border-white/[0.07] p-5">
          <Field label="卖点" hint="用户购买的主要理由，例如：满 $50 免运费" ai={kit.sellingPoints.length > 0}>
            <div className="flex flex-wrap items-center gap-1.5">
              {kit.sellingPoints.map((s) => (
                <span key={s} className="group inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[12px] text-sky-700">
                  {s}
                  <button onClick={() => set('sellingPoints', kit.sellingPoints.filter((x) => x !== s))} className="text-sky-300 hover:text-sky-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={spInput}
                  onChange={(e) => setSpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && spInput.trim()) {
                      set('sellingPoints', [...kit.sellingPoints, spInput.trim()])
                      setSpInput('')
                    }
                  }}
                  placeholder="添加卖点，回车确认"
                  className="h-7 w-40 border-slate-200 bg-white text-[12px] focus-visible:ring-sky-300"
                />
                <button
                  onClick={() => { if (spInput.trim()) { set('sellingPoints', [...kit.sellingPoints, spInput.trim()]); setSpInput('') } }}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="美学风格" hint="风格调性，例如：极简、柔和色调、自然光" ai={!!kit.style}>
              <Input value={kit.style} onChange={(e) => set('style', e.target.value)} className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
            </Field>
            <Field label="字体" hint="例如 Playfair Display 和 Inter" ai={!!kit.fonts}>
              <Input value={kit.fonts} onChange={(e) => set('fonts', e.target.value)} className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
            </Field>
          </div>
          <Field label="受众" hint="宣发内容面向谁" ai={!!kit.audience}>
            <Input value={kit.audience} onChange={(e) => set('audience', e.target.value)} className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
          </Field>
          <Field label="品牌描述" hint="品牌卖什么、面向谁、有什么不同" ai={!!kit.description}>
            <Textarea value={kit.description} onChange={(e) => set('description', e.target.value)} className="min-h-20 border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
          </Field>
          <Field label="社交账号" hint="Instagram、TikTok 或其他主页链接" ai={!!kit.socials}>
            <Input value={kit.socials} onChange={(e) => set('socials', e.target.value)} className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
          </Field>
        </Card>
      </div>

      {/* AI 宣发方案 */}
      {planOn ? (
        <>
          <div className="flex items-center gap-2 pt-1">
            <Wand2 className="h-4 w-4 text-sky-500" />
            <h3 className="text-[15px] font-medium text-slate-800">AI 宣发方案</h3>
            <Badge className="border-0 bg-sky-50 text-[11px] text-sky-600">可调整</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="glass-card col-span-2 border-white/[0.07] p-5">
              <h4 className="mb-3 text-[14px] font-medium text-slate-800">推荐平台与理由</h4>
              <div className="space-y-2">
                {aiPlan.platforms.map(({ name, reason }) => (
                  <button
                    key={name}
                    onClick={() => togglePlatform(name)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors',
                      picked.includes(name) ? 'border-sky-400 bg-sky-50' : 'border-slate-200 opacity-55 hover:opacity-80'
                    )}
                  >
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded border', picked.includes(name) ? 'brand-gradient border-transparent' : 'border-slate-300')}>
                      {picked.includes(name) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <PlatformBadge platform={name} />
                    <span className="text-[12px] text-slate-500">{reason}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                <span className="text-[11.5px] text-slate-400">追加：</span>
                {platforms.filter((p) => !aiPlan.platforms.some((a) => a.name === p)).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                      picked.includes(p) ? 'border-sky-400 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                    )}
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </Card>
            <div className="space-y-4">
              <Card className="glass-card border-white/[0.07] p-5">
                <h4 className="mb-2.5 text-[14px] font-medium text-slate-800">内容方向</h4>
                <ul className="space-y-2">
                  {aiPlan.contentDirection.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-600">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-semibold text-sky-600">{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="glass-card border-white/[0.07] p-5">
                <h4 className="mb-2.5 text-[14px] font-medium text-slate-800">发布排期（14 天）</h4>
                <div className="space-y-2.5">
                  {aiPlan.schedule.map((s) => (
                    <div key={s.phase} className="flex gap-2.5">
                      <span className="brand-gradient mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                      <div>
                        <div className="text-[12.5px] font-medium text-slate-700">
                          {s.phase} <span className="font-normal text-slate-400">{s.time}</span>
                        </div>
                        <div className="text-[11.5px] text-slate-500">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={completePlan}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 py-5 text-[13.5px] text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          <Sparkles className="h-4 w-4" /> 用 AI 补全宣发方案（平台 / 内容方向 / 排期 / KPI）
        </button>
      )}

      {/* 底部 */}
      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-sky-100 bg-white/90 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur">
        <p className="text-[12.5px] text-slate-500">
          {planOn
            ? <>将创建 <span className="font-medium text-slate-800">{kit.name || '未命名品牌'}</span> 项目，绑定 {picked.length} 个平台，预计生成 12-15 条内容</>
            : <>创建 <span className="font-medium text-slate-800">{kit.name || '未命名品牌'}</span> 品牌套件，宣发方案可稍后再补</>}
        </p>
        <Button onClick={create} className="gap-2 brand-gradient text-white hover:opacity-90">
          创建项目 <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
