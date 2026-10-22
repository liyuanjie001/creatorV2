<script setup lang="ts">
import type { ConsoleDraft } from '@/types/domain';
import { useDemoTimers } from '@/composables/useDemoTimers';
const { delay } = useDemoTimers();
import { eventValue } from '@/lib/events';
import {
  Sparkles,
  ImagePlus,
  AtSign,
  FolderOpen,
  Monitor,
  RectangleHorizontal,
  Clock,
  Volume2,
  Layers,
  ChevronRight,
  Clapperboard,
  Image as ImageIcon,
  Wand2,
} from 'lucide-vue-next';
import { Card } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { assetElements } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import ConsoleChip from '@/components/ConsoleChip.vue';
import { ref } from 'vue';

const consoleDraftPool: ConsoleDraft[] = [
  {
    platform: 'TikTok',
    title: '3 秒开箱：把期待感拉满的悬念开头',
    tag: '悬念钩子',
  },
  {
    platform: 'Instagram',
    title: 'Before / After 对比图文',
    tag: '转化导向',
  },
  {
    platform: 'YouTube',
    title: '深度测评长视频 + 章节导航',
    tag: 'SEO 关键词',
  },
  {
    platform: 'TikTok',
    title: '反差剧情：办公室好物脑洞用法',
    tag: '剧情反转',
  },
  {
    platform: 'X',
    title: 'Thread 长帖：5 个使用场景串讲',
    tag: '场景营销',
  },
  {
    platform: 'Instagram',
    title: 'UGC 感生活 vlog 切片',
    tag: '软植入',
  },
];
const pillOptions: Record<string, string[]> = {
  风格: ['电影感 · 高反差', '清新明亮', '复古胶片', '快节奏剪辑'],
  镜头: ['自动运镜', '第一人称', '环绕展示', '特写微距'],
  画幅: ['自动', '16:9', '9:16', '1:1'],
  色调: ['自动', '冷调清透', '暖调阳光', '高饱和'],
};
const { placeholder, className } = defineProps<{
  placeholder?: string;
  className?: string;
}>();
const emit = defineEmits<{
  start: [];
  done: [items: ConsoleDraft[]];
}>();
const mode = ref<'视频' | '图文'>('视频');
const brief = ref('');
const pills = ref<Record<string, number>>({
  风格: 0,
  镜头: 0,
  画幅: 0,
  色调: 0,
});
const quality = ref('1080p');
const ratio = ref('16:9');
const duration = ref('15s');
const audio = ref(true);
const batch = ref(1);
const refCount = ref(0);
const generating = ref(false);
const draftIdx = ref(0);
const cycle = (key: string) =>
  (pills.value = {
    ...pills.value,
    [key]: (pills.value[key] + 1) % pillOptions[key].length,
  });
const generate = () => {
  if (generating.value) return;
  const count = batch.value;
  const firstDraft = draftIdx.value;
  generating.value = true;
  emit('start');
  toast.info('AI 开始生成，预计 30 秒（演示）');
  delay(() => {
    const items = Array.from(
      {
        length: count,
      },
      (_, i) => consoleDraftPool[(firstDraft + i) % consoleDraftPool.length],
    );
    draftIdx.value = (firstDraft + count) % consoleDraftPool.length;
    generating.value = false;
    emit('done', items);
    toast.success(`已生成 ${count} 条内容`);
  }, 1800);
};
</script>

