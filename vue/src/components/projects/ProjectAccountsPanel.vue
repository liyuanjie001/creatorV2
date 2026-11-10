<script setup lang="ts">
import { Button } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { Monitor, ArrowRight } from 'lucide-vue-next';
import { useWindowManager } from '@/composables/useWindowManager';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const manager = useWindowManager();
const { project, projectWindows, router } = useProjectWorkspaceContext();
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-[12px] text-slate-500">
        当前项目已同步 {{ projectWindows.length }} 个窗口 · 每个窗口可登录多个平台
      </p>
      <Button
        variant="outline"
        size="sm"
        class="border-slate-200 text-sky-600"
        @click="router.push({ path: '/roxy', query: { project: project.id } })"
      >
        管理与同步窗口
        <ArrowRight class="h-3.5 w-3.5" />
      </Button>
    </div>
    <div
      v-if="!projectWindows.length"
      class="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center"
    >
      <Monitor class="mx-auto mb-4 h-9 w-9 text-slate-200" />
      <p class="text-[14px] font-medium text-slate-600">当前项目尚未同步窗口</p>
      <p class="mt-2 text-[12px] text-slate-400">
        在窗口管理中绑定 RoxyBrowser，并勾选「{{ project.name }}」进行同步。
      </p>
      <Button
        class="brand-gradient mt-5 text-white"
        @click="router.push({ path: '/roxy', query: { project: project.id } })"
      >
        去同步窗口
      </Button>
    </div>
    <div
      v-for="window in projectWindows"
      :key="window.id"
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div class="flex items-center gap-2">
          <Monitor class="h-4 w-4 text-sky-500" />
          <span class="text-[13px] font-medium text-slate-700">{{ window.name }}</span>
          <span class="text-[11px] text-slate-400">#{{ window.serial }} · {{ window.region }}</span>
        </div>
        <button
          class="text-[12px] text-sky-600"
          @click="router.push({ path: '/roxy', query: { window: window.id } })"
        >
          查看窗口详情
        </button>
      </div>
      <div v-if="!manager.windowAccounts(window.id).length" class="px-4 py-6 text-[12px] text-slate-400">
        窗口尚未登录任何平台账号
      </div>
      <div
        v-for="account in manager.windowAccounts(window.id)"
        :key="account.id"
        class="flex items-center gap-4 border-b border-slate-50 px-4 py-3 last:border-0"
      >
        <PlatformBadge :platform="account.platform" />
        <div class="min-w-0 flex-1">
          <p class="text-[12px] font-medium text-slate-700">{{ account.name }}</p>
          <p class="mt-1 truncate text-[11px] text-slate-400">{{ account.handle }}</p>
        </div>
        <button
          class="text-[11px] text-sky-600"
          @click="
            router.push({
              path: '/analytics',
              query: {
                tab: 'accounts',
                project: project.id,
                window: window.id,
                platform: account.platform,
                account: account.id,
              },
            })
          "
        >
          查看数据
        </button>
        <span
          class="rounded-full px-2 py-1 text-[10px]"
          :class="account.status === '正常' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
        >
          {{ account.status }}
        </span>
      </div>
    </div>
  </div>
</template>
