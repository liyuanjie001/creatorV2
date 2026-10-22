<script setup lang="ts">
import { AtSign, User, MapPin, Box, LayoutTemplate, Mic } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { assetElements, type AssetElement } from '@/data/mock';
import { toast } from 'vue-sonner';
const elementIcons: Record<AssetElement['kind'], typeof User> = {
  角色: User,
  地点: MapPin,
  道具: Box,
  模板: LayoutTemplate,
  配音: Mic,
};
</script>

<template>
  <div class="grid grid-cols-4 gap-3">
    <template :key="e.name" v-for="e in assetElements">
      <Card class="glass-card rounded-xl p-4">
        <div class="flex items-start justify-between">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
            <component :is="elementIcons[e.kind]" class="h-5 w-5 text-sky-500"></component>
          </span>
          <Badge
            variant="outline"
            class="border-slate-200 bg-slate-50 text-[10.5px] font-normal text-slate-500"
          >
            {{ e.kind }}
          </Badge>
        </div>
        <div class="mt-3 text-[13.5px] font-medium text-slate-800">
          {{ e.name }}
        </div>
        <div class="mt-0.5 text-[11.5px] text-slate-400">已被引用 {{ e.used }} 次</div>
        <Button
          size="sm"
          variant="outline"
          class="mt-3 w-full gap-1.5 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
          @click="toast.success(`已 @${e.name} 到控制台（演示）`)"
        >
          <AtSign class="h-3.5 w-3.5"></AtSign>
          引用到创作
        </Button>
      </Card>
    </template>
  </div>
</template>
