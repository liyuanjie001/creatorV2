import { useNavigate } from 'react-router'
import { Plus, Clock, MoreHorizontal, CheckCircle2, Loader2, CircleDashed, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { tasks, type TaskStatus, type Task } from '@/data/mock'
import { cn } from '@/lib/utils'

const columns: { status: TaskStatus; icon: typeof Loader2; tone: string }[] = [
  { status: '待发布', icon: CircleDashed, tone: 'text-sky-600' },
  { status: '发布中', icon: Loader2, tone: 'text-sky-600' },
  { status: '已完成', icon: CheckCircle2, tone: 'text-emerald-600' },
  { status: '已失败', icon: XCircle, tone: 'text-rose-600' },
]

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium leading-snug text-slate-900">{task.title}</div>
        <button className="rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1.5 text-[11px] text-slate-400">{task.id} · {task.project}</div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {task.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {task.schedule}
        </span>
        <span>{task.owner}</span>
      </div>
      {task.status === '发布中' && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>分发进度</span>
            <span className="text-slate-600">{task.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Tasks() {
  const navigate = useNavigate()
  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="任务管理"
        desc="内容分发流水线：创建任务 → 多平台排期 → 自动发布 → 数据回流"
        extra={
          <Button size="sm" className="gap-2 brand-gradient text-white hover:opacity-90" onClick={() => navigate('/tasks/new')}>
            <Plus className="h-4 w-4" /> 新建任务
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {columns.map(({ status, icon: Icon, tone }) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Icon className={cn('h-4 w-4', tone)} />
              <span className="text-[13px] font-medium text-slate-900">{status}</span>
              <Badge variant="outline" className="border-slate-200 bg-slate-100 text-[11px] text-slate-500">
                {count(status)}
              </Badge>
            </div>
            <div className="space-y-3">
              {tasks.filter((t) => t.status === status).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
              {count(status) === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-[12px] text-slate-300">
                  暂无任务
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
