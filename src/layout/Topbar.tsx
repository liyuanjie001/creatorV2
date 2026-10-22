import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router'

export default function Topbar() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-6 backdrop-blur">
      <div className="ml-auto flex items-center gap-2">
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
