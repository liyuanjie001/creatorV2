<script setup lang="ts">
import { User, Clock } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { projects, engagement7d, platformColors, type Platform } from '@/data/mock';
import DataChart from '@/components/DataChart.vue';
const { projectId } = defineProps<{
  projectId: string;
}>();
const project = projects.find((p) => p.id === projectId)!;
const mainPlatform = project.platforms[0] as Platform | undefined;
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-4 gap-4">
      <template
        :key="k.label"
        v-for="k in [
          {
            label: '累计曝光',
            value: project.exposure,
          },
          {
            label: '平均互动率',
            value: project.engagement,
          },
          {
            label: '已发布内容',
            value: `${project.contentCount} 条`,
          },
          {
            label: '整体进度',
            value: `${project.progress}%`,
          },
        ]"
      >
        <Card class="glass-card border-slate-200 p-4">
          <div class="text-[12px] text-slate-400">{{ k.label }}</div>
          <div class="mt-1 text-2xl font-semibold text-slate-800">
            {{ k.value }}
          </div>
        </Card>
      </template>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <Card class="glass-card col-span-2 border-slate-200 p-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-[15px] font-medium text-slate-800">分日互动表现</h3>
          <div class="flex items-center gap-2 text-[11.5px] text-slate-400">
            <Clock class="h-3.5 w-3.5"></Clock>
            {{ project.start }} ~
            {{ project.end }}
          </div>
        </div>
        <div class="h-60">
          <DataChart
            type="bar"
            :data="engagement7d"
            :series="[
              {
                name: 'TikTok',
                color: mainPlatform ? platformColors[mainPlatform] : '#11a3fd',
                type: 'bar',
              },
            ]"
            :legend="false"
          />
        </div>
      </Card>
      <Card class="glass-card border-slate-200 p-5">
        <h3 class="mb-4 text-[15px] font-medium text-slate-800">项目信息</h3>
        <div class="space-y-3.5 text-[12.5px]">
          <div class="flex justify-between">
            <span class="text-slate-400">负责人</span>
            <span class="flex items-center gap-1.5 text-slate-700">
              <User class="h-3.5 w-3.5 text-slate-400"></User>
              {{ project.owner }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">周期</span>
            <span class="text-slate-700">{{ project.start }} ~ {{ project.end }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">平台</span>
            <span class="flex gap-1">
              <template :key="p" v-for="p in project.platforms">
                <PlatformBadge :platform="p"></PlatformBadge>
              </template>
            </span>
          </div>
        </div>
        <div class="mt-5">
          <div class="mb-1 flex justify-between text-[11.5px] text-slate-400">
            <span>整体进度</span>
            <span class="font-medium text-slate-600">{{ project.progress }}%</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              class="brand-gradient h-full rounded-full"
              :style="{
                width: `${project.progress}%`,
              }"
            ></div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