<template>
  <Card :class="cn('glass-card rounded-2xl border-slate-200 p-3', className)">
    <div class="flex gap-3">
      <div class="flex flex-col gap-1 border-r border-slate-100 pr-3">
        <template
          :key="m"
          v-for="[m, Icon] in [
            ['视频', Clapperboard],
            ['图文', ImageIcon],
          ]"
        >
          <button
            @click="mode = m"
            :class="
              cn(
                'flex w-14 flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] transition-colors',
                mode === m
                  ? 'bg-sky-50 font-medium text-sky-600'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600',
              )
            "
          >
            <component :is="Icon" class="h-5 w-5"></component>
            {{ m }}
          </button>
        </template>
      </div>
      <div class="min-w-0 flex-1 space-y-2.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <ConsoleChip
            :icon="ImagePlus"
            :value="`参考图 ${refCount}/3`"
            title="上传参考图"
            @click="refCount = (refCount + 1) % 4"
          ></ConsoleChip>
          <template :key="key" v-for="key in Object.keys(pillOptions)">
            <ConsoleChip
              :icon="Wand2"
              :value="pillOptions[key][pills[key]]"
              :title="key"
              @click="cycle(key)"
            ></ConsoleChip>
          </template>
        </div>
        <Textarea
          :value="brief"
          @input="brief = eventValue($event)"
          :placeholder="
            placeholder ??
            (mode === '视频'
              ? '描述你的场景或产品，使用 @ 添加角色和地点…'
              : '描述你想要的图文内容，使用 @ 引用素材和模板…')
          "
          class="min-h-20 resize-none border-slate-200 bg-slate-50/70 text-[13.5px] placeholder:text-slate-400 focus-visible:ring-sky-300"
        ></Textarea>
        <div class="flex items-center gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <ConsoleChip
              :icon="ImagePlus"
              value="参考"
              title="上传参考"
              @click="refCount = (refCount + 1) % 4"
            ></ConsoleChip>
            <ConsoleChip
              :icon="AtSign"
              value="引用"
              title="引用元素"
              @click="toast.info(`可引用：${assetElements.map((e) => e.name).join('、')}`)"
            ></ConsoleChip>
            <ConsoleChip
              :icon="FolderOpen"
              value="素材库"
              title="从素材库选择"
              @click="toast.info('打开素材库（演示）')"
            ></ConsoleChip>
            <button
              @click="toast.info('切换生成引擎（演示）')"
              class="flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[12px] font-medium text-sky-600 transition-colors hover:bg-sky-100"
            >
              <Sparkles class="h-3.5 w-3.5"></Sparkles>
              跨洋引擎 Pro
              <ChevronRight class="h-3 w-3"></ChevronRight>
            </button>
            <ConsoleChip
              :icon="Monitor"
              :value="quality"
              title="分辨率"
              @click="quality = quality === '1080p' ? '4K' : '1080p'"
            ></ConsoleChip>
            <ConsoleChip
              :icon="RectangleHorizontal"
              :value="ratio"
              title="画幅比例"
              @click="ratio = ratio === '16:9' ? '9:16' : ratio === '9:16' ? '1:1' : '16:9'"
            ></ConsoleChip>
            <template v-if="mode === '视频'">
              <ConsoleChip
                :icon="Clock"
                :value="duration"
                title="时长"
                @click="duration = duration === '15s' ? '30s' : duration === '30s' ? '60s' : '15s'"
              ></ConsoleChip>
            </template>
            <ConsoleChip
              :icon="Volume2"
              :value="audio ? '配乐 开' : '配乐 关'"
              title="配乐"
              @click="
                audio = !audio;
                toast.success(audio ? '已开启配乐' : '已关闭配乐');
              "
            ></ConsoleChip>
            <ConsoleChip
              :icon="Layers"
              :value="`批量 ${batch}/3`"
              title="批量生成"
              @click="batch = (batch % 3) + 1"
            ></ConsoleChip>
          </div>
          <button
            @click="generate"
            :disabled="generating"
            class="ml-auto flex h-[68px] w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl brand-gradient text-white shadow-md shadow-sky-300/40 transition-all hover:opacity-90 disabled:opacity-60"
          >
            <span class="flex items-center gap-1 text-[14.5px] font-semibold">
              <template v-if="generating"><Wand2 class="h-4 w-4 animate-spin"></Wand2></template>
              <template v-else><Sparkles class="h-4 w-4"></Sparkles></template>
              生成
            </span>
            <span class="text-[10px] text-white/75">消耗 20 积分</span>
          </button>
        </div>
      </div>
    </div>
  </Card>
</template>
