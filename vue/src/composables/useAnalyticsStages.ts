import { ref } from 'vue';
import { z } from 'zod';
import { operationStages, type OperationStage } from '@/types/windows';
export const STAGES_STORAGE_KEY = 'chuhai-analytics-stages-v1';
const schema = z.record(z.string(), z.enum(operationStages));
function read(): Record<string, OperationStage> {
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(STAGES_STORAGE_KEY) ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
const stages = ref(read());
const storageUnavailable = ref(false);
export function useAnalyticsStages() {
  function stageFor(id: string): OperationStage {
    return stages.value[id] ?? '未分阶段';
  }
  function setStage(id: string, stage: OperationStage) {
    stages.value = { ...stages.value, [id]: stage };
    try {
      localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(stages.value));
      storageUnavailable.value = false;
    } catch {
      storageUnavailable.value = true;
    }
  }
  function reset() {
    stages.value = {};
    try {
      localStorage.removeItem(STAGES_STORAGE_KEY);
      storageUnavailable.value = false;
    } catch {
      storageUnavailable.value = true;
    }
  }
  function reload() {
    stages.value = read();
    storageUnavailable.value = false;
  }
  return { stageFor, setStage, reload, reset, storageUnavailable };
}
