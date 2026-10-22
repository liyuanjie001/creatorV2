<script setup lang="ts">
import { Flame, Copy, Bookmark, Sparkles } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { PlatformBadge, Thumb, HeatBar } from '@/components/shared';
import { toast } from 'vue-sonner';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { project, projectProducts, recs } = useProjectWorkspaceContext();
</script>

<template>
  <div>
    <div
      class="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-[12.5px] text-sky-700"
    >
      <Sparkles class="h-4 w-4 shrink-0"></Sparkles>
      基于本项目
      <template v-if="projectProducts.length > 0">
        的商品「{{ projectProducts.map((p) => p.name).join('、') }}」
      </template>
      和目标平台 {{ project.platforms.join(' / ') }} 推荐近期爆款
    </div>
    <div class="grid grid-cols-3 gap-4">
      <template :key="v.title" v-for="v in recs">
        <Card class="glass-card group overflow-hidden border-slate-200">
          <div class="relative">
            <Thumb class="aspect-video w-full">
              <span
                class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/85"
              >
                {{ v.duration }}
              </span>
              <span class="absolute left-2 top-2">
                <PlatformBadge :platform="v.platform"></PlatformBadge>
              </span>
              <span
                class="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-amber-300"
              >
                <Flame class="h-3 w-3"></Flame>
                热度 {{ v.heat }}
              </span>
            </Thumb>
            <div
              class="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Button
                size="sm"
                class="gap-1.5 brand-gradient text-white hover:opacity-90"
                @click="toast.success('已创建翻拍任务（演示）')"
              >
                <Copy class="h-3.5 w-3.5"></Copy>
                一键翻拍
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="gap-1.5 border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white"
                @click="toast.success('已收藏（演示）')"
              >
                <Bookmark class="h-3.5 w-3.5"></Bookmark>
                收藏
              </Button>
            </div>
          </div>
          <div class="p-4">
            <div class="text-[14px] font-medium leading-snug text-slate-800">
              {{ v.title }}
            </div>
            <div class="mt-1.5 text-[12px] text-slate-400">
              {{ v.author }} · {{ v.views }} 播放 · {{ v.likes }} 点赞
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <template :key="t" v-for="t in v.tags">
                <Badge
                  variant="outline"
                  class="border-slate-200 bg-slate-50 text-[11px] font-normal text-slate-500"
                >
                  #{{ t }}
                </Badge>
              </template>
            </div>
            <div class="mt-3">
              <HeatBar :value="v.heat"></HeatBar>
            </div>
          </div>
        </Card>
      </template>
    </div>
  </div>
</template>
