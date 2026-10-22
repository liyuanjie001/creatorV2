<script setup lang="ts">
import { Bell, ShieldCheck, Palette, KeyRound, Users, UserPlus } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Switch } from '@/components/ui';
import { Input } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { toast } from 'vue-sonner';
import SwitchRow from '@/components/SwitchRow.vue';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';
const tabs = [
  {
    key: 'notifications',
    label: '通知偏好',
    icon: Bell,
  },
  {
    key: 'security',
    label: '账号安全',
    icon: ShieldCheck,
  },
  {
    key: 'appearance',
    label: '界面偏好',
    icon: Palette,
  },
  {
    key: 'api',
    label: 'API 接入',
    icon: KeyRound,
  },
  {
    key: 'team',
    label: '团队成员',
    icon: Users,
  },
] as const;
const notifItems = [
  {
    title: '任务完成提醒',
    desc: '任务发布成功或失败时通知我',
    on: true,
  },
  {
    title: '风控预警',
    desc: '账号触发风控或授权过期时立即通知',
    on: true,
  },
  {
    title: '额度提醒',
    desc: '发布额度使用超过 80% 时提醒',
    on: true,
  },
  {
    title: '热点趋势日报',
    desc: '每天 9:00 推送订阅市场的趋势摘要',
    on: false,
  },
  {
    title: '周报',
    desc: '每周一发送矩阵数据周报邮件',
    on: false,
  },
];
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
const route = useRoute();
const router = useRouter();
const params = computed(() => new URLSearchParams(route.fullPath.split('?')[1] ?? ''));
const setParams = (
  query: Record<string, string>,
  options?: {
    replace?: boolean;
  },
) =>
  options?.replace
    ? router.replace({
        query,
      })
    : router.push({
        query,
      });
