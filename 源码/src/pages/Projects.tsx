import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Plus, ArrowRight, Pin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, PlatformBadge } from '@/components/shared'
import ProjectActions from '@/components/ProjectActions'
import { loadProjects, type Project } from '@/data/mock'
import { cn } from '@/lib/utils'

const statusStyle: Record<string, string> = {
  进行中: 'bg-sky-50 text-sky-600',
  未开始: 'bg-slate-100 text-slate-500',
  已结束: 'bg-emerald-50 text-emerald-600',
}

export default function Projects() {
  const [list, setList] = useState<Project[]>(() => loadProjects())
  useEffect(() => {
    const refresh = () => setList(loadProjects())
    refresh()
    window.addEventListener('chuhai-projects-changed', refresh)
    return () => window.removeEventListener('chuhai-projects-changed', refresh)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="全部项目"
        desc="跨平台宣发项目的统一视图"
        extra={
          <Link to="/projects/new">
            <Button size="sm" className="gap-2 brand-gradient text-white hover:opacity-90">
              <Plus className="h-4 w-4" /> 新建项目
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {list.map((p) => (
          <Card key={p.id} className="glass-card group relative border-white/[0.07] p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-9 w-9 shrink-0 rounded-xl" style={{ backgroundColor: `${p.color}1a` }}>
                  <span className="flex h-full w-full items-center justify-center">
                    <span className="h-3.5 w-3.5 rounded-[5px]" style={{ backgroundColor: p.color }} />
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[14.5px] font-semibold text-slate-800">{p.name}</div>
                    {p.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-sky-500 text-sky-500" />}
                  </div>
                  <div className="text-[11.5px] text-slate-400">负责人 {p.owner} · {p.start} ~ {p.end}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge className={cn('border-0 text-[11px]', statusStyle[p.status])}>{p.status}</Badge>
                <ProjectActions project={p} className="opacity-100" />
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">{p.desc}</p>

            <div className="mt-3 flex items-center gap-1.5">
              {p.platforms.map((pl) => <PlatformBadge key={pl} platform={pl} />)}
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11.5px] text-slate-400">
                <span>整体进度</span>
                <span className="font-medium text-slate-600">{p.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="brand-gradient h-full rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] text-slate-400">
              <span>曝光 <span className="font-medium text-slate-700">{p.exposure}</span></span>
              <span>互动 <span className="font-medium text-slate-700">{p.engagement}</span></span>
              <span>内容 <span className="font-medium text-slate-700">{p.contentCount} 条</span></span>
              <Link to={`/projects/${p.id}`} className="flex items-center gap-0.5 font-medium text-sky-600 hover:text-sky-500">
                详情 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
