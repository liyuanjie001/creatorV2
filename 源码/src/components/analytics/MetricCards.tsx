import { Card } from '@/components/ui/card'
import { metricOptions } from '@/lib/windowMetrics'
import type { MetricDatum, MetricKey } from '@/types/windows'
import MetricValue from './MetricValue'

export default function MetricCards({
  metrics,
  caption,
}: {
  metrics: Record<MetricKey, MetricDatum>
  caption: string
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {metricOptions.map((item) => (
        <Card key={item.key} className="gap-0 border-slate-200 bg-white p-5 py-5 shadow-none">
          <p className="text-[12px] text-slate-500">{item.label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
            <MetricValue datum={metrics[item.key]} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{caption}</p>
        </Card>
      ))}
    </div>
  )
}
