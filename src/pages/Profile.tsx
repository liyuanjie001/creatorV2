import { useState } from 'react'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const currentPlan = {
  name: 'Pro 版',
  price: '¥199 / 月',
  renewAt: '2026-11-22',
  quotas: [
    { label: '发布额度', used: 640, total: 1000 },
    { label: 'AI 生成次数', used: 212, total: 500 },
    { label: '存储空间 (GB)', used: 36, total: 100 },
    { label: '积分', used: 2240, total: 3520 },
  ],
}

const allPlans = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    period: '永久',
    desc: '适合个人试用与轻量创作',
    features: ['每月 50 次 AI 生成', '5 GB 存储', '基础素材库', '单项目协作'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro 版',
    price: '¥199',
    period: '/ 月',
    desc: '适合个人创作者持续产出',
    features: ['每月 500 次 AI 生成', '100 GB 存储', '全部模型可用', '优先生成队列', '积分加油包'],
    highlight: true,
    current: true,
  },
  {
    id: 'business',
    name: 'Business 版',
    price: '¥599',
    period: '/ 月',
    desc: '适合高频创作与多项目管理',
    features: ['每月 2000 次 AI 生成', '500 GB 存储', '批量生成加速', '专属客服', '数据导出'],
    highlight: false,
  },
]

export default function Profile() {
  const [selectedPlan, setSelectedPlan] = useState('pro')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="个人中心" desc="查看我的套餐与全部套餐计划" />

      {/* 我的套餐 */}
      <Card className="glass-card relative overflow-hidden border-sky-200 p-6">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-50 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-[15px] font-semibold text-slate-900">我的套餐</h2>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="text-2xl font-semibold text-slate-900">{currentPlan.name}</span>
              <Badge className="border-0 bg-sky-50 text-[11px] text-sky-600">当前使用中</Badge>
            </div>
            <p className="mt-1 text-[13px] text-slate-500">
              {currentPlan.price} · 下次续费 {currentPlan.renewAt}
            </p>
          </div>
          <Button
            size="sm"
            className="brand-gradient text-white hover:opacity-90"
            onClick={() => {
              document.getElementById('all-plans')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            更换套餐
          </Button>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {currentPlan.quotas.map((q) => (
            <div key={q.label} className="rounded-xl border border-slate-200 bg-white/80 p-3.5">
              <div className="mb-1.5 flex justify-between text-[12px] text-slate-500">
                <span>{q.label}</span>
                <span className="tabular-nums text-slate-700">{q.used}/{q.total}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="brand-gradient h-full rounded-full"
                  style={{ width: `${Math.min(100, (q.used / q.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 所有套餐计划 */}
      <div id="all-plans">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
          <h2 className="text-[15px] font-semibold text-slate-900">所有套餐计划</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {allPlans.map((plan) => {
            const active = selectedPlan === plan.id
            return (
              <Card
                key={plan.id}
                className={cn(
                  'glass-card relative flex flex-col border p-5 transition-all',
                  plan.highlight || active ? 'border-sky-300 shadow-md shadow-sky-100' : 'border-slate-200',
                )}
              >
                {plan.current && (
                  <Badge className="absolute right-3 top-3 border-0 bg-sky-50 text-[10.5px] text-sky-600">
                    当前套餐
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Zap className={cn('h-4 w-4', plan.highlight ? 'text-sky-500' : 'text-slate-400')} />
                  <h3 className="text-[15px] font-semibold text-slate-900">{plan.name}</h3>
                </div>
                <p className="mt-1 text-[12px] text-slate-400">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-slate-900">{plan.price}</span>
                  <span className="text-[12px] text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id !== 'free' && (
                  <Button
                    className={cn(
                      'mt-5 w-full',
                      plan.current
                        ? 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        : 'brand-gradient text-white hover:opacity-90',
                    )}
                    variant={plan.current ? 'outline' : 'default'}
                    disabled={plan.current}
                    onClick={() => {
                      setSelectedPlan(plan.id)
                      toast.success(`已选择「${plan.name}」（演示）`)
                    }}
                  >
                    {plan.current ? '使用中' : '选择此套餐'}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
