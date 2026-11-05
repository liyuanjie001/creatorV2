<script setup lang="ts">
import { ListFilter, X } from 'lucide-vue-next';

type FilterOption = { value: string; label: string };
type FilterGroup = { key: string; label: string; options: FilterOption[] };
const props = defineProps<{
  filter: FilterGroup;
  active: string[];
  open: boolean;
}>();
const emit = defineEmits<{
  toggle: [];
  toggleValue: [value: string];
  clear: [];
  apply: [];
}>();
</script>

<template>
  <span class="relative inline-flex align-middle">
    <button
      type="button"
      class="relative grid h-5 w-5 place-items-center rounded hover:bg-sky-50 hover:text-sky-600"
      :class="active.length ? 'bg-sky-100 text-sky-600' : 'text-slate-400'"
      :aria-label="`${props.filter.label}筛选`"
      :aria-expanded="open"
      :title="`${props.filter.label}筛选`"
      @click="emit('toggle')"
      @keydown.esc="emit('clear')"
    >
      <ListFilter class="h-3.5 w-3.5" />
      <span v-if="active.length" class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
    </button>
    <button
      v-if="active.length"
      type="button"
      class="absolute -right-2 -top-2 z-10 grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
      :aria-label="`清除${props.filter.label}筛选`"
      :title="`清除${props.filter.label}筛选`"
      @click.stop="emit('clear')"
    >
      <X class="h-2.5 w-2.5" />
    </button>
    <div v-if="open" class="absolute left-0 top-full z-40 mt-2 w-60 rounded-lg border border-slate-200 bg-white p-2 text-left shadow-lg" role="dialog" :aria-label="`${props.filter.label}筛选选项`">
      <div class="max-h-56 space-y-0.5 overflow-y-auto">
        <label v-for="option in props.filter.options" :key="option.value" class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs font-normal text-slate-700 hover:bg-slate-50">
          <input type="checkbox" class="h-4 w-4 accent-sky-500" :checked="active.includes(option.value)" @change="emit('toggleValue', option.value)">
          <span>{{ option.label }}</span>
        </label>
        <p v-if="!props.filter.options.length" class="px-2 py-5 text-center text-xs text-slate-400">暂无可选{{ props.filter.label }}</p>
      </div>
      <div class="mt-2 flex items-center justify-between border-t border-slate-100 px-1 pt-2">
        <button type="button" class="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="emit('clear')">清除</button>
        <button type="button" class="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700" @click="emit('apply')">应用</button>
      </div>
    </div>
  </span>
</template>
