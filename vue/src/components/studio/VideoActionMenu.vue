<script setup lang="ts">
import { computed } from 'vue';
import { MoreHorizontal, Send, Download, RotateCcw, Pencil, Trash2, ChartNoAxesCombined, CalendarClock, CalendarX } from 'lucide-vue-next';
import { DropdownMenuSeparator } from 'reka-ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui';
import type { VideoAction } from '@/services/videoManagement';
const props = defineProps<{ actions: VideoAction[]; busy?: boolean; prominent?: boolean }>();
defineEmits<{ action: [action: VideoAction] }>();
const icons = { publish: Send, download: Download, regenerate: RotateCcw, modify: Pencil, delete: Trash2, retry: RotateCcw, analytics: ChartNoAxesCombined, reschedule: CalendarClock, cancel: CalendarX };
const categories: VideoAction['id'][][] = [['publish'], ['reschedule', 'cancel'], ['download', 'regenerate', 'retry', 'modify', 'analytics'], ['delete']];
const groups = computed(() => categories.map(ids => ids.flatMap(id => props.actions.filter(a => a.id === id))).filter(group => group.length));
</script>

<template>
  <DropdownMenu v-if="actions.length">
    <DropdownMenuTrigger as-child>
      <button type="button" aria-label="更多操作" title="更多操作" class="grid shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500" :class="prominent ? 'h-10 w-10 bg-slate-100 shadow-sm hover:bg-slate-200' : 'h-8 w-8 bg-white'">
        <MoreHorizontal class="h-4 w-4" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-40 rounded-xl border-slate-200 bg-white p-1.5 shadow-lg">
      <template v-for="(group, index) in groups" :key="group[0]!.id">
        <DropdownMenuSeparator v-if="index" class="my-1 h-px bg-slate-100" />
        <DropdownMenuItem v-for="action in group" :key="action.id" class="gap-2.5 rounded-lg px-3 py-2.5 text-xs" :class="action.id === 'delete' ? 'text-rose-600 focus:text-rose-600' : 'text-slate-600'" :disabled="!!action.reason || busy" :title="action.reason || action.label" @select="$emit('action', action)">
          <component :is="icons[action.id]" class="h-4 w-4 shrink-0" aria-hidden="true" />{{ action.label }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
