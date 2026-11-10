<script setup lang="ts">
import { Bell, Search, FolderOpen, Sparkles } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui';
import { notifications } from '@/data/mock';
import InspireGenPanel from '@/components/InspireGenPanel.vue';
import { useRouter } from 'vue-router';
import { useInspirationDialog } from '@/composables/useInspirationDialog';
const router = useRouter();
const { inspireOpen } = useInspirationDialog();
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-100 bg-white px-6"
  >
    <div class="relative w-72">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      ></Search>
      <Input
        placeholder="搜索项目、任务、灵感、账号…"
        class="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
      ></Input>
      <kbd
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400"
      >
        ⌘K
      </kbd>
    </div>
    <div class="ml-auto flex items-center gap-2">
      <Dialog :open="inspireOpen" @update:open="inspireOpen = $event">
        <DialogTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="gap-2 border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700"
          >
            <Sparkles class="h-3.5 w-3.5"></Sparkles>
            AI 灵感生成
          </Button>
        </DialogTrigger>
        <DialogContent
          class="max-h-[85vh] max-w-3xl overflow-y-auto scroll-slim border-slate-200 bg-white p-6"
        >
          <DialogHeader>
            <DialogTitle class="text-[16px] text-slate-800">AI 灵感生成</DialogTitle>
            <DialogDescription class="text-[12.5px]">
              填入零碎想法，AI 自动整合、补充，整理成可执行的宣发方案
            </DialogDescription>
          </DialogHeader>
          <div class="mt-2">
            <InspireGenPanel @confirm="inspireOpen = false"></InspireGenPanel>
          </div>
        </DialogContent>
      </Dialog>
      <Button
        size="sm"
        class="gap-2 brand-gradient text-white hover:opacity-90"
        @click="router.push('/assets')"
      >
        <FolderOpen class="h-4 w-4"></FolderOpen>
        素材库
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="relative text-slate-500 hover:text-slate-800">
            <Bell class="h-5 w-5"></Bell>
            <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-80 border-slate-200 bg-white text-slate-800 shadow-lg">
          <DropdownMenuLabel class="text-slate-500">通知中心</DropdownMenuLabel>
          <DropdownMenuSeparator class="bg-slate-100"></DropdownMenuSeparator>
          <template :key="n.id" v-for="n in notifications">
            <DropdownMenuItem class="cursor-pointer items-start gap-2 focus:bg-slate-50">
              <span
                :class="`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.unread ? 'bg-sky-500' : 'bg-slate-200'}`"
              ></span>
              <span>
                <span class="block text-[13px] leading-snug text-slate-700">{{ n.text }}</span>
                <span class="text-[11px] text-slate-400">{{ n.time }}</span>
              </span>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-slate-100"
          >
            <Avatar class="h-8 w-8 border border-slate-200">
              <AvatarFallback class="brand-gradient text-xs font-semibold text-white">LY</AvatarFallback>
            </Avatar>
            <div class="text-left">
              <div class="text-[13px] leading-tight text-slate-800">林悦</div>
              <div class="text-[11px] leading-tight text-slate-400">运营负责人</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44 border-slate-200 bg-white text-slate-800 shadow-lg">
          <DropdownMenuItem class="cursor-pointer focus:bg-slate-50" @click="router.push('/me')">
            个人中心
          </DropdownMenuItem>
          <DropdownMenuItem
            class="cursor-pointer focus:bg-slate-50"
            @click="router.push('/settings?tab=team')"
          >
            团队设置
          </DropdownMenuItem>
          <DropdownMenuSeparator class="bg-slate-100"></DropdownMenuSeparator>
          <DropdownMenuItem class="cursor-pointer text-rose-500 focus:bg-slate-50">退出登录</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
