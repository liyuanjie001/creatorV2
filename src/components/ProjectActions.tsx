import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MoreHorizontal, Pencil, Pin, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteProject, renameProject, togglePinProject, type Project } from '@/data/mock'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ProjectActions({
  project,
  className,
  iconClassName,
}: {
  project: Project
  className?: string
  iconClassName?: string
}) {
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const [name, setName] = useState(project.name)

  const openRename = () => {
    setName(project.name)
    setRenameOpen(true)
  }

  const confirmRename = () => {
    const next = name.trim()
    if (!next) {
      toast.warning('项目名称不能为空')
      return
    }
    renameProject(project.id, next)
    setRenameOpen(false)
    toast.success('已重命名')
  }

  const onPin = () => {
    togglePinProject(project.id)
    toast.success(project.pinned ? '已取消置顶' : '已置顶')
  }

  const onDelete = () => {
    if (!window.confirm(`确定删除项目「${project.name}」？`)) return
    deleteProject(project.id)
    toast.success('项目已删除')
    if (window.location.hash.includes(`/projects/${project.id}`)) {
      navigate('/projects')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="项目操作"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:text-slate-600',
              className,
            )}
          >
            <MoreHorizontal className={cn('h-3.5 w-3.5', iconClassName)} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 border-slate-200 bg-white text-slate-800 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-slate-50" onClick={openRename}>
            <Pencil className="h-3.5 w-3.5" /> 重命名
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-slate-50" onClick={onPin}>
            <Pin className={cn('h-3.5 w-3.5', project.pinned && 'fill-sky-500 text-sky-500')} />
            {project.pinned ? '取消置顶' : '置顶'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-[16px] text-slate-800">重命名项目</DialogTitle>
            <DialogDescription className="text-[12.5px]">修改后将同步显示在侧栏与项目列表中</DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmRename() }}
            className="mt-2 border-slate-200 text-[13px] focus-visible:ring-sky-300"
            autoFocus
          />
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" className="border-slate-200" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button className="brand-gradient text-white hover:opacity-90" onClick={confirmRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
