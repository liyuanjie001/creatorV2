import { useNavigate } from 'react-router'
import { Crown, Users, Bell, ShieldCheck, Palette, KeyRound, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/shared'

const members = [
  { name: '林悦', role: '运营负责人', initials: 'LY', you: true },
  { name: '陈默', role: '内容策划', initials: 'CM', you: false },
  { name: '苏航', role: '数据分析师', initials: 'SH', you: false },
  { name: '王一帆', role: '视觉设计', initials: 'WY', you: false },
]

const settings = [
  { icon: Bell, title: '通知偏好', desc: '任务完成、风控预警、额度提醒', tab: 'notifications' },
  { icon: ShieldCheck, title: '账号安全', desc: '两步验证、登录设备管理', tab: 'security' },
  { icon: Palette, title: '界面偏好', desc: '主题、语言、时区设置', tab: 'appearance' },
  { icon: KeyRound, title: 'API 接入', desc: '开放接口 Key 与调用配额', tab: 'api' },
]

export default function Profile() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="我的" desc="个人资料、团队与账号设置" />

      {/* 资料 + 套餐 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card col-span-2 border-slate-200 p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-sky-300">
              <AvatarFallback className="brand-gradient text-xl font-semibold text-white">LY</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-semibold text-slate-900">林悦</span>
                <Badge className="gap-1 border-0 bg-gradient-to-r from-amber-400/20 to-amber-500/10 text-[11px] text-amber-600">
                  <Crown className="h-3 w-3" /> Pro 版
                </Badge>
              </div>
              <div className="mt-1 text-[13px] text-slate-500">运营负责人 · linyue@matrixhub.demo</div>
              <div className="mt-1 text-[12px] text-slate-400">加入于 2026-03-18 · 所属团队：出海增长组</div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              编辑资料
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: '累计发布内容', value: '1,284' },
              { label: '负责项目', value: '6' },
              { label: '本月贡献曝光', value: '2.4M' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <div className="text-xl font-semibold text-slate-900">{s.value}</div>
                <div className="mt-1 text-[11.5px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card relative overflow-hidden border-sky-200 p-6">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-50 blur-3xl" />
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <h3 className="text-[15px] font-medium text-slate-900">套餐与额度</h3>
          </div>
          <div className="mt-4 space-y-4 text-[12.5px]">
            {[
              { label: '发布额度', used: 640, total: 1000 },
              { label: 'AI 生成次数', used: 212, total: 500 },
              { label: '存储空间', used: 36, total: 100 },
            ].map((q) => (
              <div key={q.label}>
                <div className="mb-1.5 flex justify-between text-slate-600">
                  <span>{q.label}</span>
                  <span className="text-slate-700">{q.used} / {q.total}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="brand-gradient h-full rounded-full" style={{ width: `${(q.used / q.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" className="mt-5 w-full brand-gradient text-white hover:opacity-90">升级至 Team 版</Button>
        </Card>
      </div>

      {/* 团队成员 */}
      <Card className="glass-card border-slate-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-slate-900">
            <Users className="h-4 w-4 text-slate-500" /> 团队成员（4）
          </h3>
          <Button variant="outline" size="sm" className="border-slate-200 bg-slate-50 text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            邀请成员
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Avatar className="h-10 w-10 border border-slate-200">
                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-[12px] text-white">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium text-slate-900">
                  {m.name}
                  {m.you && <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-600">我</span>}
                </div>
                <div className="text-[12px] text-slate-400">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 设置入口 */}
      <Card className="glass-card divide-y divide-slate-200 border-slate-200">
        {settings.map(({ icon: Icon, title, desc, tab }) => (
          <button key={title} onClick={() => navigate(`/settings?tab=${tab}`)} className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50">
            <Icon className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-slate-900">{title}</div>
              <div className="text-[12px] text-slate-400">{desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </Card>
    </div>
  )
}
