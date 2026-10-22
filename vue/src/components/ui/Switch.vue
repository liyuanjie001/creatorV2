<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { computed, ref, type HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    defaultValue?: boolean;
    modelValue?: boolean;
    disabled?: boolean;
  }>(),
  { modelValue: undefined },
);
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
const localValue = ref(props.defaultValue ?? false);
const model = computed({
  get: () => props.modelValue ?? localValue.value,
  set: (value: boolean) => {
    localValue.value = value;
    emit('update:modelValue', value);
  },
});
</script>

<template>
  <SwitchRoot
    v-model="model"
    :default-value="defaultValue"
    :disabled="disabled"
    :class="
      cn(
        'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
  >
    <SwitchThumb
      class="pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
    />
  </SwitchRoot>
</template>
