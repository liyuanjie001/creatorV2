import type { MetricDatum } from '@/types/windows'
import { formatCount } from '@/lib/windowMetrics'

export default function MetricValue({
  datum,
  suffix = '',
  compact = false,
}: {
  datum: MetricDatum
  suffix?: string
  compact?: boolean
}) {
  const hint =
    datum.kind === 'available'
      ? `${datum.source} · ${datum.collectedAt.slice(0, 16).replace('T', ' ')} UTC`
      : datum.detail
  return (
    <span title={hint} className="inline-flex flex-col gap-1">
      {datum.kind === 'available' ? (
        <span className="tabular-nums">
          {suffix ? datum.value.toFixed(1) : formatCount(datum.value)}
          {suffix}
        </span>
      ) : (
        <span className="text-[11px] font-normal text-slate-400">
          —{!compact && <span> {datum.reason}</span>}
        </span>
      )}
      {datum.kind === 'available' && datum.included < datum.total && (
        <span className="text-[10px] font-normal text-amber-600">
          部分数据 {datum.included}/{datum.total}
        </span>
      )}
    </span>
  )
}
