<script setup lang="ts">
import { ShoppingBag, Sparkles, Check, X, Wand2 } from 'lucide-vue-next';
import { Button, Input, Textarea } from '@/components/ui';
import { Thumb } from '@/components/shared';
import { type Product } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { ref } from 'vue';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';

const galleryHues = [0, 50, 120, 200];
const samplePoints = [
  '10% 烟酰胺 + 神经酰胺，提亮修护双效合一',
  '清爽水润质地，叠涂不搓泥',
  '通过皮肤科测试，敏感肌可用',
  '28 天实测提亮一个色阶，附对比报告',
  '适合北美秋季干燥气候下的日常护肤',
];

const { product } = defineProps<{
  product: Product;
}>();

const { section } = useProjectWorkspaceContext();
const name = ref(product.name);
const desc = ref(product.desc ?? '');
const points = ref<string[]>([...(product.points ?? [])]);
const newPoint = ref('');
const activeImg = ref(0);

const addPoint = () => {
  const v = newPoint.value.trim();
  if (!v) return;
  points.value = [...points.value, v];
  newPoint.value = '';
};

const generateDescFromImage = () => {
  desc.value =
    product.desc ??
    `基于当前商品图识别：${product.name}，质地清爽、适合日常护肤场景，可作为短视频与图文种草的核心卖点描述。`;
  toast.success('已根据图片生成描述（演示）');
};

const generatePoints = () => {
  points.value = samplePoints.slice(0, 5);
  toast.success('已生成 5 条卖点（演示）');
};

const goCreate = () => {
  section.value = 'gen';
  toast.success('已进入自由创作，可引用本产品卡');
};
</script>

<template>
  <div class="flex gap-5">
    <div class="w-60 shrink-0">
      <div class="overflow-hidden rounded-xl border border-slate-200">
        <Thumb
          :class="
            cn(
              'aspect-square w-full transition-all',
              activeImg !== 0 && `[filter:hue-rotate(${galleryHues[activeImg]}deg)]`,
            )
          "
        >
          <ShoppingBag class="h-10 w-10 text-white/70" />
        </Thumb>
      </div>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <button
          v-for="(h, i) in galleryHues"
          :key="i"
          type="button"
          :class="
            cn(
              'overflow-hidden rounded-lg border-2 transition-all',
              activeImg === i ? 'border-sky-500' : 'border-transparent opacity-60 hover:opacity-100',
            )
          "
          @click="activeImg = i"
        >
          <Thumb :class="cn('aspect-square w-full', i !== 0 && `[filter:hue-rotate(${h}deg)]`)">
            <ShoppingBag class="h-3.5 w-3.5 text-white/70" />
          </Thumb>
        </button>
      </div>
      <Button
        size="sm"
        variant="outline"
        class="mt-3 w-full gap-1.5 border-sky-200 bg-sky-50 text-[12px] text-sky-600 hover:bg-sky-100 hover:text-sky-700"
        @click="generateDescFromImage"
      >
        <Wand2 class="h-3.5 w-3.5" />
        AI 识图生成描述
      </Button>
      <p class="mt-2 text-center text-[11px] text-slate-400">商品图 · 点击缩略图切换</p>
    </div>
    <div class="min-w-0 flex-1">
      <div class="space-y-3.5">
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-slate-500">标题</label>
          <Input v-model="name" class="border-slate-200 bg-white text-[13px]" />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-[12px] font-medium text-slate-500">描述</label>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[12px] font-medium text-sky-600 hover:text-sky-700"
              @click="generateDescFromImage"
            >
              <Wand2 class="h-3.5 w-3.5" />
              AI 根据图片生成
            </button>
          </div>
          <Textarea
            v-model="desc"
            :rows="4"
            placeholder="可手动填写，或根据左侧商品图 AI 生成"
            class="resize-none border-slate-200 bg-white text-[13px] leading-relaxed placeholder:text-slate-300"
          />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-[12px] font-medium text-slate-500">卖点</label>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[12px] font-medium text-sky-600 hover:text-sky-700"
              @click="generatePoints"
            >
              <Wand2 class="h-3.5 w-3.5" />
              AI 一键生成 5 条
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(pt, i) in points"
              :key="i"
              class="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span class="min-w-0 flex-1 text-[12.5px] text-slate-700">{{ pt }}</span>
              <button
                type="button"
                class="shrink-0 text-slate-300 transition-colors hover:text-rose-500"
                @click="points = points.filter((_, j) => j !== i)"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
            <Input
              v-model="newPoint"
              placeholder="输入卖点，回车添加"
              class="border-dashed border-slate-300 bg-white text-[12.5px]"
              @keydown.enter.prevent="addPoint"
            />
          </div>
        </div>
      </div>
      <div class="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4">
        <Button
          size="sm"
          class="gap-1.5 brand-gradient text-white hover:opacity-90"
          @click="toast.success('产品卡已保存（演示）')"
        >
          <Check class="h-3.5 w-3.5" />
          保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
          @click="goCreate"
        >
          <Sparkles class="h-3.5 w-3.5" />
          立即创作
        </Button>
        <span class="ml-auto text-[11px] text-slate-400">{{ product.sellingPoint }}</span>
      </div>
    </div>
  </div>
</template>
