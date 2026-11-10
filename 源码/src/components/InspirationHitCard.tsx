import { useState } from 'react'
import { Heart, MessageCircle, Play, Share2, Star } from 'lucide-react'
import { Thumb } from '@/components/shared'
import { type Inspiration } from '@/data/mock'
import { cn } from '@/lib/utils'

/** 参考「内容制作 · 爆款社区」竖版封面卡片 */

function formatDur(duration: string) {
  if (!duration || duration === '图文') return duration || '—'
  // 00:32 → 0:32
  const m = duration.match(/^0?(\d+):(\d{2})$/)
  if (m) return `${Number(m[1])}:${m[2]}`
  return duration
}

function deriveSideStats(item: Inspiration) {
  // 演示：由热度推导评论 / 分享量级文案
  const comments = item.heat >= 90 ? `${Math.round(item.heat * 0.09)}K` : `${Math.round(item.heat * 12)}`
  const shares = item.heat >= 85 ? `${Math.round(item.heat * 0.12)}K` : `${Math.round(item.heat * 8)}`
  return { comments, shares }
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Play
  label: string
  value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] text-white/75">
        <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-[17px] font-bold tabular-nums tracking-tight text-white">{value}</div>
    </div>
  )
}

export default function InspirationHitCard({
  item,
  remakeLabel = '一键翻拍',
  onRemake,
  onFavorite,
}: {
  item: Inspiration
  remakeLabel?: string
  onRemake: () => void
  onFavorite: () => void
}) {
  const [fav, setFav] = useState(false)
  const [playing, setPlaying] = useState(false)
  const side = deriveSideStats(item)

  return (
    <article
      className="group overflow-hidden rounded-[14px] border border-slate-200 bg-white transition-shadow hover:border-orange-200 hover:shadow-md"
      onMouseEnter={() => setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
        <Thumb className={cn('absolute inset-0 h-full w-full transition-transform duration-[8s] ease-linear', playing && 'scale-105')} />

        {/* 播放钮 */}
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-[32%] z-[2] grid h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/50 pl-0.5 text-white transition-opacity',
            playing && 'opacity-0',
          )}
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </span>

        {/* 收藏星标 */}
        <button
          type="button"
          title={fav ? '取消收藏' : '收藏'}
          onClick={(e) => {
            e.stopPropagation()
            setFav((v) => {
              const next = !v
              if (next) onFavorite()
              return next
            })
          }}
          className={cn(
            'absolute right-2 top-2 z-[3] grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-md transition-colors',
            fav ? 'text-rose-500' : 'text-slate-400 hover:text-amber-500',
          )}
        >
          <Star className={cn('h-3.5 w-3.5', fav && 'fill-current')} strokeWidth={1.6} />
        </button>

        {/* 底部数据浮层（对齐爆款社区） */}
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end">
          <div className="bg-gradient-to-t from-black/75 via-black/45 to-transparent px-3 pb-3 pt-10 text-white">
            <div className="mb-2 text-[12px] text-white/90">时长 {formatDur(item.duration)}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Stat icon={Play} label="播放" value={item.views} />
              <Stat icon={Heart} label="点赞" value={item.likes} />
              <Stat icon={MessageCircle} label="评论" value={side.comments} />
              <Stat icon={Share2} label="分享" value={side.shares} />
            </div>
            <div className="pointer-events-auto mt-3 flex gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemake()
                }}
                className="h-8 flex-1 rounded-lg border border-white bg-white text-[12.5px] font-semibold text-slate-900 transition-colors hover:bg-slate-50"
              >
                {remakeLabel}
              </button>
            </div>
          </div>
        </div>

        {/* hover 进度条（示意） */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-2.5 bottom-2 z-[4] h-[3px] overflow-hidden rounded-full bg-white/35 transition-opacity',
            playing ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: playing ? '100%' : '0%',
              transition: playing ? 'width 8s linear' : 'none',
            }}
          />
        </div>
      </div>
    </article>
  )
}
