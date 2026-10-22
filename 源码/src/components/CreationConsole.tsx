import { useState } from 'react'
import {
  Sparkles, ImagePlus, AtSign, FolderOpen, Monitor, RectangleHorizontal, Clock,
  Volume2, Layers, ChevronRight, Clapperboard, Image as ImageIcon, Wand2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { assetElements, type Platform } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

const pillOptions: Record<string, string[]> = {
  风格: ['电影感 · 高反差', '清新明亮', '复古胶片', '快节奏剪辑'],
  镜头: ['自动运镜', '第一人称', '环绕展示', '特写微距'],
  画幅: ['自动', '16:9', '9:16', '1:1'],
  色调: ['自动', '冷调清透', '暖调阳光', '高饱和'],
}

function ConsoleChip({ icon: Icon, value, onClick, title }: { icon: typeof Monitor; value: string; onClick?: () => void; title?: string }) {
  return (
    <button
      title={title}
      onClick={onClick ?? (() => toast.info(`${title ?? value}（演示）`))}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600"
    >
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="max-w-28 truncate">{value}</span>
    </button>
  )
}

export default function CreationConsole({
  onStart, onDone, placeholder, className,
}: {
  onStart: () => void
  onDone: (items: ConsoleDraft[]) => void
  placeholder?: string
  className?: string
}) {
  const [mode, setMode] = useState<'视频' | '图文'>('视频')
  const [brief, setBrief] = useState('')
  const [pills, setPills] = useState<Record<string, number>>({ 风格: 0, 镜头: 0, 画幅: 0, 色调: 0 })
  const [quality, setQuality] = useState('1080p')
  const [ratio, setRatio] = useState('16:9')
  const [duration, setDuration] = useState('15s')
  const [audio, setAudio] = useState(true)
  const [batch, setBatch] = useState(1)
  const [refCount, setRefCount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [draftIdx, setDraftIdx] = useState(0)

  const cycle = (key: string) =>
    setPills((p) => ({ ...p, [key]: (p[key] + 1) % pillOptions[key].length }))

  const generate = () => {
    if (generating) return
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

  return (
    <Card className={cn('glass-card rounded-2xl border-slate-200 p-3', className)}>
      <div className="flex gap-3">
        {/* 左侧模式切换 */}
        <div className="flex flex-col gap-1 border-r border-slate-100 pr-3">
          {([['视频', Clapperboard], ['图文', ImageIcon]] as const).map(([m, Icon]) => (
            <button
              key={m}
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
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* 参数 pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <ConsoleChip icon={ImagePlus} value={`参考图 ${refCount}/3`} title="上传参考图" onClick={() => setRefCount((c) => (c + 1) % 4)} />
            {Object.keys(pillOptions).map((key) => (
              <ConsoleChip key={key} icon={Wand2} value={pillOptions[key][pills[key]]} title={key} onClick={() => cycle(key)} />
            ))}
          </div>

          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={placeholder ?? (mode === '视频' ? '描述你的场景或产品，使用 @ 添加角色和地点…' : '描述你想要的图文内容，使用 @ 引用素材和模板…')}
            className="min-h-20 resize-none border-slate-200 bg-slate-50/70 text-[13.5px] placeholder:text-slate-400 focus-visible:ring-sky-300"
          />

          <div className="flex items-center gap-3">
            {/* 工具行 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <ConsoleChip icon={ImagePlus} value="参考" title="上传参考" onClick={() => setRefCount((c) => (c + 1) % 4)} />
              <ConsoleChip icon={AtSign} value="引用" title="引用元素" onClick={() => toast.info(`可引用：${assetElements.map((e) => e.name).join('、')}`)} />
              <ConsoleChip icon={FolderOpen} value="素材库" title="从素材库选择" onClick={() => toast.info('打开素材库（演示）')} />
              <button
                onClick={() => toast.info('切换生成引擎（演示）')}
                className="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-600 transition-colors hover:bg-sky-100"
              >
                <Sparkles className="h-3.5 w-3.5" /> 跨洋引擎 Pro <ChevronRight className="h-3 w-3" />
              </button>
              <ConsoleChip icon={Monitor} value={quality} title="分辨率" onClick={() => setQuality((q) => (q === '1080p' ? '4K' : '1080p'))} />
              <ConsoleChip icon={RectangleHorizontal} value={ratio} title="画幅比例" onClick={() => setRatio((r) => (r === '16:9' ? '9:16' : r === '9:16' ? '1:1' : '16:9'))} />
              {mode === '视频' && (
                <ConsoleChip icon={Clock} value={duration} title="时长" onClick={() => setDuration((d) => (d === '15s' ? '30s' : d === '30s' ? '60s' : '15s'))} />
              )}
              <ConsoleChip
                icon={Volume2} value={audio ? '配乐 开' : '配乐 关'} title="配乐"
                onClick={() => { setAudio(!audio); toast.success(audio ? '已关闭配乐' : '已开启配乐') }}
              />
              <ConsoleChip icon={Layers} value={`批量 ${batch}/3`} title="批量生成" onClick={() => setBatch((b) => (b % 3) + 1)} />
            </div>

            {/* 生成按钮 */}
            <button
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
    </Card>
  )
}
