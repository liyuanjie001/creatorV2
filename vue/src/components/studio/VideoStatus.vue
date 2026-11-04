<script setup lang="ts">
defineProps<{ value: string }>();
</script>
<template>
  <span
    class="inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium"
    :class="
      ['成功', '发布成功'].includes(value)
        ? 'bg-emerald-50 text-emerald-600'
        : ['失败', '发布失败'].includes(value)
          ? 'bg-rose-50 text-rose-500'
          : ['生成中', '发布中', '待发布'].includes(value)
            ? 'bg-sky-50 text-sky-600'
            : ['等待中', '已排期'].includes(value)
              ? 'bg-amber-50 text-amber-600'
              : 'bg-slate-100 text-slate-500'
    "
  >
    {{ value }}
  </span>
</template>
