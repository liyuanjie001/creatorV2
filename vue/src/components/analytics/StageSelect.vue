<script setup lang="ts">
import { operationStages } from '@/types/windows';
import { useAnalyticsStages } from '@/composables/useAnalyticsStages';
defineProps<{ accountId: string; label: string }>();
const stages = useAnalyticsStages();
function change(id: string, event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  const value = operationStages.find((stage) => stage === target.value);
  if (value) stages.setStage(id, value);
}
</script>
<template>
  <select
    :value="stages.stageFor(accountId)"
    :aria-label="`运营阶段 ${label}`"
    class="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600"
    title="人工维护的内部标签，不代表平台推荐状态"
    @change="change(accountId, $event)"
  >
    <option v-for="stage in operationStages" :key="stage">{{ stage }}</option>
  </select>
</template>
