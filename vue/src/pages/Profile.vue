<script setup lang="ts">
import { Crown, Users, Bell, ShieldCheck, Palette, KeyRound, ChevronRight } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { useRouter } from 'vue-router';
const members = [
  {
    name: '林悦',
    role: '运营负责人',
    initials: 'LY',
    you: true,
  },
  {
    name: '陈默',
    role: '内容策划',
    initials: 'CM',
    you: false,
  },
  {
    name: '苏航',
    role: '数据分析师',
    initials: 'SH',
    you: false,
  },
  {
    name: '王一帆',
    role: '视觉设计',
    initials: 'WY',
    you: false,
  },
];
const settings = [
  {
    icon: Bell,
    title: '通知偏好',
    desc: '任务完成、风控预警、额度提醒',
    tab: 'notifications',
  },
  {
    icon: ShieldCheck,
    title: '账号安全',
    desc: '两步验证、登录设备管理',
    tab: 'security',
  },
  {
    icon: Palette,
    title: '界面偏好',
    desc: '主题、语言、时区设置',
    tab: 'appearance',
  },
  {
    icon: KeyRound,
    title: 'API 接入',
    desc: '开放接口 Key 与调用配额',
    tab: 'api',
  },
];
const router = useRouter();
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader title="我的" desc="个人资料、团队与账号设置"></PageHeader>
    <div class="grid grid-cols-3 gap-4">
      <Card class="glass-card col-span-2 border-slate-200 p-6">
        <div class="flex items-center gap-5">
          <Avatar class="h-16 w-16 border-2 border-sky-300">
            <AvatarFallback class="brand-gradient text-xl font-semibold text-white">LY</AvatarFallback>
          </Avatar>
          <div class="flex-1">
            <div class="flex items-center gap-2.5">
              <span class="text-lg font-semibold text-slate-900">林悦</span>
              <Badge
                class="gap-1 border-0 bg-gradient-to-r from-amber-400/20 to-amber-500/10 text-[11px] text-amber-600"
              >
                <Crown class="h-3 w-3"></Crown>
                Pro 版
              </Badge>
            </div>
            <div class="mt-1 text-[13px] text-slate-500">运营负责人 · linyue@matrixhub.demo</div>
            <div class="mt-1 text-[12px] text-slate-400">加入于 2026-03-18 · 所属团队：出海增长组</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            编辑资料
          </Button>
        </div>
        <div class="mt-6 grid grid-cols-3 gap-3">
          <template
            :key="s.label"
            v-for="s in [
              {
                label: '累计发布内容',
                value: '1,284',
              },
              {
                label: '负责项目',
                value: '6',
              },
              {
                label: '本月贡献曝光',
                value: '2.4M',
              },
            ]"
          >
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div class="text-xl font-semibold text-slate-900">
                {{ s.value }}
              </div>
              <div class="mt-1 text-[11.5px] text-slate-400">{{ s.label }}</div>
            </div>
          </template>
        </div>
      </Card>
      <Card class="glass-card relative overflow-hidden border-sky-200 p-6">
        <div class="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-50 blur-3xl"></div>
        <div class="flex items-center gap-2">
          <Crown class="h-4 w-4 text-amber-600"></Crown>
          <h3 class="text-[15px] font-medium text-slate-900">套餐与额度</h3>
        </div>
        <div class="mt-4 space-y-4 text-[12.5px]">
          <template
            :key="q.label"
            v-for="q in [
              {
                label: '发布额度',
                used: 640,
                total: 1000,
              },
              {
                label: 'AI 生成次数',
                used: 212,
                total: 500,
              },
              {
                label: '存储空间',
                used: 36,
                total: 100,
              },
            ]"
          >
            <div>
              <div class="mb-1.5 flex justify-between text-slate-600">
                <span>{{ q.label }}</span>
                <span class="text-slate-700">{{ q.used }} / {{ q.total }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="brand-gradient h-full rounded-full"
                  :style="{
                    width: `${(q.used / q.total) * 100}%`,
                  }"
                ></div>
              </div>
            </div>
          </template>
        </div>
        <Button size="sm" class="mt-5 w-full brand-gradient text-white hover:opacity-90">
          升级至 Team 版
        </Button>
      </Card>
    </div>
    <Card class="glass-card border-slate-200 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-[15px] font-medium text-slate-900">
          <Users class="h-4 w-4 text-slate-500"></Users>
          团队成员（4）
        </h3>
        <Button
          variant="outline"
          size="sm"
          class="border-slate-200 bg-slate-50 text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          邀请成员
        </Button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <template :key="m.name" v-for="m in members">
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Avatar class="h-10 w-10 border border-slate-200">
              <AvatarFallback class="bg-gradient-to-br from-sky-400 to-sky-600 text-[12px] text-white">
                {{ m.initials }}
              </AvatarFallback>
            </Avatar>
            <div class="flex-1">
              <div class="text-[13.5px] font-medium text-slate-900">
                {{ m.name }}
                <template v-if="m.you">
                  <span class="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-600">我</span>
                </template>
              </div>
              <div class="text-[12px] text-slate-400">{{ m.role }}</div>
            </div>
          </div>
        </template>
      </div>
    </Card>
    <Card class="glass-card divide-y divide-slate-200 border-slate-200">
      <template :key="title" v-for="{ icon: Icon, title, desc, tab } in settings">
        <button
          @click="router.push(`/settings?tab=${tab}`)"
          class="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <component :is="Icon" class="h-5 w-5 text-slate-500"></component>
          <div class="flex-1">
            <div class="text-[13.5px] font-medium text-slate-900">
              {{ title }}
            </div>
            <div class="text-[12px] text-slate-400">{{ desc }}</div>
          </div>
          <ChevronRight class="h-4 w-4 text-slate-300"></ChevronRight>
        </button>
      </template>
    </Card>
  </div>
</template>
