<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight, Globe2, Zap } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { PlatformBadge, HeatBar } from '@/components/shared';
import { trends, exposureTrend } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { ref } from 'vue';
import DataChart from '@/components/DataChart.vue';
const regions = ['全球', '美国', '欧洲', '东南亚', '日本', '中东'] as const;
const region = ref<(typeof regions)[number]>('全球');
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <Globe2 class="h-4 w-4 text-slate-400"></Globe2>
      <template :key="r" v-for="r in regions">
        <button
          @click="region = r"
          :class="
            cn(
              'rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
              region === r
                ? 'brand-gradient font-medium text-white'
                : 'border border-slate-200 text-slate-500 hover:text-slate-800',
            )
          "
        >
          {{ r }}
        </button>
      </template>
      <Button
        variant="outline"
        size="sm"
        class="ml-auto gap-2 border-slate-200 text-slate-500 hover:text-slate-800"
        @click="toast.success('已订阅趋势预警（演示）')"
      >
        <Zap class="h-3.5 w-3.5 text-amber-500"></Zap>
        订阅趋势预警
      </Button>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <Card class="glass-card col-span-2 border-slate-200 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-[15px] font-medium text-slate-800">{{ region }} · 实时热搜榜</h3>
          <span class="text-[11px] text-slate-400">每 15 分钟更新 · 数据来自各平台公开热榜</span>
        </div>
        <div class="space-y-2.5">
          <template :key="t.rank" v-for="t in trends">
            <div
              class="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 transition-colors hover:border-sky-200"
            >
              <span
                :class="
                  cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                    t.rank <= 3 ? 'brand-gradient text-white' : 'bg-slate-100 text-slate-400',
                  )
                "
              >
                {{ t.rank }}
              </span>
              <div class="w-52 shrink-0">
                <div class="text-[13px] font-medium text-slate-800">
                  {{ t.keyword }}
                </div>
                <div class="text-[11px] text-slate-400">{{ t.category }} · {{ t.region }}</div>
              </div>
              <div class="w-24 shrink-0">
                <PlatformBadge :platform="t.platform"></PlatformBadge>
              </div>
              <div class="min-w-0 flex-1">
                <HeatBar :value="t.heat"></HeatBar>
              </div>
              <span
                :class="
                  cn(
                    'flex w-16 shrink-0 items-center justify-end gap-0.5 text-[12px] font-medium',
                    t.change >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  )
                "
              >
                <template v-if="t.change >= 0"><ArrowUpRight class="h-3.5 w-3.5"></ArrowUpRight></template>
                <template v-else><ArrowDownRight class="h-3.5 w-3.5"></ArrowDownRight></template>
                {{ Math.abs(t.change) }}%
              </span>
              <Button
                size="sm"
                variant="outline"
                class="shrink-0 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                @click="toast.info('已创建跟进任务（演示）')"
              >
                创作跟进
              </Button>
            </div>
          </template>
        </div>
      </Card>
      <div class="space-y-4">
        <Card class="glass-card border-slate-200 p-5">
          <h3 class="text-[15px] font-medium text-slate-800">站内曝光热度走势</h3>
          <p class="mt-0.5 text-[12px] text-slate-400">可用于对比话题生命周期</p>
          <div class="mt-3 h-40">
            <DataChart
              type="line"
              :data="exposureTrend.slice(-14)"
              :series="[{ name: '曝光', color: '#f472b6', type: 'line' }]"
              :legend="false"
            />
          </div>
        </Card>
        <Card class="glass-card border-slate-200 p-5">
          <h3 class="text-[15px] font-medium text-slate-800">上升话题词云</h3>
          <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <template
              :key="i"
              v-for="(w, i) in [
                '#CozyAutumn',
                'GRWM',
                'mini projector',
                'AI voiceover',
                'Black Friday',
                'sourdough',
                'VanLife',
                'DeskSetup',
                'ASMR unboxing',
                'ootd',
              ]"
            >
              <span
                :class="
                  cn(
                    'cursor-pointer rounded-full border px-2.5 py-1 transition-colors hover:border-sky-300 hover:text-sky-600',
                    i % 3 === 0
                      ? 'border-sky-200 text-sky-600 text-[13px]'
                      : i % 3 === 1
                        ? 'border-sky-100 text-sky-500 text-[12px]'
                        : 'border-slate-200 text-slate-400 text-[11px]',
                  )
                "
              >
                {{ w }}
              </span>
            </template>
          </div>
          <div
            class="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-[12px] leading-relaxed text-amber-700"
          >
            ⏰ 预警：「Black Friday deals」预计 5 天后进入爆发期，黑五预热项目已生成 3 条内容建议。
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
