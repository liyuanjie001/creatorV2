<script setup lang="ts">
defineProps<{
  value: number;
}>();
</script>

<template>
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
    <div
      class="h-full rounded-full bg-gradient-to-r from-[#11a3fd] via-[#2f8fff] to-[#1769ff]"
      :style="{ width: `${value}%` }"
    />
  </div>
</template>
