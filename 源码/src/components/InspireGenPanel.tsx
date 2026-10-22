import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Sparkles, Send, Check, Copy, RefreshCw, TrendingUp, User, ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlatformBadge } from '@/components/shared'
import { type Platform, addIdeaNote } from '@/data/mock'
import { toast } from 'sonner'

/* ---------------- AI 整理结果（演示数据池） ---------------- */

interface OrganizedIdea {
  title: string
  positioning: string
  sellingPoints: string[]
  recommendPlatforms: Platform[]
  format: string
  hooks: string[]
  tags: string[]
  insight: string
}

const variants: OrganizedIdea[] = [
  {
    title: '「户外移动咖啡馆」—— 便携咖啡机露营场景系列',
    positioning: '面向北美 25-35 岁户外爱好者，把「现磨咖啡」从厨房搬到营地，主打便携与仪式感',
    sellingPoints: [
      '3 分钟现磨：比速溶好喝，比手冲省事，营地一键出品',
      '便携收纳：整机 680g，比保温杯还轻，背包侧袋直接塞',
      '出片属性：清晨雾气 + 咖啡蒸汽，天然自带氛围感镜头',
    ],
    recommendPlatforms: ['TikTok', 'Instagram', 'YouTube'],
    format: '短视频（15-30s）+ 图文补充',
    hooks: [
      '「我赌你在营地没喝过这个」—— 悬念开场，第 3 秒给咖啡出品特写',
      'Before/After：速溶 vs 现磨的晨间对比，评论区引导「装备清单」',
      'ASMR 冲泡音 + 篝火白噪音，弱文案强氛围，适合晚间流量池',
    ],
    tags: ['#VanLife', '#CampingCoffee', '#OutdoorLiving', '#咖啡日常'],
    insight: '近 7 天 #CampingCoffee 话题热度上升 42%，竞品内容多为硬广，真实场景感是差异化缺口',
  },
  {
    title: '「办公室第三空间」—— 桌面氛围好物系列',
    positioning: '面向都市白领的办公桌改造内容，把产品植入「高效 + 治愈」的工位场景',
    sellingPoints: [
      '场景共鸣：复刻打工人真实工位，代入感强于棚拍',
      '功能可视化：用「一天的时间线」自然带出 3 个使用 moment',
      '低成本高频率：单场景可批量产出，适合日更账号',
    ],
    recommendPlatforms: ['TikTok', 'X', 'Instagram'],
    format: '剧情短片（30-45s）+ Thread 长帖',
    hooks: [
      '「老板以为我在摸鱼，其实我在……」—— 反转结构，结尾亮产品',
      '「🧵 1/6」拆解我工位上被问爆的 5 个好物，第 4 个是主角',
      '周五 18:00 发「下班仪式感」，蹭周末前情绪流量高峰',
    ],
    tags: ['#DeskSetup', '#OfficeLife', '#打工人', '#工位改造'],
    insight: '#DeskSetup 在欧美职场人群中长期稳定，周四-周五互动率比均值高 18%',
  },
  {
    title: '「一机多用」—— 家用投影仪全家桶场景',
    positioning: '从「参数测评」转向「生活方式提案」，覆盖租房青年、亲子家庭、游戏玩家三类人群',
    sellingPoints: [
      '人群分层：同一产品 3 套脚本，精准匹配不同受众痛点',
      '对比锚点：「电视 vs 投影」的空间对比图直观且有传播性',
      '节点借势：黑五 + 圣诞双节点，促销内容可提前 3 周蓄水',
    ],
    recommendPlatforms: ['YouTube', 'TikTok', 'Facebook'],
    format: '测评长视频（5-8min）+ Shorts 切片',
    hooks: [
      '「租房党别买电视了」—— 人群标签开场，3 秒锁定目标观众',
      '一家三口星空顶之夜：亲子场景弱卖点强情感，女性用户转化高',
      '「200 刀能买到什么投影？」—— 价格锚点开头，中段插入实测',
    ],
    tags: ['#HomeCinema', '#Projector', '#MovieNight', '#黑五攻略'],
    insight: 'YouTube 投影类测评视频平均完播率 41%，「价格锚点」类标题 CTR 高出均值 26%',
  },
]

const quickPrompts = ['便携咖啡机推给北美露营人群', '办公桌改造，想日更', '投影仪黑五预热']

interface ChatMsg {
  id: number
  role: 'user' | 'ai'
  text: string
  idea?: OrganizedIdea
}

/* ---------------- AI 方案卡片 ---------------- */

