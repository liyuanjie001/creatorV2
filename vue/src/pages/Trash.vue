<script setup lang="ts">
import type { Component } from 'vue';
import { RotateCcw, Trash2, FolderKanban, FileVideo, ListTodo, AtSign } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { trashItems } from '@/data/mock';
import { toast } from 'vue-sonner';
const typeIcon: Record<string, Component> = {
  项目: FolderKanban,
  任务: ListTodo,
  素材: FileVideo,
  账号: AtSign,
};
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader title="回收站" desc="已删除的项目、任务与素材会在此保留 30 天，之后自动彻底清除">
      <template #extra>
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Trash2 class="h-3.5 w-3.5"></Trash2>
          清空回收站
        </Button>
      </template>
    </PageHeader>
    <Card class="glass-card divide-y divide-slate-200 border-slate-200">
      <template :key="item.name" v-for="item in trashItems">
        <div class="flex items-center gap-4 px-5 py-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <component :is="typeIcon[item.type]" class="h-5 w-5 text-slate-500"></component>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[13.5px] font-medium text-slate-900">
              {{ item.name }}
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
              <Badge
                variant="outline"
                class="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-500"
              >
                {{ item.type }}
              </Badge>
              <span>删除于 {{ item.deletedAt }}</span>
              <template v-if="item.size">
                <span>· {{ item.size }}</span>
              </template>
              <span>· 剩余 24 天</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 border-slate-200 bg-transparent text-[12px] text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            @click="
              toast.success('已还原（演示）', {
                description: item.name,
              })
            "
          >
            <RotateCcw class="h-3.5 w-3.5"></RotateCcw>
            还原
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="text-[12px] text-rose-600/80 hover:bg-rose-400/10 hover:text-rose-600"
            @click="
              toast.error('已彻底删除（演示）', {
                description: item.name,
              })
            "
          >
            彻底删除
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
