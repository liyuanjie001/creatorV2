import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router'
import InspireGenPanel from '@/components/InspireGenPanel'

export default function Topbar() {
  const navigate = useNavigate()
  const [inspireOpen, setInspireOpen] = useState(false)

  /* 其他页面（如妙记）可通过事件打开灵感弹窗 */
  useEffect(() => {
    const open = () => setInspireOpen(true)
    window.addEventListener('open-inspire', open)
    return () => window.removeEventListener('open-inspire', open)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-6 backdrop-blur">
      <div className="ml-auto flex items-center gap-2">
        {/* AI 灵感生成 */}
        <Dialog open={inspireOpen} onOpenChange={setInspireOpen}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700"
            onClick={() => setInspireOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 灵感生成
          </Button>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto scroll-slim border-slate-200 bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-[16px] text-slate-800">AI 灵感生成</DialogTitle>
              <DialogDescription className="text-[12.5px]">
                填入零碎想法，AI 自动整合、补充，整理成可执行的宣发方案
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <InspireGenPanel onConfirm={() => { setInspireOpen(false); navigate('/create') }} />
            </div>
          </DialogContent>
        </Dialog>

        {/* 用户 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-slate-100">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarFallback className="brand-gradient text-xs font-semibold text-white">LY</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-[13px] leading-tight text-slate-800">林悦</div>
                <div className="text-[11px] leading-tight text-slate-400">运营负责人</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-slate-200 bg-white text-slate-800 shadow-lg">
            <DropdownMenuItem className="cursor-pointer focus:bg-slate-50" onClick={() => navigate('/me')}>
              个人中心
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="cursor-pointer text-rose-500 focus:bg-slate-50">退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
