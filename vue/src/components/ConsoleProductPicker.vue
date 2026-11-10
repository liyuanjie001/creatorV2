<script setup lang="ts">
import { Search, ShoppingBag } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Thumb } from '@/components/shared';
import { type Product } from '@/data/mock';
import { cn } from '@/lib/utils';
import { eventValue } from '@/lib/events';

const { products } = defineProps<{
  products: Product[];
}>();
const emit = defineEmits<{
  pick: [product: Product];
}>();

const query = ref('');
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.sellingPoint.toLowerCase().includes(q) ||
      (item.desc ?? '').toLowerCase().includes(q),
  );
});
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
    <div class="flex items-center justify-between px-4 pb-1 pt-3">
      <div class="text-[12px] font-medium text-slate-500">选择产品卡</div>
    </div>
    <div class="px-4 pb-2">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          :value="query"
          placeholder="搜索产品名称、卖点…"
          class="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-[12px] outline-none placeholder:text-slate-400 focus:border-sky-300"
          @input="query = eventValue($event)"
        />
      </div>
    </div>
    <div class="max-h-[280px] space-y-1 overflow-y-auto scroll-slim px-2 pb-3">
      <button
        v-for="(item, i) in visible"
        :key="item.id"
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-sky-50"
        @click="emit('pick', item)"
      >
        <Thumb :class="cn('h-10 w-10 shrink-0 rounded-lg', i % 2 === 1 && '[filter:hue-rotate(40deg)]')">
          <ShoppingBag class="h-4 w-4 text-white/70" />
        </Thumb>
        <span class="min-w-0">
          <span class="block truncate text-[12.5px] font-medium text-slate-800">{{ item.name }}</span>
          <span class="block truncate text-[11px] text-slate-400">{{ item.sellingPoint }}</span>
        </span>
      </button>
      <p v-if="visible.length === 0" class="py-10 text-center text-[12px] text-slate-400">
        {{ products.length === 0 ? '当前项目还没有产品卡' : '没有匹配的产品卡' }}
      </p>
    </div>
  </div>
</template>
