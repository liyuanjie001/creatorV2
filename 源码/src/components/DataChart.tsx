import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Series {
  name: string
  color: string
  type: 'area' | 'line' | 'bar'
}

export default function DataChart({
  data,
  series,
}: {
  type: 'area' | 'line' | 'bar' | 'pie'
  data: Record<string, string | number>[]
  series: Series[]
}) {
  const Chart = series.every((item) => item.type === 'line') ? LineChart : AreaChart
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(100,116,139,0.12)" strokeDasharray="4 4" />
        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e9ee', borderRadius: 8, fontSize: 12, color: '#64748b' }}
        />
        {series.map((item) =>
          item.type === 'line' ? (
            <Line
              key={item.name}
              type="monotone"
              dataKey={item.name}
              stroke={item.color}
              strokeWidth={2}
              dot={false}
            />
          ) : (
            <Area
              key={item.name}
              type="monotone"
              dataKey={item.name}
              stroke={item.color}
              strokeWidth={2}
              fill={item.color}
              fillOpacity={0.18}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  )
}
