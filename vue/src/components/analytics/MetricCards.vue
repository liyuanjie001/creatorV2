<script setup lang="ts">
import { Card } from '@/components/ui';
import { metricOptions } from '@/lib/windowMetrics';
import type { MetricDatum, MetricKey } from '@/types/windows';
import MetricValue from './MetricValue.vue';
defineProps<{ metrics: Record<MetricKey, MetricDatum>; caption: string }>();
</script>
<template>
  <div class="grid grid-cols-3 gap-4">
    <Card
      v-for="item in metricOptions"
      :key="item.key"
      class="gap-0 border-slate-200 bg-white p-5 shadow-none"
    >
      <p class="text-[12px] text-slate-500">{{ item.label }}</p>
      <div class="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
        <MetricValue :datum="metrics[item.key]" />
      </div>
      <p class="mt-2 text-[11px] text-slate-400">{{ caption }}</p>
    </Card>
  </div>
</template>
