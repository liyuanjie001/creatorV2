<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { deletedAssets } from '@/data/mock';
import { toast } from 'vue-sonner';
</script>

<template>
  <div class="space-y-2">
    <template :key="a.name" v-for="a in deletedAssets">
      <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div class="min-w-0 flex-1">
          <div class="truncate text-[13px] font-medium text-slate-700">
            {{ a.name }}
          </div>
          <div class="text-[11.5px] text-slate-400">
            {{ a.type }} · {{ a.size }} · 删除于 {{ a.updatedAt }}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 border-slate-200 text-[12px] text-slate-500 hover:text-slate-900"
          @click="toast.success('已恢复（演示）')"
        >
          <RotateCcw class="h-3.5 w-3.5"></RotateCcw>
          恢复
        </Button>
      </div>
    </template>
  </div>
</template>
