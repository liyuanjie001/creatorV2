<script setup lang="ts">
import { Download, Check } from 'lucide-vue-next';
import { type Asset } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
const { list, selected } = defineProps<{
  list: Asset[];
  selected: Set<string>;
}>();
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <table class="w-full text-left text-[12.5px]">
      <thead>
        <tr class="border-b border-slate-100 text-[11.5px] text-slate-400">
          <th class="w-10 px-4 py-2.5 font-normal"></th>
          <th class="px-2 py-2.5 font-normal">名称</th>
          <th class="w-20 px-2 py-2.5 font-normal">类型</th>
          <th class="w-44 px-2 py-2.5 font-normal">所属项目</th>
          <th class="w-20 px-2 py-2.5 font-normal">大小</th>
          <th class="w-28 px-2 py-2.5 font-normal">更新时间</th>
          <th class="w-24 px-4 py-2.5 text-right font-normal">操作</th>
        </tr>
      </thead>
      <tbody>
        <template :key="a.id" v-for="a in list">
          <tr class="border-b border-slate-50 transition-colors last:border-0 hover:bg-sky-50/40">
            <td class="px-4 py-2.5">
              <button
                @click="emit('select', a.id)"
                :class="
                  cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    selected.has(a.id)
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-300 bg-white text-transparent',
                  )
                "
              >
                <Check class="h-3 w-3" :strokeWidth="3"></Check>
              </button>
            </td>
            <td class="max-w-72 truncate px-2 py-2.5 font-medium text-slate-700">
              {{ a.name }}
            </td>
            <td class="px-2 py-2.5 text-slate-500">{{ a.type }}</td>
            <td class="truncate px-2 py-2.5 text-slate-500">{{ a.project }}</td>
            <td class="px-2 py-2.5 text-slate-500">{{ a.size }}</td>
            <td class="px-2 py-2.5 text-slate-400">{{ a.updatedAt }}</td>
            <td class="px-4 py-2.5 text-right">
              <button
                @click="toast.success('已开始下载（演示）')"
                class="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-sky-600"
                title="下载"
              >
                <Download class="h-4 w-4"></Download>
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
