<script setup lang="ts">
import { ref } from 'vue';
import { PopoverRoot, PopoverAnchor, PopoverPortal, PopoverContent } from 'reka-ui';
import { studio, createProject } from '@/services/studio';
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ select: [projectId: string] }>();
const creating = ref(false);
const name = ref('');
const error = ref('');
function choose(id: string) { open.value = false; emit('select', id); }
function create() {
  try { const project = createProject(name.value); creating.value = false; name.value = ''; choose(project.id); }
  catch (cause) { error.value = (cause as Error).message; }
}
</script>
<template>
  <PopoverRoot v-model:open="open">
    <PopoverAnchor as-child><slot /></PopoverAnchor>
    <PopoverPortal>
      <PopoverContent align="end" :side-offset="8" class="z-[100] w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" aria-label="选择复刻项目" data-remake-project-picker @click.stop>
        <p class="px-3 py-2 text-xs font-medium text-slate-400">选择复刻到的项目</p>
        <div class="max-h-56 overflow-y-auto">
          <button v-for="project in studio.projects.filter(p => !p.archived)" :key="project.id" type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700" @click="choose(project.id)">
            <span class="h-2.5 w-2.5 shrink-0 rounded" :style="{ background: project.color }" /><span class="truncate">{{ project.name }}</span>
          </button>
          <p v-if="!studio.projects.some(p => !p.archived)" class="px-3 py-3 text-xs text-slate-400">暂无项目，创建后即可继续复刻</p>
        </div>
        <div class="mt-1 border-t border-slate-100 pt-1">
          <button v-if="!creating" type="button" class="w-full rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-sky-50" @click="creating = true">＋ 新建项目</button>
          <form v-else class="space-y-2 p-2" @submit.prevent="create">
            <input v-model="name" aria-label="新项目名称" class="studio-field" placeholder="输入项目名称" required>
            <p v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
            <button class="studio-primary w-full">创建并开始复刻</button>
          </form>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