function IdeaCard({ idea, onAdopt }: { idea: OrganizedIdea; onAdopt: () => void }) {
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Badge className="border border-sky-200 bg-sky-50 text-[10.5px] font-medium text-sky-600">AI 整理 · 待确认</Badge>
        <span className="text-[11px] text-slate-300">已自动保存到妙记</span>
      </div>
      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug text-slate-800">{idea.title}</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{idea.positioning}</p>

      <div className="mt-3 space-y-1.5">
        {idea.sellingPoints.map((s) => (
          <div key={s} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-600">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
            {s}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {idea.recommendPlatforms.map((p) => <PlatformBadge key={p} platform={p} />)}
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-600">{idea.format}</Badge>
      </div>

      <div className="mt-3 space-y-1.5">
        {idea.hooks.map((h) => (
          <button
            key={h}
            onClick={() => { navigator.clipboard?.writeText(h); toast.success('已复制钩子文案') }}
            className="group flex w-full items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-left text-[12px] leading-relaxed text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50/60"
          >
            <span className="flex-1">{h}</span>
            <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500" />
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {idea.tags.map((t) => (
          <Badge key={t} variant="outline" className="border-slate-200 bg-white text-[10.5px] font-normal text-sky-600">{t}</Badge>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11.5px] leading-relaxed text-emerald-700">
        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {idea.insight}
      </div>

      <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
        <Button size="sm" onClick={onAdopt} className="gap-1.5 brand-gradient px-4 text-[12.5px] text-white hover:opacity-90">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> 采纳，去创作
        </Button>
        <Button
          size="sm" variant="outline"
          className="gap-1.5 border-slate-200 text-[12.5px] text-slate-600 hover:text-slate-900"
          onClick={() => toast.info('已重新整理（演示）')}
        >
          <RefreshCw className="h-3.5 w-3.5" /> 换个思路
        </Button>
      </div>
    </div>
  )
}

/* ---------------- 对话式主组件 ---------------- */

export default function InspireGenPanel({ onConfirm }: { onConfirm?: () => void }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 0,
      role: 'ai',
      text: '你好，我是灵感助手 👋 把脑海里零碎的想法直接发给我就行 —— 产品、人群、场景、时间节点都可以，不用完整，我来帮你整合、补充成一份可执行的宣发方案。',
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [round, setRound] = useState(0)
  const idRef = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, thinking])

  const send = (text?: string) => {
    const value = (text ?? input).trim()
    if (!value || thinking) return
    setInput('')
    setThinking(true)
    const userMsg: ChatMsg = { id: idRef.current++, role: 'user', text: value }
    setMessages((prev) => [...prev, userMsg])

    setTimeout(() => {
      const idea = variants[round % variants.length]
      setRound((r) => r + 1)
      const aiMsg: ChatMsg = {
        id: idRef.current++,
        role: 'ai',
        text: `收到！基于你提到的「${value.length > 24 ? value.slice(0, 24) + '…' : value}」，我补充了人群、平台与钩子结构，整理出下面这套方案，可以直接采纳或继续追问调整：`,
        idea,
      }
      setMessages((prev) => [...prev, aiMsg])
      setThinking(false)

      /* 自动保存到妙记 */
      const now = new Date()
      const time = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      addIdeaNote({
        id: `N-${now.getTime()}`,
        title: idea.title.split('——')[0].replace(/[「」]/g, '').trim() || idea.title.slice(0, 16),
        summary: idea.positioning,
        time,
        platforms: idea.recommendPlatforms,
        messages: [
          { role: 'user', text: value },
          { role: 'ai', text: `${idea.title}：${idea.positioning}。推荐 ${idea.recommendPlatforms.join(' / ')}，形式 ${idea.format}。` },
        ],
      })
      toast.success('已自动保存到妙记')
    }, 1400)
  }

  const adopt = () => {
    toast.success('已采纳，灵感已同步到自由创作')
    if (onConfirm) onConfirm()
    else navigate('/create')
  }

  return (
    <div className="flex h-[58vh] flex-col">
      {/* 消息区 */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scroll-slim rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        {messages.map((m) => (
          <div key={m.id} className={cnRow(m.role)}>
            <span className={cnAvatar(m.role)}>
              {m.role === 'ai' ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0">
              <p className={cnBubble(m.role)}>{m.text}</p>
              {m.idea && <IdeaCard idea={m.idea} onAdopt={adopt} />}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-start gap-2.5">
            <span className={cnAvatar('ai')}>
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0.15s' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* 快捷提问 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11.5px] text-slate-400">试试：</span>
        {quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
          >
            {q}
          </button>
        ))}
        <button
          onClick={() => navigate('/notes')}
          className="ml-auto flex items-center gap-1 text-[11.5px] text-slate-400 transition-colors hover:text-sky-600"
        >
          查看妙记 <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* 输入区 */}
      <div className="mt-2 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
          placeholder="描述你的零碎想法，回车发送…"
          className="h-11 flex-1 border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
        />
        <Button onClick={() => send()} disabled={thinking || !input.trim()} className="h-11 gap-2 brand-gradient px-5 text-white hover:opacity-90">
          <Send className="h-4 w-4" /> 发送
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-300">
        每次对话生成的方案会自动保存到「妙记」，可在创意中心下方查看
      </p>
    </div>
  )
}

function cnRow(role: 'user' | 'ai') {
  return role === 'ai' ? 'flex items-start gap-2.5' : 'flex flex-row-reverse items-start gap-2.5'
}

function cnAvatar(role: 'user' | 'ai') {
  return role === 'ai'
    ? 'brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white'
    : 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500'
}

function cnBubble(role: 'user' | 'ai') {
  return role === 'ai'
    ? 'inline-block max-w-full rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700'
    : 'inline-block max-w-full rounded-xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white'
}
