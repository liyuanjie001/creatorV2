<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';
import { CalendarDays, Clock3, Globe2, ChevronDown, Check, Search } from 'lucide-vue-next';
import {
  timeZones,
  localTimeZone,
  localDateTime,
  offsetLabel,
  zoneName,
  scheduleCandidates,
  formatSchedule,
  formatTimeZone,
} from '@/services/timeZones';
const props = defineProps<{ modelValue: string; timeZone?: string; disabled?: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:timeZone': [value: string];
  validity: [valid: boolean];
}>();
const zone = ref(props.timeZone || 'Asia/Shanghai');
const local = ref(localDateTime(props.modelValue, zone.value));
const open = ref(false),
  query = ref(''),
  picked = ref(props.modelValue);
const candidates = computed(() => scheduleCandidates(local.value, zone.value));
const message = computed(() =>
  !candidates.value.length
    ? '该当地时间不存在或无效，请重新选择（可能跨越夏令时）。'
    : candidates.value.length > 1 && !candidates.value.some((c) => c.utc === picked.value)
      ? '该时间出现两次，请选择 GMT 偏移。'
      : !picked.value || new Date(picked.value).getTime() <= Date.now()
        ? '定时时间必须晚于当前时间'
        : '',
);
const zones = computed(() => {
  const all = [{ id: localTimeZone(), label: '本地时区 · ' + zoneName(localTimeZone()) }, ...timeZones];
  return all.filter(
    (z, i) =>
      (i === 0 || z.id !== all[0]!.id) &&
      (z.id + ' ' + z.label).toLowerCase().includes(query.value.trim().toLowerCase()),
  );
});
watch(open, (value) => {
  if (value) query.value = '';
});
watch(
  () => props.modelValue,
  (value) => {
    if (!candidates.value.some((c) => c.utc === value)) local.value = localDateTime(value, zone.value);
    picked.value = value;
  },
);
watch(
  () => props.timeZone,
  (value) => {
    if (value && value !== zone.value) {
      zone.value = value;
      local.value = localDateTime(props.modelValue, value);
    }
  },
);
watch(message, (value) => emit('validity', !value), { immediate: true });
function update() {
  picked.value = candidates.value.length === 1 ? candidates.value[0]!.utc : '';
  if (picked.value) emit('update:modelValue', picked.value);
  emit('validity', !message.value);
}
function part(which: 'date' | 'time', value: string) {
  const [date, time] = local.value.split('T');
  local.value = which === 'date' ? value + 'T' + time : date + 'T' + value;
  update();
}
function optionOffset(id: string) { return scheduleCandidates(local.value,id)[0]?.offset || offsetLabel(props.modelValue,id); }
function compactZone(id: string) {
  const offset = id === zone.value && picked.value && candidates.value.some((c) => c.utc === picked.value)
    ? offsetLabel(picked.value, id)
    : optionOffset(id);
  return formatTimeZone(id, offset);
}
function chooseZone(id: string) {
  zone.value = id;
  emit('update:timeZone', id);
  open.value = false;
  update();
}
function chooseOffset(value: string) {
  picked.value = value;
  emit('update:modelValue', value);
  emit('validity', !message.value);
}
</script>
<template>
  <div class="space-y-2" aria-label="城市时区排期">
    <div class="flex flex-wrap gap-2">
      <label class="relative min-w-40 flex-1">
        <CalendarDays class="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
        <input
          :value="local.slice(0, 10)"
          type="date"
          aria-label="发布日期"
          :disabled="disabled"
          class="h-10 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-2 text-xs"
          @change="part('date', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="relative min-w-32 flex-1">
        <Clock3 class="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
        <input
          :value="local.slice(11, 16)"
          type="time"
          aria-label="发布时间"
          :disabled="disabled"
          class="h-10 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-2 text-xs"
          @change="part('time', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <PopoverRoot v-model:open="open">
        <PopoverTrigger as-child>
          <button
            type="button"
            aria-label="发布时区"
            :disabled="disabled"
            class="flex min-w-52 flex-[2] items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-left text-xs"
          >
            <Globe2 class="h-4 w-4 shrink-0 text-slate-500" />
            <span class="min-w-0 flex-1">
              {{ compactZone(zone) }}
            </span>
            <ChevronDown class="h-3 w-3 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="start"
            :side-offset="6"
            class="z-[100] w-80 max-w-[calc(100vw-32px)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            @open-auto-focus.prevent
          >
            <label class="relative block">
              <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                v-model="query"
                aria-label="搜索国家或城市时区"
                placeholder="搜索国家、城市或时区"
                class="studio-field !pl-9"
              />
            </label>
            <div class="mt-2 max-h-64 overflow-y-auto">
              <button
                v-for="item in zones"
                :key="item.id"
                type="button"
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-sky-50"
                :class="item.id === zone ? 'bg-sky-50 text-sky-700' : 'text-slate-700'"
                @click="chooseZone(item.id)"
              >
                <span class="flex-1">
                  {{ compactZone(item.id) }}
                </span>
                <Check v-if="item.id === zone" class="h-3 w-3" />
              </button>
              <p v-if="!zones.length" class="p-4 text-xs text-slate-400">没有匹配的国家或城市</p>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>
    <div v-if="candidates.length > 1" class="rounded-lg bg-amber-50 p-3 text-xs">
      <p class="mb-2">当地时间出现两次，请明确选择：</p>
      <label v-for="item in candidates" :key="item.utc" class="mr-4 inline-flex items-center gap-1">
        <input
          type="radio"
          :checked="picked === item.utc"
          :disabled="disabled"
          @change="chooseOffset(item.utc)"
        />
        {{ item.offset }}
      </label>
    </div>
    <p v-if="message" role="alert" class="text-xs text-rose-600">{{ message }}</p>
    <p v-else class="text-[11px] text-slate-500">{{ formatSchedule(picked, zone) }}</p>
  </div>
</template>
