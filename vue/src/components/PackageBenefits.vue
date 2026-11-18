<script setup lang="ts">
import { computed } from 'vue';
import {
  Check,
  ChartNoAxesCombined,
  ClipboardCheck,
  FolderKanban,
  Layers,
  Tag,
  UsersRound,
} from 'lucide-vue-next';
import type { RechargeBenefit } from '@/services/credits';

const props = defineProps<{ benefits: RechargeBenefit[]; compact?: boolean }>();

const sections = [
  {
    title: '创作与发布',
    items: [
      {
        label: '视频一键发布',
        icon: Check,
        children: [
          '图文一键发布',
          '视频／图文 BGM',
          '批量发布',
          '定时发布',
          '可绑定发布账号数',
          '可发布平台',
        ],
      },
      { label: '快速创作', icon: Check, children: [] },
      { label: '智能创作（Agent 多任务并行）', icon: Check, children: ['爆款视频复刻', '批量内容生成'] },
    ],
  },
  {
    title: '管理与协作',
    items: [
      { label: '账号数据通解', icon: ChartNoAxesCombined, children: [] },
      { label: '发布结果统计', icon: ClipboardCheck, children: ['内容数据分析'] },
      { label: '项目管理（不限项目数）', icon: FolderKanban, children: [] },
      { label: '产品卡创建', icon: Tag, children: [] },
      { label: '素材库管理', icon: Layers, children: [] },
      { label: '团队协作成员', icon: UsersRound, children: ['团队权限管理'] },
    ],
  },
];

const visibleSections = computed(() => {
  const included = new Map(
    props.benefits.filter((item) => item.value !== false).map((item) => [item.label, item]),
  );
  return sections.map((section) => ({
    title: section.title,
    items: section.items.flatMap((item) => {
      const benefit = included.get(item.label);
      return benefit
        ? [
            {
              ...item,
              value: benefit.value,
              children: item.children.flatMap((label) => included.get(label) ?? []),
            },
          ]
        : [];
    }),
  }));
});
</script>

<template>
  <div class="mt-5 border-t border-slate-100 pt-5" aria-label="平台功能权益">
    <section
      v-for="(section, index) in visibleSections"
      :key="section.title"
      :aria-label="section.title"
      :class="
        index === 0 ? (compact ? 'pb-5' : 'pb-5 md:min-h-[360px] md:pb-0') : 'border-t border-slate-100 pt-5'
      "
    >
      <h4 v-if="index > 0" class="mb-4 text-[12px] font-semibold text-slate-700">{{ section.title }}</h4>
      <ul class="space-y-3.5">
        <li v-for="item in section.items" :key="item.label" class="text-[12px] leading-5 text-slate-600">
          <div class="flex items-start gap-2">
            <component
              :is="item.icon"
              aria-hidden="true"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500"
              :stroke-width="1.7"
            />
            <span class="min-w-0">
              {{ item.label }}
              <template v-if="item.value !== true">{{ item.value }}</template>
            </span>
          </div>
          <ul v-if="item.children.length" class="mt-2 space-y-2 pl-1">
            <li
              v-for="child in item.children"
              :key="child.label"
              class="flex items-start gap-2 text-slate-400"
            >
              <span
                aria-hidden="true"
                class="mt-1 h-2 w-2 shrink-0 rounded-bl-[3px] border-b border-l border-slate-300"
              />
              <span class="min-w-0">
                {{ child.label }}
                <template v-if="child.value !== true">{{ child.value }}</template>
              </span>
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>
