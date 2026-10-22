import { RotateCcw, Trash2, FolderKanban, FileVideo, ListTodo, AtSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared'
import { trashItems } from '@/data/mock'
import { toast } from 'sonner'
import type { ComponentType } from 'react'

const typeIcon: Record<string, ComponentType<{ className?: string }>> = {
  项目: FolderKanban,
  任务: ListTodo,
  素材: FileVideo,
  账号: AtSign,
}

export default function Trash() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="回收站"
        desc="已删除的项目、任务与素材会在此保留 30 天，之后自动彻底清除"
        extra={
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <Trash2 className="h-3.5 w-3.5" /> 清空回收站
          </Button>
        }
      />

      <Card className="glass-card divide-y divide-slate-200 border-slate-200">
        {trashItems.map((item) => {
          const Icon = typeIcon[item.type]
          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-slate-900">{item.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-500">
                    {item.type}
                  </Badge>
                  <span>删除于 {item.deletedAt}</span>
                  {item.size && <span>· {item.size}</span>}
                  <span>· 剩余 24 天</span>
                </div>
              </div>
              <Button
                size="sm" variant="outline"
                className="gap-1.5 border-slate-200 bg-transparent text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => toast.success('已还原（演示）', { description: item.name })}
              >
                <RotateCcw className="h-3.5 w-3.5" /> 还原
              </Button>
              <Button
                size="sm" variant="ghost"
                className="text-[12px] text-rose-600/80 hover:bg-rose-400/10 hover:text-rose-600"
                onClick={() => toast.error('已彻底删除（演示）', { description: item.name })}
              >
                彻底删除
              </Button>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
