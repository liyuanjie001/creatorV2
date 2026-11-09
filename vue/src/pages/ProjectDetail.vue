<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Sparkles, CreditCard, Send, BarChart3, Settings, MessageSquare, ChevronDown, Check, FolderPlus, ListVideo } from 'lucide-vue-next';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import { studio } from '@/services/studio';
import { useProjectWorkspace } from '@/composables/useProjectWorkspace';
import ProductsPanel from '@/components/projects/ProductsPanel.vue';
import StudioCreation from '@/components/studio/StudioCreation.vue';
import StudioPublishing from '@/components/studio/StudioPublishing.vue';
import StudioAnalytics from '@/components/studio/StudioAnalytics.vue';
import StudioSettings from '@/components/studio/StudioSettings.vue';
const route = useRoute(); const router = useRouter(); useProjectWorkspace();
const project = computed(() => studio.value.projects.find(p=>p.id === route.params.id));
const nav = [{key:'gen',label:'自由创作',icon:Sparkles},{key:'product',label:'产品卡',icon:CreditCard},{key:'publish',label:'任务列表',icon:Send},{key:'analytics',label:'数据分析',icon:BarChart3},{key:'settings',label:'项目设置',icon:Settings}];
const aliases: Record<string,string> = {attribution:'analytics',account:'settings',schedule:'publish',chat:'gen',director:'gen'};
const section = computed(() => aliases[String(route.query.section)] ?? (nav.some(n=>n.key===route.query.section) ? String(route.query.section) : 'gen'));
const isPublishRecords = computed(() => section.value === 'publish' && route.query.tab === 'records');
watch(() => route.query.section, legacy => {
  if (legacy === 'chat' || legacy === 'director') void router.replace({query:{...route.query,section:'gen',mode:'expert'}});
}, {immediate:true});
const creationNav = [{ label: '自由创作', mode: 'normal', icon: Sparkles }, { label: '专家模式', mode: 'expert', icon: MessageSquare }];
const managementNav = computed(() => nav.filter(n => ['product', 'publish'].includes(n.key)));
function select(key: string, mode = 'normal') { void router.push({query:{...route.query, section:key, ...(key==='gen' ? {mode} : {mode:undefined}), ...(key==='publish' ? {tab:'creations'} : {tab:undefined})}}); }
function selectPublishRecords() { void router.push({query:{...route.query, section:'publish', tab:'records', mode:undefined}}); }
</script>
<template>
  <div v-if="project" class="flex h-full min-w-0">
    <aside class="flex w-56 shrink-0 flex-col border-r border-slate-100 px-3 py-4 xl:w-60">
      <div class="mb-5">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button type="button" aria-label="切换项目" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-200">
              <span class="h-3.5 w-3.5 shrink-0 rounded-md" :style="{ background: project.color }" />
              <span class="min-w-0 flex-1 truncate text-left">{{ project.name }}</span>
              <ChevronDown class="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" :side-offset="8" class="w-64 max-w-[calc(100vw-32px)] rounded-2xl border-slate-200 bg-white p-1.5 shadow-lg" aria-label="项目列表">
            <div class="max-h-72 overflow-y-auto">
              <DropdownMenuItem v-for="p in studio.projects.filter(p=>!p.archived)" :key="p.id" class="my-0.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm" :class="p.id === project.id ? 'bg-sky-50 text-sky-600' : 'text-slate-700'" :aria-current="p.id === project.id ? 'page' : undefined" @select="router.push(`/projects/${p.id}`)">
                <span class="h-3.5 w-3.5 shrink-0 rounded-md" :style="{ background: p.color }" />
                <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                <Check v-if="p.id === project.id" class="h-4 w-4 shrink-0 text-sky-600" />
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator class="my-1.5 bg-slate-100" />
            <DropdownMenuItem class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700" @select="router.push('/projects/new')">
              <FolderPlus class="h-4 w-4 text-slate-500" />新建项目
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav aria-label="项目导航">
        <p class="mb-2 px-3 text-[11px] font-medium text-slate-400">创作</p>
        <button v-for="n in creationNav" :key="n.mode" class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px]" :class="section==='gen' && (route.query.mode==='expert'?'expert':'normal')===n.mode ? 'bg-sky-50 font-medium text-sky-600':'text-slate-500 hover:bg-slate-50'" :aria-current="section==='gen' && (route.query.mode==='expert'?'expert':'normal')===n.mode ? 'page':undefined" @click="select('gen', n.mode)">
          <component :is="n.icon" class="h-4 w-4" />{{n.label}}
        </button>
        <p class="mb-2 mt-7 px-3 text-[11px] font-medium text-slate-400">管理</p>
        <template v-for="n in managementNav" :key="n.key">
          <button :data-video-management="n.key === 'publish' ? '' : undefined" class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px]" :class="section===n.key && !isPublishRecords?'bg-sky-50 font-medium text-sky-600':'text-slate-500 hover:bg-slate-50'" :aria-current="section===n.key && !isPublishRecords?'page':undefined" @click="select(n.key)">
            <component :is="n.icon" class="h-4 w-4" />{{n.label}}
          </button>
          <button v-if="n.key === 'publish'" class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px]" :class="isPublishRecords?'bg-sky-50 font-medium text-sky-600':'text-slate-500 hover:bg-slate-50'" :aria-current="isPublishRecords?'page':undefined" @click="selectPublishRecords"><ListVideo class="h-4 w-4" />发布记录</button>
        </template>
      </nav>
      <button aria-label="项目设置" title="项目设置" class="mt-auto self-end rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-sky-600" @click="select('settings')"><Settings class="h-4 w-4" /></button>
    </aside>
    <main class="min-w-0 flex-1 overflow-y-auto scroll-slim"><div v-if="project.archived" class="m-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">该项目已归档，仅供查看。<button class="ml-4 underline" @click="project.archived=false">恢复项目</button></div><StudioCreation v-if="section==='gen'" :project-id="project.id" /><div v-else class="p-6"><header v-if="section !== 'publish' && !(section === 'publish' && route.query.tab === 'configure')" class="mb-6"><h1 class="text-xl font-semibold text-slate-800">{{nav.find(n=>n.key===section)?.label}}</h1><p class="mt-2 text-xs text-slate-400">{{project.name}} · {{section==='analytics'?'用真实的数据边界，理解每一条内容':'让创作与管理保持有序'}}</p></header><ProductsPanel v-if="section==='product'" /><StudioPublishing v-if="section==='publish'" :project-id="project.id" /><StudioAnalytics v-if="section==='analytics'" :project-id="project.id" /><StudioSettings v-if="section==='settings'" :project-id="project.id" /></div></main>
  </div>
  <div v-else class="p-16 text-center"><h1 class="text-xl">项目不存在</h1><p class="my-4 text-sm text-slate-400">项目可能已删除，或属于另一个工作空间。</p><button class="studio-primary" @click="router.push('/')">返回项目</button></div>
</template>
