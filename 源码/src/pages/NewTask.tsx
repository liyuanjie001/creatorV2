import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { projects, accounts, platforms, type Platform } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function NewTask() {
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState(projects[0].id)
  const [pickedPlatforms, setPickedPlatforms] = useState<Platform[]>(['TikTok'])
  const [pickedAccounts, setPickedAccounts] = useState<string[]>(['A-01'])

  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const submit = () => {
    toast.success('任务创建成功（演示）', { description: '已加入发布队列，可在任务管理中查看' })
    navigate('/tasks')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="新建任务"
        desc="为项目创建一条跨平台分发任务"
        extra={
          <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-500 hover:text-slate-800" onClick={() => navigate('/tasks')}>
            <ChevronLeft className="h-3.5 w-3.5" /> 返回任务管理
          </Button>
        }
      />

      <Card className="glass-card space-y-5 border-white/[0.07] p-6">
        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-600">任务名称</label>
          <Input placeholder="例如：精华实测视频 · 美区晚间档" className="border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-600">所属项目</label>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                  projectId === p.id ? 'border-sky-400 bg-sky-50 font-medium text-sky-600' : 'border-slate-200 text-slate-500 hover:text-slate-800'
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-600">分发平台</label>
          <div className="grid grid-cols-6 gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => toggle(pickedPlatforms, setPickedPlatforms, p)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[12.5px] transition-colors',
                  pickedPlatforms.includes(p)
                    ? 'border-sky-400 bg-sky-50 font-medium text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                )}
              >
                {pickedPlatforms.includes(p) && <Check className="h-3.5 w-3.5" />}
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-600">发布账号</label>
          <div className="space-y-2">
            {accounts.filter((a) => pickedPlatforms.includes(a.platform)).map((a) => (
              <button
                key={a.id}
                onClick={() => toggle(pickedAccounts, setPickedAccounts, a.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors',
                  pickedAccounts.includes(a.id) ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <span className={cn('flex h-4 w-4 items-center justify-center rounded border', pickedAccounts.includes(a.id) ? 'brand-gradient border-transparent' : 'border-slate-300')}>
                  {pickedAccounts.includes(a.id) && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="text-[13px] text-slate-700">{a.name}</span>
                <span className="text-[11px] text-slate-400">{a.handle}</span>
                <span className="ml-auto"><PlatformBadge platform={a.platform} /></span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-slate-600">发布时间</label>
            <Input type="datetime-local" defaultValue="2026-10-22T20:00" className="border-slate-200 bg-white text-[13px] text-slate-600 focus-visible:ring-sky-300" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-slate-600">引用素材</label>
            <Input placeholder="从素材库选择，或粘贴链接" className="border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-600">内容说明</label>
          <Textarea
            placeholder="给 AI 的生成指令，例如：前 3 秒产品特写，口播美式英语，突出 14 天实测数据…"
            className="min-h-24 border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
          />
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-[12px] leading-relaxed text-slate-600">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />
          AI 将根据任务说明生成脚本与素材变体，按所选账号的时区在排期时间自动分发。
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/tasks')} className="border-slate-200 text-slate-500 hover:text-slate-800">
          取消
        </Button>
        <Button onClick={submit} className="gap-2 brand-gradient text-white hover:opacity-90">
          创建任务
        </Button>
      </div>
    </div>
  )
}
