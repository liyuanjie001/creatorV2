<script setup lang="ts">
import {
  ArrowLeft,
  FileText,
  Shapes,
  PenTool,
  MessageSquare,
  Clapperboard,
  Trash2,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Share2,
  UploadCloud,
  Send,
  Wand2,
  ShoppingBag,
  Lightbulb,
  Monitor,
  Rocket,
  MousePointerClick,
  CalendarClock,
  Layers,
  Orbit,
} from 'lucide-vue-next';
import { Button } from '@/components/ui';
import CreationConsole from '@/components/CreationConsole.vue';
import Topbar from '@/layout/Topbar.vue';
import { assetElements } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import BriefPanel from '@/components/projects/BriefPanel.vue';
import ChatPanel from '@/components/projects/ChatPanel.vue';
import DirectorPanel from '@/components/projects/DirectorPanel.vue';
import { RouterLink } from 'vue-router';
type SectionKey =
  | 'gen'
  | 'brief'
  | 'product'
  | 'inspire'
  | 'element'
  | 'canvas'
  | 'chat'
  | 'director'
  | 'account'
  | 'publish'
  | 'attribution'
  | 'schedule'
  | 'trash';
const sectionTitles: Record<SectionKey, string> = {
  gen: '全部生成',
  brief: '项目简报',
  product: '商品',
  inspire: '灵感库',
  element: '元素',
  canvas: 'Canvas',
  chat: 'AI 聊天',
  director: 'AI 导演',
  account: '窗口管理',
  publish: '发布管理',
  attribution: '数据归因',
  schedule: '任务调度',
  trash: '回收站',
};
import { useProjectWorkspace } from '@/composables/useProjectWorkspace';
import GenerationsPanel from '@/components/projects/GenerationsPanel.vue';
import ProductsPanel from '@/components/projects/ProductsPanel.vue';
import ProjectInspirationPanel from '@/components/projects/ProjectInspirationPanel.vue';
import ProjectElementsPanel from '@/components/projects/ProjectElementsPanel.vue';
import CanvasPanel from '@/components/projects/CanvasPanel.vue';
import ProjectAccountsPanel from '@/components/projects/ProjectAccountsPanel.vue';
import PublishingPanel from '@/components/projects/PublishingPanel.vue';
import AttributionPanel from '@/components/projects/AttributionPanel.vue';
import SchedulePanel from '@/components/projects/SchedulePanel.vue';
import ProjectTrashPanel from '@/components/projects/ProjectTrashPanel.vue';
import BatchGenerationDialog from '@/components/projects/BatchGenerationDialog.vue';
const {
  router,
  project,
  section,
  projectProducts,
  view,
  generating,
  batchOpen,
  batchProgress,
  batchDone,
  related,
  projectWindows,
  projectTasks,
  recs,
  handleDone,
} = useProjectWorkspace();
function goBack() {
  if (typeof router.options.history.state.back === 'string') router.back();
  else router.push('/projects');
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <aside class="flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div class="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <div
          class="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40"
        >
          <Orbit class="h-5 w-5 text-white"></Orbit>
        </div>
        <div class="min-w-0">
          <div class="text-[13.5px] font-semibold text-slate-800">出海动力</div>
          <div class="text-[10.5px] text-slate-400">项目工作区</div>
        </div>
      </div>
      <button
        aria-label="返回项目列表或上一页"
        @click="goBack()"
        class="mx-2.5 mb-1 mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-sky-600"
      >
        <ArrowLeft class="h-3.5 w-3.5"></ArrowLeft>
        返回
      </button>
      <div class="flex-1 overflow-y-auto scroll-slim px-2.5 pb-2">
        <div class="mb-3 flex items-center gap-2 px-2.5">
          <span
            class="h-3.5 w-3.5 shrink-0 rounded-[5px]"
            :style="{
              backgroundColor: project.color,
            }"
          ></span>
          <span class="truncate text-[13px] font-semibold text-slate-800">{{ project.name }}</span>
        </div>
        <nav class="space-y-0.5">
          <button
            @click="section = 'gen'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'gen'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Clapperboard class="h-4 w-4 shrink-0"></Clapperboard>
            <span class="flex-1 text-left">{{ '全部生成' }}</span>
            <template v-if="related.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ related.length }}</span>
            </template>
          </button>
          <button
            @click="section = 'brief'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'brief'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <FileText class="h-4 w-4 shrink-0"></FileText>
            <span class="flex-1 text-left">{{ '项目简报' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
          <button
            @click="section = 'product'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'product'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <ShoppingBag class="h-4 w-4 shrink-0"></ShoppingBag>
            <span class="flex-1 text-left">{{ '商品' }}</span>
            <template v-if="projectProducts.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ projectProducts.length }}</span>
            </template>
          </button>
          <button
            @click="section = 'inspire'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'inspire'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Lightbulb class="h-4 w-4 shrink-0"></Lightbulb>
            <span class="flex-1 text-left">{{ '灵感库' }}</span>
            <template v-if="recs.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ recs.length }}</span>
            </template>
          </button>
          <button
            @click="section = 'element'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'element'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Shapes class="h-4 w-4 shrink-0"></Shapes>
            <span class="flex-1 text-left">{{ '元素' }}</span>
            <template v-if="assetElements.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ assetElements.length }}</span>
            </template>
          </button>
        </nav>
        <div class="mb-1.5 mt-5 px-2.5 text-[11px] font-medium tracking-wider text-slate-400">工具</div>
        <nav class="space-y-0.5">
          <button
            @click="section = 'canvas'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'canvas'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <PenTool class="h-4 w-4 shrink-0"></PenTool>
            <span class="flex-1 text-left">{{ 'Canvas' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
          <button
            @click="section = 'chat'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'chat'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <MessageSquare class="h-4 w-4 shrink-0"></MessageSquare>
            <span class="flex-1 text-left">{{ 'AI 聊天' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
          <button
            @click="section = 'director'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'director'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Wand2 class="h-4 w-4 shrink-0"></Wand2>
            <span class="flex-1 text-left">{{ 'AI 导演' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
        </nav>
        <div class="mb-1.5 mt-5 px-2.5 text-[11px] font-medium tracking-wider text-slate-400">管理</div>
        <nav class="space-y-0.5">
          <button
            @click="section = 'account'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'account'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Monitor class="h-4 w-4 shrink-0"></Monitor>
            <span class="flex-1 text-left">{{ '窗口管理' }}</span>
            <template v-if="projectWindows.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ projectWindows.length }}</span>
            </template>
          </button>
          <button
            @click="section = 'publish'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'publish'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <Rocket class="h-4 w-4 shrink-0"></Rocket>
            <span class="flex-1 text-left">{{ '发布管理' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
          <button
            @click="section = 'attribution'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'attribution'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <MousePointerClick class="h-4 w-4 shrink-0"></MousePointerClick>
            <span class="flex-1 text-left">{{ '数据归因' }}</span>
            <template v-if="undefined !== undefined">
              <span class="text-[11px] text-slate-300">{{ undefined }}</span>
            </template>
          </button>
          <button
            @click="section = 'schedule'"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                section === 'schedule'
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <CalendarClock class="h-4 w-4 shrink-0"></CalendarClock>
            <span class="flex-1 text-left">{{ '任务调度' }}</span>
            <template v-if="projectTasks.length !== undefined">
              <span class="text-[11px] text-slate-300">{{ projectTasks.length }}</span>
            </template>
          </button>
        </nav>
      </div>
      <div class="border-t border-slate-100 px-2.5 py-2.5">
        <button
          @click="section = 'trash'"
          :class="
            cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
              section === 'trash'
                ? 'bg-sky-50 font-medium text-sky-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )
          "
        >
          <Trash2 class="h-4 w-4 shrink-0"></Trash2>
          回收站
        </button>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <Topbar></Topbar>
      <div class="flex-1 overflow-y-auto scroll-slim">
        <div class="px-6 py-5">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-semibold text-slate-800">
              {{ sectionTitles[section] }}
            </h1>
            <div class="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
                @click="toast.info('筛选（演示）')"
              >
                <SlidersHorizontal class="h-4 w-4"></SlidersHorizontal>
                筛选
              </Button>
              <div class="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  @click="view = 'grid'"
                  title="网格视图"
                  :class="
                    cn(
                      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                      view === 'grid' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
                    )
                  "
                >
                  <LayoutGrid class="h-4 w-4"></LayoutGrid>
                </button>
                <button
                  @click="view = 'list'"
                  title="列表视图"
                  :class="
                    cn(
                      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                      view === 'list' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600',
                    )
                  "
                >
                  <List class="h-4 w-4"></List>
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
                @click="toast.success('分享链接已复制（演示）')"
              >
                <Share2 class="h-4 w-4"></Share2>
                分享
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
                @click="toast.success('上传素材（演示）')"
              >
                <UploadCloud class="h-4 w-4"></UploadCloud>
                上传
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-9 gap-2 border-slate-200 text-slate-600 hover:text-slate-900"
                @click="
                  batchOpen = true;
                  batchDone = null;
                  batchProgress = 0;
                "
              >
                <Layers class="h-4 w-4"></Layers>
                批量生成
              </Button>
              <RouterLink :to="{ path: '/tasks/new', query: { project: project.id } }">
                <Button size="sm" class="h-9 gap-2 brand-gradient px-4 text-white hover:opacity-90">
                  <Send class="h-4 w-4"></Send>
                  发布
                </Button>
              </RouterLink>
            </div>
          </div>
          <div class="mt-5">
            <GenerationsPanel v-if="section === 'gen'" />
            <template v-if="section === 'brief'"><BriefPanel :projectId="project.id"></BriefPanel></template>
            <ProductsPanel v-if="section === 'product'" />
            <ProjectInspirationPanel v-if="section === 'inspire'" />
            <template v-if="section === 'chat'"><ChatPanel></ChatPanel></template>
            <template v-if="section === 'director'"><DirectorPanel></DirectorPanel></template>
            <ProjectElementsPanel v-if="section === 'element'" />
            <CanvasPanel v-if="section === 'canvas'" />
            <ProjectAccountsPanel v-if="section === 'account'" />
            <PublishingPanel v-if="section === 'publish'" />
            <AttributionPanel v-if="section === 'attribution'" />
            <SchedulePanel v-if="section === 'schedule'" />
            <ProjectTrashPanel v-if="section === 'trash'" />
          </div>
          <div class="sticky bottom-4 mt-8">
            <CreationConsole
              class="shadow-lg shadow-slate-200/60"
              :placeholder="`为「${project.name}」描述创作内容，使用 @ 添加角色和地点…`"
              @start="
                generating = true;
                section = 'gen';
              "
              @done="handleDone"
            ></CreationConsole>
          </div>
          <BatchGenerationDialog />
        </div>
      </div>
    </div>
  </div>
</template>
