<script setup lang="ts">
import {
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  Monitor,
  BarChart3,
  ListChecks,
  Plus,
  Search,
  Orbit,
  ChevronRight,
  Coins,
} from 'lucide-vue-next';
import { projects } from '@/data/mock';
import { cn } from '@/lib/utils';
import { RouterLink, useRouter, useRoute } from 'vue-router';
const mainNav = [
  {
    to: '/',
    label: '工作台',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/inspiration',
    label: '创意中心',
    icon: Lightbulb,
  },
  {
    to: '/create',
    label: '自由创作',
    icon: Sparkles,
  },
  {
    to: '/accounts',
    label: '窗口管理',
    icon: Monitor,
  },
  {
    to: '/analytics',
    label: '数据分析',
    icon: BarChart3,
  },
  {
    to: '/tasks',
    label: '任务管理',
    icon: ListChecks,
  },
];
const router = useRouter();
const location = useRoute();
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200/80 bg-white">
    <div class="flex h-14 items-center gap-2.5 px-4">
      <div
        class="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md shadow-sky-300/40"
      >
        <Orbit class="h-5 w-5 text-white"></Orbit>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[13.5px] font-semibold text-slate-800">出海动力</div>
        <div class="text-[10.5px] text-slate-400">出海增长组</div>
      </div>
      <button
        class="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
        title="折叠侧边栏"
      >
        <ChevronRight class="h-4 w-4"></ChevronRight>
      </button>
    </div>
    <nav class="mt-1 space-y-0.5 px-2.5">
      <template :key="to" v-for="{ to, label, icon: Icon, end } in mainNav">
        <RouterLink
          :to="to"
          :end="end"
          :class="
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
              (end ? location.path === to : location.path.startsWith(to))
                ? 'bg-sky-50 font-medium text-sky-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )
          "
        >
          <component :is="Icon" class="h-4 w-4 shrink-0"></component>
          {{ label }}
        </RouterLink>
      </template>
    </nav>
    <div class="mt-4 flex-1 overflow-y-auto scroll-slim px-2.5 pb-2">
      <div class="mb-1.5 flex items-center justify-between px-2.5">
        <span class="text-[11px] font-medium tracking-wider text-slate-400">项目</span>
        <button class="rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500" title="搜索项目">
          <Search class="h-3.5 w-3.5"></Search>
        </button>
      </div>
      <button
        @click="router.push('/projects')"
        class="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
      >
        <span class="flex h-4 w-4 items-center justify-center rounded border border-slate-300">
          <Plus class="h-3 w-3"></Plus>
        </span>
        新建项目
      </button>
      <div class="space-y-0.5">
        <template :key="p.id" v-for="p in projects">
          <button
            @click="router.push(`/projects/${p.id}`)"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors',
                location.path === `/projects/${p.id}`
                  ? 'bg-slate-50 font-medium text-slate-800'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <span
              class="h-3.5 w-3.5 shrink-0 rounded-[5px]"
              :style="{
                backgroundColor: p.color,
              }"
            ></span>
            <span class="truncate">{{ p.name }}</span>
          </button>
        </template>
        <button
          @click="router.push('/projects')"
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[12px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        >
          <span class="w-3.5"></span>
          全部项目 →
        </button>
      </div>
    </div>
    <div class="border-t border-slate-100 px-2.5 py-2.5">
      <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div class="flex items-center gap-2">
          <Coins class="h-4 w-4 text-amber-500"></Coins>
          <span class="text-[12.5px] font-medium text-slate-700">积分</span>
          <span class="ml-auto text-[13px] font-semibold tabular-nums text-slate-800">1,280</span>
        </div>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            class="brand-gradient h-full rounded-full"
            :style="{
              width: '64%',
            }"
          ></div>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-400">
          <span>本月已用 2,240 / 3,520</span>
          <button
            @click="router.push('/me')"
            class="font-medium text-sky-600 transition-colors hover:text-sky-700"
          >
            获取积分
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
