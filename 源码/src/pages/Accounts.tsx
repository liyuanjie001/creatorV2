import { Plus, RefreshCw, Settings2, ShieldAlert, CircleCheck, Clock3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader, PlatformBadge } from '@/components/shared'
import { accounts, platforms } from '@/data/mock'
import { cn } from '@/lib/utils'

const statusStyle: Record<string, { dot: string; text: string }> = {
  正常: { dot: 'bg-emerald-400', text: 'text-emerald-600' },
  待授权: { dot: 'bg-amber-400', text: 'text-amber-600' },
  风控预警: { dot: 'bg-rose-400', text: 'text-rose-600' },
}

const groups = ['全部账号', '美妆矩阵', '3C 矩阵', '电商矩阵', '内容矩阵', 'B2B 矩阵']

export default function Accounts() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="账号管理"
        desc="集中托管全平台矩阵账号，统一授权、分组与风控监测"
        extra={
          <Button size="sm" className="gap-2 brand-gradient text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> 连接新账号
          </Button>
        }
      />

      {/* 平台授权状态 */}
      <div className="grid grid-cols-6 gap-3">
        {platforms.map((p) => {
          const connected = accounts.filter((a) => a.platform === p)
          return (
            <Card key={p} className="glass-card cursor-pointer border-slate-200 p-4 text-center transition-colors hover:border-slate-300">
              <PlatformBadge platform={p} className="justify-center" />
              <div className="mt-2 text-lg font-semibold text-slate-900">{connected.length}</div>
              <div className="text-[11px] text-slate-400">已连接</div>
            </Card>
          )
        })}
      </div>

      {/* 分组筛选 + 表格 */}
      <Card className="glass-card border-slate-200 p-5">
        <div className="mb-4 flex items-center gap-2">
          {groups.map((g, i) => (
            <button
              key={g}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] transition-colors',
                i === 0 ? 'bg-sky-500 font-medium text-slate-900' : 'border border-slate-200 text-slate-500 hover:text-slate-900'
              )}
            >
              {g}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 bg-transparent text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <RefreshCw className="h-3.5 w-3.5" /> 同步数据
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 bg-transparent text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <Settings2 className="h-3.5 w-3.5" /> 批量分组
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500">账号</TableHead>
              <TableHead className="text-slate-500">分组</TableHead>
              <TableHead className="text-slate-500">粉丝</TableHead>
              <TableHead className="text-slate-500">地区</TableHead>
              <TableHead className="text-slate-500">状态</TableHead>
              <TableHead className="text-slate-500">最近活跃</TableHead>
              <TableHead className="text-right text-slate-500">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id} className="border-slate-200 hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-200">
                      <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-[11px] text-white">
                        {a.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-[13px] font-medium text-slate-900">{a.name}</div>
                      <div className="text-[11px] text-slate-400">{a.handle}</div>
                    </div>
                    <PlatformBadge platform={a.platform} />
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-slate-600">{a.group}</TableCell>
                <TableCell className="text-[13px] font-medium text-slate-900">{a.followers}</TableCell>
                <TableCell className="text-[12px] text-slate-600">{a.region}</TableCell>
                <TableCell>
                  <span className={cn('flex items-center gap-1.5 text-[12px] font-medium', statusStyle[a.status].text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle[a.status].dot)} />
                    {a.status}
                  </span>
                </TableCell>
                <TableCell className="text-[12px] text-slate-500">{a.lastActive}</TableCell>
                <TableCell className="text-right">
                  {a.status === '待授权' ? (
                    <Button size="sm" variant="outline" className="border-amber-400/30 bg-amber-400/10 text-[12px] text-amber-200 hover:bg-amber-400/20 hover:text-slate-900">
                      重新授权
                    </Button>
                  ) : a.status === '风控预警' ? (
                    <Button size="sm" variant="outline" className="gap-1.5 border-rose-400/30 bg-rose-400/10 text-[12px] text-rose-600 hover:bg-rose-400/20 hover:text-slate-900">
                      <ShieldAlert className="h-3.5 w-3.5" /> 查看详情
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-[12px] text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                      管理
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 底部提示 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CircleCheck, title: '授权状态健康度 86%', desc: '13 个账号授权正常，1 个待处理', tone: 'text-emerald-600' },
          { icon: ShieldAlert, title: '1 个账号触发风控预警', desc: '@desk_life_us 近 24h 互动异常，建议降频发布', tone: 'text-rose-600' },
          { icon: Clock3, title: '1 个授权即将过期', desc: '@TechNovaShorts 的 YouTube 授权将在 3 天后失效', tone: 'text-amber-600' },
        ].map(({ icon: Icon, title, desc, tone }) => (
          <Card key={title} className="glass-card flex items-start gap-3 border-slate-200 p-4">
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', tone)} />
            <div>
              <div className="text-[13px] font-medium text-slate-900">{title}</div>
              <div className="mt-0.5 text-[12px] text-slate-500">{desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
