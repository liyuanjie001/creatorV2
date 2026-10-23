import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { operationStages, type OperationStage } from '@/types/windows'

export const STAGES_STORAGE_KEY = 'chuhai-analytics-stages-v1'
const schema = z.record(z.string(), z.enum(operationStages))

function read(): Record<string, OperationStage> {
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(STAGES_STORAGE_KEY) ?? '{}'))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

let stages = read()
let storageUnavailable = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return stages
}

function persist(next: Record<string, OperationStage>, remove = false) {
  stages = next
  try {
    if (remove) localStorage.removeItem(STAGES_STORAGE_KEY)
    else localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(stages))
    storageUnavailable = false
  } catch {
    storageUnavailable = true
  }
  emit()
}

export function resetAnalyticsStages() {
  persist({}, true)
}

export function useAnalyticsStages() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  function stageFor(id: string): OperationStage {
    return current[id] ?? '未分阶段'
  }

  function setStage(id: string, stage: OperationStage) {
    persist({ ...stages, [id]: stage })
  }

  return { stageFor, setStage, reset: resetAnalyticsStages, storageUnavailable }
}
