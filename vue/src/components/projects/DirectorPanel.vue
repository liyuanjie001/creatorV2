<script setup lang="ts">
import { useDemoTimers } from '@/composables/useDemoTimers';
const { delay } = useDemoTimers();
import { Clapperboard, Wand2 } from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { toast } from 'vue-sonner';
import { ref } from 'vue';
const demoShots = [
  {
    scene: '特写：产品置于露营桌，晨雾背景',
    dur: '3s',
    line: '无台词，环境音 + 篝火声',
  },
  {
    scene: '第一人称：手持咖啡机注水，蒸汽升起',
    dur: '5s',
    line: '「营地的第一杯，当然要现磨」',
  },
  {
    scene: '环绕展示：产品 360°，篝火光映照',
    dur: '4s',
    line: '无台词，节奏鼓点进入',
  },
  {
    scene: '成品出品：倒入杯中，人物满足表情',
    dur: '3s',
    line: '「3 分钟，把咖啡馆搬到户外」',
  },
];
const shots = ref<typeof demoShots | null>(null);
const loading = ref(false);
const run = () => {
  if (loading.value) return;
  loading.value = true;
  delay(() => {
    shots.value = demoShots;
    loading.value = false;
    toast.success('AI 已拆解为 4 个分镜');
  }, 1200);
};
</script>

<template>
  <div class="space-y-4">
    <Card class="glass-card border-slate-200 p-4">
      <div class="flex items-center gap-3">
        <Input
          placeholder="描述你的创意目标，例如：一条 15 秒露营咖啡机氛围短片…"
          class="h-10 border-slate-200 bg-slate-50 text-[13px] focus-visible:ring-sky-300"
        ></Input>
        <Button
          @click="run"
          :disabled="loading"
          class="h-10 gap-2 brand-gradient px-5 text-white hover:opacity-90"
        >
          <template v-if="loading"><Wand2 class="h-4 w-4 animate-spin"></Wand2></template>
          <template v-else><Clapperboard class="h-4 w-4"></Clapperboard></template>
          <template v-if="loading">{{ '拆解中…' }}</template>
          <template v-else>{{ 'AI 拆分镜' }}</template>
        </Button>
      </div>
    </Card>
    <template v-if="shots">
      <div class="space-y-2">
        <template :key="i" v-for="(s, i) in shots">
          <div class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-gradient text-[12px] font-bold text-white"
            >
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="text-[13px] font-medium text-slate-800">
                {{ s.scene }}
              </div>
              <div class="mt-0.5 text-[11.5px] text-slate-400">
                {{ s.line }}
              </div>
            </div>
            <Badge
              variant="outline"
              class="shrink-0 border-slate-200 bg-slate-50 text-[11px] font-normal text-slate-500"
            >
              {{ s.dur }}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              class="shrink-0 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
              @click="toast.success(`镜头 ${i + 1} 已发送到控制台（演示）`)"
            >
              生成此镜头
            </Button>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
