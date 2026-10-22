import { useState } from 'react'
import { useNavigate } from 'react-router'
import { NotebookPen, Sparkles, User, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { loadIdeaNotes, type IdeaNote } from '@/data/mock'
import { toast } from 'sonner'

export function NotesPanel({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<IdeaNote[]>(() => loadIdeaNotes())
  const [active, setActive] = useState<IdeaNote | null>(null)

  const remove = (id: string) => {
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    try { localStorage.setItem('chuhai-idea-notes', JSON.stringify(next)) } catch { /* 忽略 */ }
    toast.success('已删除该妙记')
  }

  return (
    <div>
      {!embedded && (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient shadow-md shadow-sky-300/40">
            <NotebookPen className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">妙记</h1>
            <p className="text-[12px] text-slate-400">AI 灵感生成的对话自动保存在这里，随时回看你的想法</p>
          </div>
        </div>
      )}
      <div className={embedded ? 'flex justify-end' : 'hidden'}>
        <Button
          size="sm" className="gap-2 brand-gradient px-4 text-white hover:opacity-90"
          onClick={() => window.dispatchEvent(new CustomEvent('open-inspire'))}
        >
          <Sparkles className="h-3.5 w-3.5" /> 去聊一条
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <NotebookPen className="h-6 w-6 text-slate-400" />
          </span>
          <p className="mt-4 text-[14px] font-medium text-slate-700">还没有妙记</p>
          <p className="mt-1 text-[12.5px] text-slate-400">点击顶栏「AI 灵感生成」，聊完的方案会自动存到这里</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n)}
              className="glass-card group rounded-2xl border-slate-200 p-5 text-left transition-shadow hover:shadow-md hover:shadow-slate-200/60"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                <span className="text-[11px] text-slate-400">{n.time}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                  className="ml-auto rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <h3 className="mt-2.5 truncate text-[14.5px] font-semibold text-slate-800">{n.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">{n.summary}</p>
              <div className="mt-3 flex items-center gap-1.5">
                {n.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="border-sky-200 bg-sky-50 text-[10.5px] font-normal text-sky-600">{p}</Badge>
                ))}
                <span className="ml-auto flex items-center gap-0.5 text-[11.5px] text-sky-500 opacity-0 transition-opacity group-hover:opacity-100">
                  查看对话 <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 对话详情 */}
      <Dialog open={!!active} onOpenChange={(open) => { if (!open) setActive(null) }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto scroll-slim border-slate-200 bg-white p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] text-slate-800">{active?.title}</DialogTitle>
            <DialogDescription className="text-[12px]">{active?.time} · 来自 AI 灵感生成</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {active?.messages.map((m, i) => (
              <div key={i} className={m.role === 'ai' ? 'flex items-start gap-2.5' : 'flex flex-row-reverse items-start gap-2.5'}>
                <span className={m.role === 'ai'
                  ? 'brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white'
                  : 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500'}
                >
                  {m.role === 'ai' ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </span>
                <p className={m.role === 'ai'
                  ? 'inline-block rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700'
                  : 'inline-block rounded-xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white'}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <Button
            className="mt-6 w-full gap-2 brand-gradient text-white hover:opacity-90"
            onClick={() => navigate('/create')}
          >
            <Sparkles className="h-4 w-4" /> 基于这条妙记去创作
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* 独立页面（直达路由），内容即创意中心的妙记页签 */
export default function Notes() {
  return <NotesPanel />
}
