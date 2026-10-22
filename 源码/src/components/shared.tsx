import type { ReactNode } from 'react'
import { Play, TrendingUp, TrendingDown } from 'lucide-react'
import { platformColors, type Platform } from '@/data/mock'
import { cn } from '@/lib/utils'

export function PageHeader({ title, desc, extra }: { title: ReactNode; desc?: string; extra?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-[13px] text-slate-500">{desc}</p>}
      </div>
      {extra}
    </div>
  )
}

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', className)}
      style={{ color: platformColors[platform], backgroundColor: `${platformColors[platform]}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platformColors[platform] }} />
      {platform}
    </span>
  )
}

/** 渐变缩略图（演示用占位） */
export function Thumb({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('thumb-gradient relative flex items-center justify-center overflow-hidden', className)}>
      <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-sky-100 blur-2xl" />
      <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-sky-100 blur-2xl" />
      {children ?? <Play className="h-7 w-7 text-slate-500" fill="currentColor" />}
    </div>
  )
}

export function Delta({ value, up }: { value: string; up: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        up ? 'bg-emerald-400/10 text-emerald-600' : 'bg-amber-400/10 text-amber-600'
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value}
    </span>
  )
}

/** 热度条 */
export function HeatBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#11a3fd] via-[#2f8fff] to-[#1769ff]"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
