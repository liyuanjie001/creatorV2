<script setup lang="ts">
import { Wand2, Sparkles, Check } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const {
  project,
  section,
  batchOpen,
  batchRunning,
  batchProgress,
  batchDone,
  batchCount,
  batchPlatforms,
  batchThemes,
  batchThemeDefs,
  batchStages,
  runBatch,
} = useProjectWorkspaceContext();
</script>

<template>
  <Dialog :open="batchOpen" @update:open="if (!batchRunning) batchOpen = $event;">
    <DialogContent class="border-slate-200 bg-white p-6 sm:max-w-xl">
      <DialogHeader>
        <DialogTitle class="text-[16px] text-slate-800">批量生成</DialogTitle>
        <DialogDescription class="text-[12.5px]">
          基于项目商品与主题，一次性生成多条内容并进入「全部生成」
        </DialogDescription>
      </DialogHeader>
      <template v-if="batchDone === null">
        <div class="mt-2 space-y-4">
          <div>
            <div class="mb-1.5 text-[12.5px] font-medium text-slate-600">生成数量</div>
            <div class="flex gap-1.5">
              <template :key="n" v-for="n in [10, 20, 30]">
                <button
                  @click="batchCount = n"
                  :class="
                    cn(
                      'rounded-lg border px-4 py-1.5 text-[12.5px] transition-colors',
                      batchCount === n
                        ? 'brand-gradient font-medium text-white'
                        : 'border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600',
                    )
                  "
                >
                  {{ n }} 条
                </button>
              </template>
              <span class="ml-auto self-center text-[11.5px] text-slate-400">
                预计消耗 {{ batchCount * 20 }} 积分
              </span>
            </div>
          </div>
          <div>
            <div class="mb-1.5 text-[12.5px] font-medium text-slate-600">发布平台（可多选）</div>
            <div class="flex flex-wrap gap-1.5">
              <template :key="p" v-for="p in project.platforms">
                <button
                  :aria-pressed="batchPlatforms.includes(p)"
                  @click="
                    batchPlatforms = batchPlatforms.includes(p)
                      ? batchPlatforms.filter((x) => x !== p)
                      : [...batchPlatforms, p]
                  "
                  :class="
                    cn(
                      'rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                      batchPlatforms.includes(p)
                        ? 'border-sky-300 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-400 hover:text-slate-600',
                    )
                  "
                >
                  {{ p }}
                </button>
              </template>
            </div>
          </div>
          <div>
            <div class="mb-1.5 text-[12.5px] font-medium text-slate-600">
              内容主题（可多选，不选则全部轮换）
            </div>
            <div class="flex flex-wrap gap-1.5">
              <template :key="t.key" v-for="t in batchThemeDefs">
                <button
                  @click="
                    batchThemes = batchThemes.includes(t.key)
                      ? batchThemes.filter((x) => x !== t.key)
                      : [...batchThemes, t.key]
                  "
                  :class="
                    cn(
                      'rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                      batchThemes.includes(t.key)
                        ? 'border-sky-300 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-400 hover:text-slate-600',
                    )
                  "
                >
                  {{ t.key }}
                </button>
              </template>
            </div>
          </div>
          <template v-if="batchRunning">
            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-center justify-between text-[12px] text-slate-500">
                <span class="flex items-center gap-1.5">
                  <Wand2 class="h-3.5 w-3.5 animate-spin text-sky-500"></Wand2>
                  正在{{ batchStages[Math.min(batchStages.length - 1, Math.floor(batchProgress / 25))] }}
                  · 第
                  {{ Math.min(batchCount, Math.max(1, Math.ceil((batchProgress / 100) * batchCount))) }}
                  / {{ batchCount }} 条
                </span>
                <span class="font-medium text-sky-600">{{ batchProgress }}%</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="brand-gradient h-full rounded-full transition-all duration-200"
                  :style="{
                    width: `${batchProgress}%`,
                  }"
                ></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-3 pt-1">
              <Button @click="runBatch" class="gap-2 brand-gradient px-6 text-white hover:opacity-90">
                <Sparkles class="h-4 w-4"></Sparkles>
                开始批量生成
              </Button>
              <span class="text-[11.5px] text-slate-400">AI 将自动轮换商品与主题，生成不同角度版本</span>
            </div>
          </template>
        </div>
      </template>
      <template v-else>
        <div class="mt-2">
          <div
            class="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-8 text-center"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Check class="h-6 w-6 text-emerald-600" :strokeWidth="2.5"></Check>
            </span>
            <div class="mt-3 text-[14.5px] font-semibold text-slate-800">批量生成完成</div>
            <p class="mt-1 text-[12.5px] text-slate-500">
              {{ batchDone }}
              条内容已加入「全部生成」，可在生成墙中预览并安排发布
            </p>
            <div class="mt-4 flex gap-2.5">
              <Button
                class="gap-2 brand-gradient px-5 text-white hover:opacity-90"
                @click="
                  batchOpen = false;
                  section = 'gen';
                "
              >
                查看结果
              </Button>
              <Button
                variant="outline"
                class="border-slate-200 text-slate-600 hover:text-slate-900"
                @click="
                  batchDone = null;
                  batchProgress = 0;
                "
              >
                再生成一批
              </Button>
            </div>
          </div>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
