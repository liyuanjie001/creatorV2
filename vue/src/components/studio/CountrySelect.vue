<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui';
import { ChevronDown, Check } from 'lucide-vue-next';
import { countries, countryName } from '@/services/countries';
defineProps<{ modelValue: string; label: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <ComboboxRoot
    :model-value="modelValue"
    :disabled="disabled"
    open-on-click
    class="min-w-0"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <ComboboxAnchor class="relative">
      <ComboboxInput
        :aria-label="label"
        :display-value="(value: string) => countryName(value)"
        :disabled="disabled"
        placeholder="搜索国家地区"
        class="studio-field !w-full !pr-8"
      />
      <ComboboxTrigger
        :disabled="disabled"
        class="absolute inset-y-0 right-0 px-2 text-slate-400"
        :aria-label="label + '选项'"
      >
        <ChevronDown class="h-4 w-4" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        :collision-padding="12"
        class="z-[110] w-[var(--reka-combobox-trigger-width)] min-w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <ComboboxViewport class="max-h-56 overflow-y-auto">
          <ComboboxItem
            v-for="country in countries"
            :key="country.code"
            :value="country.code"
            :text-value="`${country.name} ${country.englishName} ${country.code}`"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-sky-50 data-[highlighted]:text-sky-700"
          >
            <span>
              {{ country.name }}
              <span class="text-xs text-slate-400">{{ country.code }}</span>
            </span>
            <Check v-if="modelValue === country.code" class="h-4 w-4 shrink-0 text-sky-600" />
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
