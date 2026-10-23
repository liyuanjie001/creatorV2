import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router'
import {
  Lightbulb,
  Sparkles,
  FolderOpen,
  Users,
  BarChart3,
  Search,
  Orbit,
  ChevronRight,
  Coins,
  Pin,
  Plus,
} from 'lucide-react'
import ProjectActions from '@/components/ProjectActions'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addProject, createNamedProject, loadProjects, type Project } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/create', label: '自由创作', icon: Sparkles },
  { to: '/assets', label: '素材库', icon: FolderOpen },
  { to: '/inspiration', label: '创意中心', icon: Lightbulb },
  { to: '/accounts', label: '账号管理', icon: Users },
  { to: '/analytics', label: '数据分析', icon: BarChart3 },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projectList, setProjectList] = useState<Project[]>(() => loadProjects())
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  function submitNewProject() {
    const name = newName.trim()
    if (!name) {
      toast.error('请输入项目名称')
      return
    }
    const project = createNamedProject(name)
    addProject(project)
    setCreateOpen(false)
    setNewName('')
    toast.success(`已创建项目「${project.name}」`)
    navigate(`/projects/${project.id}`)
  }

  useEffect(() => {
    const refresh = () => setProjectList(loadProjects())
    refresh()
    window.addEventListener('chuhai-projects-changed', refresh)
    return () => window.removeEventListener('chuhai-projects-changed', refresh)
  }, [location.pathname])

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200/80 bg-white">
      {/* 顶部品牌区 */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40">
          <Orbit className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-slate-800">出海动力</div>
          <div className="text-[10.5px] text-slate-400">出海增长组</div>
        </div>
        <button className="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500" title="折叠侧边栏">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 主导航 */}
      <nav className="mt-1 space-y-0.5 px-2.5">
        {mainNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                isActive
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* 项目分组 */}
      <div className="mt-4 flex-1 overflow-y-auto scroll-slim px-2.5 pb-2">
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <span className="text-[11px] font-medium tracking-wider text-slate-400">项目</span>
          <button className="rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500" title="搜索项目">
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setNewName('')
              setCreateOpen(true)
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[5px] border border-slate-300 text-slate-400">
              <Plus className="h-2.5 w-2.5" />
            </span>
            新建项目
          </button>
          {projectList.map((p) => (
            <div
              key={p.id}
              className={cn(
                'group flex w-full items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors',
                location.pathname === `/projects/${p.id}` ? 'bg-slate-50' : 'hover:bg-slate-50',
              )}
            >
              <button
                type="button"
                onClick={() => navigate(`/projects/${p.id}`)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-[6px] text-left text-[13px] transition-colors',
                  location.pathname === `/projects/${p.id}` ? 'font-medium text-slate-800' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <span className="h-3.5 w-3.5 shrink-0 rounded-[5px]" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.name}</span>
                {p.pinned && <Pin className="h-3 w-3 shrink-0 fill-sky-500 text-sky-500" />}
              </button>
              <ProjectActions project={p} />
            </div>
          ))}
        </div>
      </div>

      {/* 底部：积分情况 / 用户 */}
      <div className="border-t border-slate-100 px-2.5 py-2.5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-[12.5px] font-medium text-slate-700">积分</span>
            <span className="ml-auto text-[13px] font-semibold tabular-nums text-slate-800">1,280</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="brand-gradient h-full rounded-full" style={{ width: '64%' }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>本月已用 2,240 / 3,520</span>
            <button onClick={() => navigate('/me')} className="font-medium text-sky-600 transition-colors hover:text-sky-700">
              获取积分
            </button>
          </div>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} className="max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900">新建项目</h2>
        <p className="mt-1 text-[13px] text-slate-500">输入项目名称后即可在侧栏中使用。</p>
        <label className="mt-4 block text-[12px] font-medium text-slate-600" htmlFor="new-project-name">
          项目名称
        </label>
        <Input
          id="new-project-name"
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="例如 GlowUp 美妆出海"
          className="mt-1.5 border-slate-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNewProject()
          }}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            取消
          </Button>
          <Button className="brand-gradient text-white" onClick={submitNewProject}>
            创建
          </Button>
        </div>
      </Modal>
    </aside>
  )
}
