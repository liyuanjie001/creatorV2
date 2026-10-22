<script setup lang="ts">
import { Card } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { platformColors } from '@/data/mock';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { project } = useProjectWorkspaceContext();
const shares = [46, 31, 19];
</script>

<template>
  <div class="grid grid-cols-5 gap-4">
    <Card class="glass-card col-span-3 border-slate-200 p-5">
      <h3 class="mb-4 text-[14px] font-medium text-slate-800">转化漏斗（近 30 天）</h3>
      <div class="space-y-2.5">
        <template
          :key="f.label"
          v-for="f in [
            {
              label: '曝光',
              value: '1,248,300',
              pct: 100,
              rate: null,
            },
            {
              label: '点击',
              value: '96,400',
              pct: 68,
              rate: 'CTR 7.7%',
            },
            {
              label: '进站',
              value: '38,200',
              pct: 44,
              rate: '落地 39.6%',
            },
            {
              label: '加购',
              value: '6,180',
              pct: 26,
              rate: '转化 16.2%',
            },
            {
              label: '成交',
              value: '2,940',
              pct: 15,
              rate: '客单 $31.2',
            },
          ]"
        >
          <div class="flex items-center gap-3">
            <span class="w-10 shrink-0 text-[12px] text-slate-500">{{ f.label }}</span>
            <div class="h-7 flex-1 overflow-hidden rounded-lg bg-slate-50">
              <div
                class="brand-gradient flex h-full items-center rounded-lg pl-3"
                :style="{
                  width: `${f.pct}%`,
                  opacity: 0.35 + f.pct / 160,
                }"
              >
                <span class="text-[11.5px] font-medium text-white">{{ f.value }}</span>
              </div>
            </div>
            <template v-if="f.rate">
              <span class="w-24 shrink-0 text-right text-[11px] text-slate-400">{{ f.rate }}</span>
            </template>
          </div>
        </template>
      </div>
    </Card>
    <Card class="glass-card col-span-2 border-slate-200 p-5">
      <h3 class="mb-4 text-[14px] font-medium text-slate-800">成交归因 · 按平台</h3>
      <div class="space-y-4">
        <template :key="i" v-for="(p, i) in project.platforms">
          <div>
            <div class="mb-1 flex items-center justify-between text-[12px]">
              <span class="flex items-center gap-1.5 text-slate-600">
                <PlatformBadge :platform="p"></PlatformBadge>
              </span>
              <span class="font-medium text-slate-700">{{ shares[i % 3] }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${shares[i % 3]}%`,
                  backgroundColor: platformColors[p],
                }"
              ></div>
            </div>
            <div class="mt-1 text-[11px] text-slate-400">
              成交
              {{ Math.round((2940 * shares[i % 3]) / 100).toLocaleString() }}
              单
            </div>
          </div>
        </template>
      </div>
      <div
        class="mt-5 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-[11.5px] leading-relaxed text-sky-700"
      >
        TikTok 种草 → Instagram 复购路径贡献最高，建议加大 Reels 投放（演示洞察）
      </div>
    </Card>
  </div>
</template>
