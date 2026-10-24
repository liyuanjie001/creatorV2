<script setup lang="ts">
import { Plus, ShoppingBag } from 'lucide-vue-next';
import { Thumb } from '@/components/shared';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import ProductForm from '@/components/projects/ProductForm.vue';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
import type { Product } from '@/data/mock';

const { project, projectProducts, selProductId, selectedProduct, addProduct } = useProjectWorkspaceContext();

function createBlank() {
  const item: Product = {
    id: `PR-${Date.now()}`,
    projectId: project.value.id,
    name: '',
    price: '',
    sellingPoint: '',
    sales: '',
    desc: '',
    link: '',
    points: [],
  };
  addProduct(item);
  toast.success('已创建空白产品卡');
}
</script>

<template>
  <div class="flex gap-4">
    <div class="flex w-60 shrink-0 flex-col gap-5">
      <div class="min-h-0 flex-1">
        <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">产品</p>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 p-2.5 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
          @click="createBlank"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Plus class="h-4 w-4" />
          </span>
          <span class="text-[12.5px] font-medium">创建产品</span>
        </button>
        <div class="mt-2 space-y-1">
          <button
            v-for="(p, i) in projectProducts"
            :key="p.id"
            type="button"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors',
                selProductId === p.id ? 'border-sky-200 bg-sky-50' : 'border-transparent hover:bg-slate-50',
              )
            "
            @click="selProductId = p.id"
          >
            <Thumb :class="cn('h-9 w-9 shrink-0 rounded-lg', i % 2 === 1 && '[filter:hue-rotate(40deg)]')">
              <ShoppingBag class="h-4 w-4 text-white/70" />
            </Thumb>
            <span class="min-w-0">
              <span class="block truncate text-[12.5px] font-medium text-slate-800">
                {{ p.name || '未命名产品' }}
              </span>
              <span class="block truncate text-[11px] text-slate-400">
                {{ p.sellingPoint || '待完善信息' }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/70 p-5">
      <ProductForm v-if="selectedProduct" :key="selectedProduct.id" :product="selectedProduct" />
      <p v-else class="py-20 text-center text-[13px] text-slate-400">暂无商品，点击左侧「创建产品」开始</p>
    </div>
  </div>
</template>
