<script setup lang="ts">
import {
  CircleHelp,
  ExternalLink,
  FolderKanban,
  FolderOpen,
  Gift,
  Lightbulb,
  MonitorPlay,
  Megaphone,
  ShoppingBag,
  Users,
  UsersRound,
} from 'lucide-vue-next';
import { currentUser } from '@/services/identity';
import { guideTour } from '@/services/guideTour';
import { isTeamAdmin, isTeamMember } from '@/services/team';
import ProfileQuickMenu from './ProfileQuickMenu.vue';
import RewardsDialogs from './RewardsDialogs.vue';
import CreditBalance from './CreditBalance.vue';
import { cn } from '@/lib/utils';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const mainNav = [
  {
    to: '/',
    label: '项目',
    icon: FolderKanban,
    match: (path: string) => path === '/' || path.startsWith('/projects'),
  },
  { to: '/assets', label: '素材库', icon: FolderOpen, match: (path: string) => path.startsWith('/assets') },
  {
    to: '/inspiration',
    label: '爆款视频',
    icon: Lightbulb,
    match: (path: string) => ['/inspiration', '/notes', '/create', '/trends'].some((p) => path.startsWith(p)),
  },
  {
    to: '/accounts',
    label: '帐号管理',
    icon: Users,
    match: (path: string) => path.startsWith('/accounts') || path.startsWith('/roxy'),
  },
  { to: '/team', label: '团队协作', icon: UsersRound, match: (path: string) => path.startsWith('/team') },
  { to: '/promotion', label: '推广计划', icon: Megaphone, match: (path: string) => path === '/promotion' },
];

const router = useRouter();
const location = useRoute();
const visibleNav = computed(() =>
  mainNav.filter((item) => item.to !== '/team' || isTeamAdmin.value || isTeamMember.value),
);
const demoPanelOpen = ref(false);
const rewardsDialogs = ref<InstanceType<typeof RewardsDialogs>>();
const creditBalance = ref<InstanceType<typeof CreditBalance>>();
const demoTrigger = ref<HTMLButtonElement | null>(null);
const demoPanel = ref<HTMLDivElement | null>(null);

function closeDemoPanel() {
  demoPanelOpen.value = false;
}

function handleOutsidePointer(event: PointerEvent) {
  const target = event.target;
  if (
    demoPanelOpen.value &&
    target instanceof Node &&
    !demoTrigger.value?.contains(target) &&
    !demoPanel.value?.contains(target)
  ) {
    closeDemoPanel();
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && demoPanelOpen.value) {
    closeDemoPanel();
    demoTrigger.value?.focus();
  }
}

function startGuideTour() {
  closeDemoPanel();
  if (currentUser.value) guideTour.start(currentUser.value.id);
}

function openRoxyBrowser() {
  closeDemoPanel();
  void router.push('/roxy-browser-demo');
}

