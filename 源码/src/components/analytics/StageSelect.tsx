import { operationStages, type OperationStage } from '@/types/windows'
import { useAnalyticsStages } from '@/hooks/useAnalyticsStages'

export default function StageSelect({ accountId, label }: { accountId: string; label: string }) {
  const stages = useAnalyticsStages()
  return (
    <select
      value={stages.stageFor(accountId)}
      aria-label={`运营阶段 ${label}`}
      className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600"
      title="人工维护的内部标签，不代表平台推荐状态"
      onChange={(event) => {
        const value = operationStages.find((stage) => stage === event.target.value)
        if (value) stages.setStage(accountId, value as OperationStage)
      }}
    >
      {operationStages.map((stage) => (
        <option key={stage}>{stage}</option>
      ))}
    </select>
  )
}
