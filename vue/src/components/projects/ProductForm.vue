<script setup lang="ts">
import { eventValue } from '@/lib/events';
import { ShoppingBag, Sparkles, Check, Link2, X } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Thumb } from '@/components/shared';
import { type Product } from '@/data/mock';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import { ref } from 'vue';
const galleryHues = [0, 50, 120, 200];
const { product } = defineProps<{
  product: Product;
}>();
const name = ref(product.name);
const price = ref(product.price);
const link = ref(product.link ?? '');
const desc = ref(product.desc ?? '');
const points = ref<string[]>(product.points ?? []);
const newPoint = ref('');
const activeImg = ref(0);
const addPoint = () => {
  const v = newPoint.value.trim();
  if (!v) return;
  points.value = [...points.value, v];
  newPoint.value = '';
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
          <ShoppingBag class="h-10 w-10 text-white/70"></ShoppingBag>
        </Thumb>
      </div>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <template :key="i" v-for="(h, i) in galleryHues">
          <button
            @click="activeImg = i"
            :class="
              cn(
                'overflow-hidden rounded-lg border-2 transition-all',
                activeImg === i ? 'border-sky-500' : 'border-transparent opacity-60 hover:opacity-100',
              )
            "
          >
            <Thumb :class="cn('aspect-square w-full', i !== 0 && `[filter:hue-rotate(${h}deg)]`)">
              <ShoppingBag class="h-3.5 w-3.5 text-white/70"></ShoppingBag>
            </Thumb>
          </button>
        </template>
      </div>
      <p class="mt-2 text-center text-[11px] text-slate-400">商品图 · 点击缩略图切换</p>
    </div>
    <div class="min-w-0 flex-1">
      <div class="space-y-3.5">
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-slate-500">标题</label>
          <Input
            :value="name"
            @input="name = eventValue($event)"
            class="border-slate-200 bg-white text-[13px]"
          ></Input>
        </div>
        <div class="grid grid-cols-2 gap-3.5">
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-slate-500">价格</label>
            <Input
              :value="price"
              @input="price = eventValue($event)"
              class="border-slate-200 bg-white text-[13px]"
            ></Input>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-slate-500">销量</label>
            <Input
              :value="product.sales"
              readOnly
              class="border-slate-200 bg-slate-50 text-[13px] text-slate-400"
            ></Input>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-slate-500">商品链接</label>
          <div class="relative">
            <Link2
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            ></Link2>
            <Input
              :value="link"
              @input="link = eventValue($event)"
              class="border-slate-200 bg-white pl-9 text-[13px] text-sky-600"
            ></Input>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-slate-500">描述</label>
          <Textarea
            :value="desc"
            @input="desc = eventValue($event)"
            :rows="3"
            class="resize-none border-slate-200 bg-white text-[13px] leading-relaxed"
          ></Textarea>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-slate-500">卖点</label>
          <div class="space-y-2">
            <template :key="i" v-for="(pt, i) in points">
              <div class="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"></span>
                <span class="min-w-0 flex-1 text-[12.5px] text-slate-700">{{ pt }}</span>
                <button
                  @click="points = points.filter((_, j) => j !== i)"
                  class="shrink-0 text-slate-300 transition-colors hover:text-rose-500"
                >
                  <X class="h-3.5 w-3.5"></X>
                </button>
              </div>
            </template>
            <Input
              :value="newPoint"
              @input="newPoint = eventValue($event)"
              @keydown="
                if ($event.key === 'Enter') {
                  $event.preventDefault();
                  addPoint();
                }
              "
              placeholder="输入卖点，回车添加"
              class="border-dashed border-slate-300 bg-white text-[12.5px]"
            ></Input>
          </div>
        </div>
      </div>
      <div class="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4">
        <Button
          size="sm"
          class="gap-1.5 brand-gradient text-white hover:opacity-90"
          @click="toast.success('商品信息已保存（演示）')"
        >
          <Check class="h-3.5 w-3.5"></Check>
          保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
          @click="toast.success('已生成种草脚本草稿（演示）')"
        >
          <Sparkles class="h-3.5 w-3.5"></Sparkles>
          种草脚本
        </Button>
        <span class="ml-auto text-[11px] text-slate-400">{{ product.sellingPoint }}</span>
      </div>
    </div>
  </div>
</template>