function openRoxyWebsite() {
  closeDemoPanel();
  void router.push('/roxy-website-demo');
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointer);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointer);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <aside aria-label="一级导航" class="fixed inset-y-0 left-0 z-50 flex w-[92px] flex-col bg-[#eef0f3]">
    <div class="flex h-14 shrink-0 items-center justify-center">
      <img src="/favicon.svg" alt="Roxy出海内容宣发平台" title="Roxy出海内容宣发平台" class="h-10 w-10" />
    </div>
    <nav class="flex min-h-0 flex-col items-center gap-1 overflow-y-auto px-2 pt-1">
      <template v-for="item in visibleNav" :key="item.to">
        <div
          v-if="item.to === '/promotion'"
          role="separator"
          aria-label="推广计划分隔线"
          class="my-3 w-12 shrink-0 border-t border-slate-300/70"
        />
        <RouterLink
          :to="item.to"
          :aria-label="item.label"
          :aria-current="item.match(location.path) ? 'page' : undefined"
          :data-tour="item.to === '/' ? 'projects' : item.to === '/accounts' ? 'accounts-nav' : undefined"
          :class="
            cn(
              'flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-colors',
              item.match(location.path)
                ? 'bg-white font-medium text-sky-600 shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
            )
          "
        >
          <component
            :is="item.icon"
            :class="cn('h-5 w-5 shrink-0', item.to === '/promotion' && 'fill-orange-100 text-orange-500')"
          />
          <span class="w-full truncate text-center text-[11px] leading-4">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>
    <div class="relative mt-auto shrink-0 px-2 pb-3 pt-3">
      <button
        ref="demoTrigger"
        type="button"
        aria-label="演示"
        aria-haspopup="dialog"
        :aria-expanded="demoPanelOpen"
        aria-controls="demo-panel"
        class="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-slate-500 transition-colors hover:bg-white/70 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
        @click="demoPanelOpen = !demoPanelOpen"
      >
        <MonitorPlay class="h-5 w-5" aria-hidden="true" />
        <span class="text-[11px] leading-4">演示</span>
      </button>
      <div
        v-if="demoPanelOpen"
        id="demo-panel"
        ref="demoPanel"
        role="dialog"
        aria-label="选择演示内容"
        class="fixed bottom-3 left-[100px] z-50 max-h-[calc(100dvh-24px)] w-64 max-w-[calc(100vw-112px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
      >
        <div class="mb-2 flex items-start justify-between gap-2 px-1 py-1">
          <div>
            <p class="text-sm font-semibold text-slate-800">选择演示内容</p>
            <p class="mt-1 text-[11px] text-slate-400">快速前往想展示的页面</p>
          </div>
          <button
            type="button"
            aria-label="关闭演示面板"
            class="rounded-md px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            @click="closeDemoPanel"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
          @click="startGuideTour"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <CircleHelp class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span class="block text-[13px] font-medium text-slate-700">新手引导</span>
            <span class="mt-0.5 block text-[11px] text-slate-400">了解平台基础流程</span>
          </span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
          @click="openRoxyBrowser"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <MonitorPlay class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span class="block text-[13px] font-medium text-slate-700">Roxy 浏览器</span>
            <span class="mt-0.5 block text-[11px] text-slate-400">进入窗口管理演示</span>
          </span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
          @click="openRoxyWebsite"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
          >
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span class="block text-[13px] font-medium text-slate-700">Roxy 官网</span>
            <span class="mt-0.5 block text-[11px] text-slate-400">查看官网风格演示</span>
          </span>
        </button>
      </div>
    </div>
  </aside>
  <header
    aria-label="全局快捷操作"
    class="fixed left-[104px] right-3 top-3 z-40 flex h-16 items-center justify-end gap-0 rounded-t-[20px] border-b border-slate-100 bg-white px-1 sm:gap-2 sm:px-8"
  >
    <button
      type="button"
      aria-label="签到领好礼"
      title="签到领好礼"
      class="flex h-10 shrink-0 items-center gap-2 rounded-xl px-1.5 text-sm text-orange-500 transition-colors hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 max-[380px]:px-1 sm:px-3"
      @click="
        closeDemoPanel();
        rewardsDialogs?.openCheckIn();
      "
    >
      <Gift class="h-5 w-5" aria-hidden="true" />
      <span class="hidden md:inline">签到领好礼</span>
      <span class="hidden rounded-full bg-orange-50 px-2 py-0.5 text-[11px] xl:inline">每日+10积分</span>
    </button>
    <RouterLink
      v-if="!isTeamMember"
      to="/purchase"
      aria-label="套餐购买"
      :aria-current="location.path === '/purchase' ? 'page' : undefined"
      :class="
        cn(
          'flex h-10 items-center gap-2 rounded-xl px-1.5 text-sm transition-colors max-[380px]:px-1 sm:px-3',
          location.path === '/purchase'
            ? 'bg-sky-50 font-medium text-sky-600'
            : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600',
        )
      "
    >
      <ShoppingBag class="h-5 w-5" aria-hidden="true" />
      <span class="hidden lg:inline">套餐购买</span>
    </RouterLink>
    <CreditBalance ref="creditBalance" />
    <ProfileQuickMenu />
  </header>
  <RewardsDialogs
    ref="rewardsDialogs"
    @claimed="creditBalance?.claimed($event)"
    @closed="creditBalance?.cancel()"
    @reset="creditBalance?.cancel()"
  />
</template>
