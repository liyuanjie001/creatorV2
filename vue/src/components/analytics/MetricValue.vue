<script setup lang="ts">
import { computed } from 'vue';
import type { MetricDatum } from '@/types/windows';
import { formatCount } from '@/lib/windowMetrics';
const props = withDefaults(defineProps<{ datum: MetricDatum; suffix?: string; compact?: boolean }>(), {
  suffix: '',
  compact: false,
});
const hint = computed(() =>
  props.datum.kind === 'available'
    ? `${props.datum.source} · ${props.datum.collectedAt.slice(0, 16).replace('T', ' ')} UTC`
    : props.datum.detail,
);
</script>
<template>
  <span :title="hint" class="inline-flex flex-col gap-1">
    <span v-if="datum.kind === 'available'" class="tabular-nums">
      {{ suffix ? datum.value.toFixed(1) : formatCount(datum.value) }}{{ suffix }}
    </span>
    <span v-else class="text-[11px] font-normal text-slate-400">
      —
      <span v-if="!compact">{{ datum.reason }}</span>
    </span>
    <span
      v-if="datum.kind === 'available' && datum.included < datum.total"
      class="text-[10px] font-normal text-amber-600"
    >
      部分数据 {{ datum.included }}/{{ datum.total }}
    </span>
  </span>
</template>