const tab = computed(() => params.value.get('tab') ?? 'notifications');
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader title="设置中心" desc="通知、安全、界面、API 与团队管理"></PageHeader>
    <div class="grid grid-cols-4 gap-4">
      <Card class="glass-card h-fit border-white/[0.07] p-2">
        <template :key="key" v-for="{ key, label, icon: Icon } in tabs">
          <button
            @click="
              setParams({
                tab: key,
              })
            "
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                tab === key
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )
            "
          >
            <component :is="Icon" class="h-4 w-4"></component>
            {{ label }}
          </button>
        </template>
      </Card>
      <Card class="glass-card col-span-3 border-white/[0.07] p-6">
        <template v-if="tab === 'notifications'">
          <div class="divide-y divide-slate-100">
            <h3 class="pb-1 text-[15px] font-medium text-slate-800">通知偏好</h3>
            <template :key="n.title" v-for="n in notifItems"><SwitchRow v-bind="n"></SwitchRow></template>
          </div>
        </template>
        <template v-if="tab === 'security'">
          <div class="space-y-5">
            <h3 class="text-[15px] font-medium text-slate-800">账号安全</h3>
            <div
              class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-[12.5px] text-emerald-700"
            >
              ✓ 两步验证已开启 · 最近登录：Windows · 上海 · 10-21 09:42
            </div>
            <template
              :key="s.title"
              v-for="s in [
                {
                  title: '修改密码',
                  desc: '上次修改于 3 个月前',
                },
                {
                  title: '登录设备管理',
                  desc: '查看并下线已登录的设备',
                },
                {
                  title: '登录提醒',
                  desc: '新设备登录时邮件提醒',
                  on: true,
                },
              ]"
            >
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div class="text-[13.5px] font-medium text-slate-700">
                    {{ s.title }}
                  </div>
                  <div class="mt-0.5 text-[12px] text-slate-400">
                    {{ s.desc }}
                  </div>
                </div>
                <template v-if="'on' in s && s.on !== undefined"><Switch default-value></Switch></template>
                <template v-else>
                  <Button
                    variant="outline"
                    size="sm"
                    class="border-slate-200 text-slate-500 hover:text-slate-800"
                  >
                    管理
                  </Button>
                </template>
              </div>
            </template>
          </div>
        </template>
        <template v-if="tab === 'appearance'">
          <div class="space-y-5">
            <h3 class="text-[15px] font-medium text-slate-800">界面偏好</h3>
            <div class="space-y-1.5">
              <label class="text-[12.5px] font-medium text-slate-600">语言</label>
              <div class="flex gap-1.5">
                <template :key="i" v-for="(l, i) in ['简体中文', 'English']">
                  <span
                    :class="
                      cn(
                        'rounded-full border px-3 py-1.5 text-[12px]',
                        i === 0
                          ? 'border-sky-400 bg-sky-50 font-medium text-sky-600'
                          : 'border-slate-200 text-slate-500',
                      )
                    "
                  >
                    {{ l }}
                  </span>
                </template>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-[12.5px] font-medium text-slate-600">时区</label>
              <Input
                default-value="UTC+8 · 北京"
                class="w-64 border-slate-200 bg-white text-[13px] focus-visible:ring-sky-300"
              ></Input>
            </div>
            <SwitchRow title="紧凑模式" desc="减小卡片间距，一屏显示更多内容" :on="false"></SwitchRow>
          </div>
        </template>
        <template v-if="tab === 'api'">
          <div class="space-y-5">
            <h3 class="text-[15px] font-medium text-slate-800">API 接入</h3>
            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div class="text-[12px] text-slate-400">API Key</div>
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-600"
                >
                  mh_live_9f2a••••••••••••3c71
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  class="border-slate-200 text-slate-500 hover:text-slate-800"
                  @click="toast.success('已复制（演示）')"
                >
                  复制
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  class="border-slate-200 text-slate-500 hover:text-slate-800"
                  @click="toast.success('已重新生成（演示）')"
                >
                  重新生成
                </Button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <template
                :key="s.label"
                v-for="s in [
                  {
                    label: '本月调用',
                    value: '12,480',
                  },
                  {
                    label: '配额上限',
                    value: '50,000',
                  },
                  {
                    label: '剩余额度',
                    value: '74%',
                  },
                ]"
              >
                <div class="rounded-xl border border-slate-100 bg-slate-50/70 py-3.5">
                  <div class="text-lg font-semibold text-slate-800">
                    {{ s.value }}
                  </div>
                  <div class="mt-0.5 text-[11.5px] text-slate-400">
                    {{ s.label }}
                  </div>
                </div>
              </template>
            </div>
            <p class="text-[12px] leading-relaxed text-slate-400">
              通过 OpenAPI 可将分发任务、数据报表接入你的内部系统。详见开发者文档（演示占位）。
            </p>
          </div>
        </template>
        <template v-if="tab === 'team'">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-[15px] font-medium text-slate-800">团队成员（4 / 10）</h3>
              <Button
                size="sm"
                class="gap-1.5 brand-gradient text-white hover:opacity-90"
                @click="toast.success('邀请链接已复制（演示）')"
              >
                <UserPlus class="h-3.5 w-3.5"></UserPlus>
                邀请成员
              </Button>
            </div>
            <div class="space-y-2">
              <template :key="m.name" v-for="m in members">
                <div class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <Avatar class="h-9 w-9 border border-slate-200">
                    <AvatarFallback class="bg-gradient-to-br from-sky-400 to-sky-600 text-[11px] text-white">
                      {{ m.initials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex-1">
                    <div class="text-[13.5px] font-medium text-slate-800">
                      {{ m.name }}
                      <template v-if="m.you">
                        <Badge class="ml-2 border-0 bg-sky-50 text-[10px] text-sky-600">我</Badge>
                      </template>
                    </div>
                    <div class="text-[12px] text-slate-400">{{ m.role }}</div>
                  </div>
                  <template v-if="!m.you">
                    <Button variant="ghost" size="sm" class="text-[12px] text-slate-400 hover:text-rose-500">
                      移除
                    </Button>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
