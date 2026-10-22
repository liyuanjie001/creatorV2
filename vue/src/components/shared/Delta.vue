<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
defineProps<{
  value: string;
  up: boolean;
}>();
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        up ? 'bg-emerald-400/10 text-emerald-600' : 'bg-amber-400/10 text-amber-600',
      )
    "
  >
    <component :is="up ? TrendingUp : TrendingDown" class="h-3 w-3" />
    {{ value }}
  </span>
</template>
