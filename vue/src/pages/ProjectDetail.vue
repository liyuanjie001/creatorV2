<script setup lang="ts">
import {
  Sparkles,
  CreditCard,
  Lightbulb,
  Users,
  Rocket,
  CalendarClock,
  MousePointerClick,
  ChevronDown,
  FolderPlus,
} from 'lucide-vue-next';
import CreationConsole from '@/components/CreationConsole.vue';
import { cn } from '@/lib/utils';
import BriefPanel from '@/components/projects/BriefPanel.vue';
import ChatPanel from '@/components/projects/ChatPanel.vue';
import DirectorPanel from '@/components/projects/DirectorPanel.vue';
import { projects } from '@/data/mock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
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
  gen: '自由创作',
  brief: '项目简报',
  product: '产品卡',
  inspire: '灵感库',
  element: '元素',
  canvas: 'Canvas',
  chat: 'AI 聊天',
  director: 'AI 导演',
  account: '账号管理',
  publish: '发布管理',
  attribution: '数据归因',
  schedule: '任务调度',
  trash: '回收站',
};
const primaryNav: { key: SectionKey; label: string; icon: typeof Sparkles }[] = [
  { key: 'gen', label: '自由创作', icon: Sparkles },
  { key: 'product', label: '产品卡', icon: CreditCard },
  { key: 'inspire', label: '灵感库', icon: Lightbulb },
];
const manageNav: { key: SectionKey; label: string; icon: typeof Sparkles }[] = [
  { key: 'account', label: '账号管理', icon: Users },
  { key: 'publish', label: '发布管理', icon: Rocket },
  { key: 'attribution', label: '数据归因', icon: MousePointerClick },
  { key: 'schedule', label: '任务调度', icon: CalendarClock },
];
const comingSoonSections = new Set<SectionKey>(['account', 'publish', 'attribution', 'schedule']);
const comingSoonCopy: Partial<
  Record<SectionKey, { desc: string; highlights: string[] }>
> = {
  account: {
    desc: '项目账号与窗口身份统一管理，协作更顺畅。批量开号、巡检状态，为自动发布打好底座。',
    highlights: ['多号绑定', '状态巡检', '发布底座'],
  },
  publish: {
    desc: '创作完成后一键分发多平台，曝光节奏可控。封面文案一次配置，多号复用更省心。',
    highlights: ['批量发布', '素材复用', '进度追踪'],
  },
  attribution: {
    desc: '串起播放到转化，看清真正带来增长的内容。爆款与低效分层，让数据反哺下一轮创作。',
    highlights: ['三维归因', '爆款分层', '数据反哺'],
  },
  schedule: {
    desc: '按日历自动排期，让矩阵内容持续稳定输出。创作到发布节点可视，少盯档、多打磨。',
    highlights: ['日历排期', '节点可视', '人效提升'],
  },
};
import { computed, ref, watch } from 'vue';
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
import ComingSoonMask from '@/components/ComingSoonMask.vue';
const { project, section, generating, related, handleDone, router } = useProjectWorkspace();

const showComingSoon = ref(false);
const hasCreationHistory = computed(() => related.value.length > 0 || generating.value);
const isComingSoonSection = computed(() => comingSoonSections.has(section.value));
const comingSoonMeta = computed(
  () =>
    comingSoonCopy[section.value] ?? {
      desc: '全新管理能力即将上线，助力项目从创作到发布、归因形成完整闭环。',
      highlights: [] as string[],
    },
);

watch(section, () => {
  showComingSoon.value = false;
});

function switchProject(id: string) {
  if (id === project.value.id) return;
  void router.push(`/projects/${id}`);
}
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <aside aria-label="项目栏目" class="flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div class="flex-1 overflow-y-auto scroll-slim px-3 pb-2 pt-5">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              aria-label="切换项目"
              class="mb-4 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <span
                class="h-3.5 w-3.5 shrink-0 rounded-[5px]"
                :style="{
                  backgroundColor: project.color,
                }"
              ></span>
              <span class="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-800">{{
                project.name
              }}</span>
              <ChevronDown class="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            class="w-56 border-slate-200 bg-white p-1 text-slate-800 shadow-lg"
          >
            <DropdownMenuItem
              v-for="item in projects"
              :key="item.id"
              class="cursor-pointer gap-2 focus:bg-sky-50"
              @click="switchProject(item.id)"
            >
              <span
                class="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                :style="{ backgroundColor: item.color }"
              />
              <span class="truncate" :class="item.id === project.id ? 'font-medium text-sky-600' : ''">{{
                item.name
              }}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="bg-slate-100" />
            <DropdownMenuItem
              class="cursor-pointer gap-2 focus:bg-sky-50"
              @click="router.push('/projects/new')"
            >
              <FolderPlus class="h-3.5 w-3.5 text-slate-400" />
              新建项目
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <nav class="space-y-0.5">
          <button
            v-for="item in primaryNav"
            :key="item.key"
            @click="section = item.key"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] transition-colors',
                section === item.key
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span class="flex-1 text-left">{{ item.label }}</span>
          </button>
        </nav>
        <div class="mb-1.5 mt-6 px-2 text-[11px] font-medium tracking-wider text-slate-400">管理</div>
        <nav class="space-y-0.5">
          <button
            v-for="item in manageNav"
            :key="item.key"
            @click="section = item.key"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] transition-colors',
                section === item.key
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            <span class="flex-1 text-left">{{ item.label }}</span>
          </button>
        </nav>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex-1 overflow-y-auto scroll-slim">
        <template v-if="section === 'gen'">
          <div class="pb-16 pt-10">
            <div
              class="mx-auto max-w-4xl px-6"
              :class="!hasCreationHistory && 'translate-y-[200px]'"
            >
              <h1 class="text-center text-[28px] font-bold brand-text">让你的品牌故事鲜活起来</h1>
              <p class="mt-2 text-center text-[13px] text-slate-500">
                可选择产品卡与目标项目；未选项目时点击生成会自动新建项目
              </p>
              <CreationConsole
                class="mt-8"
                :project-id="project.id"
                placeholder="描述你的场景，使用 @ 添加产品卡信息"
                @start="generating = true"
                @done="handleDone"
              />
            </div>
            <div v-if="hasCreationHistory" class="mt-10 px-6">
              <GenerationsPanel />
            </div>
          </div>
        </template>
        <div v-else class="relative min-h-full px-6 py-5">
          <div :class="isComingSoonSection && showComingSoon && 'pointer-events-none select-none'">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-lg font-semibold text-slate-800">
                {{ sectionTitles[section] }}
              </h1>
              <ComingSoonMask v-if="isComingSoonSection" @open="showComingSoon = true" />
            </div>
            <div class="mt-5">
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
          </div>
          <ComingSoonMask
            v-if="isComingSoonSection && showComingSoon"
            mode="page"
            :title="`${sectionTitles[section]} · 敬请期待`"
            :desc="comingSoonMeta.desc"
            :highlights="comingSoonMeta.highlights"
            @back="showComingSoon = false"
          />
        </div>
      </div>
    </div>
  </div>
</template>
