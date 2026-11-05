<script setup lang="ts">
import { FolderKanban, FolderOpen, Lightbulb, Users, BarChart3 } from 'lucide-vue-next';
import { creditsBalance } from '@/services/credits';
import { currentUser } from '@/services/identity';
import { Avatar, AvatarFallback } from '@/components/ui';
import { CreditsIcon } from '@/components/shared';
import { cn } from '@/lib/utils';
import { RouterLink, useRouter, useRoute } from 'vue-router';

const mainNav = [
  { to: '/', label: '项目', icon: FolderKanban, match: (path: string) => path === '/' || path.startsWith('/projects') },
  { to: '/assets', label: '素材库', icon: FolderOpen, match: (path: string) => path.startsWith('/assets') },
  { to: '/inspiration', label: '爆款视频', icon: Lightbulb, match: (path: string) => ['/inspiration', '/notes', '/create', '/trends'].some(p => path.startsWith(p)) },
  { to: '/accounts', label: '帐号管理', icon: Users, match: (path: string) => path.startsWith('/accounts') || path.startsWith('/roxy') },
  { to: '/analytics', label: '数据分析', icon: BarChart3, match: (path: string) => path.startsWith('/analytics') },
];

const router = useRouter();
const location = useRoute();
</script>

<template>
  <aside
    aria-label="一级导航"
    class="fixed inset-y-0 left-0 z-40 flex w-[92px] flex-col bg-[#eef0f3]"
  >
    <div class="flex h-14 items-center justify-center">
      <img src="/favicon.svg" alt="Roxy出海内容宣发平台" title="Roxy出海内容宣发平台" class="h-10 w-10" />
    </div>
    <nav class="flex flex-col items-center gap-1 px-2 pt-1">
      <RouterLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        :aria-label="item.label"
        :class="
          cn(
            'flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-colors',
            item.match(location.path)
              ? 'bg-white font-medium text-sky-600 shadow-sm'
              : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
          )
        "
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span class="w-full truncate text-center text-[11px] leading-4">{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div class="mt-auto border-t border-slate-200/70 px-1.5 py-3">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800"
        title="积分"
        @click="router.push('/me')"
      >
        <CreditsIcon class="h-4 w-4" />
        <span class="text-[13px] font-semibold tabular-nums text-slate-800" aria-label="积分余额">{{ creditsBalance.toLocaleString() }}</span>
      </button>
      <button
        type="button"
        title="个人中心"
        aria-label="个人中心"
        :class="
          cn(
            'mt-1 flex w-full items-center justify-center rounded-xl px-1 py-2.5 transition-colors',
            location.path === '/me' ? 'bg-white shadow-sm' : 'hover:bg-white/70',
          )
        "
        @click="router.push('/me')"
      >
        <Avatar class="h-9 w-9 border border-slate-200">
          <AvatarFallback class="brand-gradient text-[12px] font-semibold text-white">{{ currentUser?.name.slice(0,2).toUpperCase() ?? 'LY' }}</AvatarFallback>
        </Avatar>
      </button>
    </div>
  </aside>
</template>
