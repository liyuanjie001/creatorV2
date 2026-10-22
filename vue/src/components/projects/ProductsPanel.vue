<script setup lang="ts">
import { Plus, ShoppingBag } from 'lucide-vue-next';
import { Thumb } from '@/components/shared';
import { toast } from 'vue-sonner';
import { cn } from '@/lib/utils';
import ProductForm from '@/components/projects/ProductForm.vue';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';
const { project, projectProducts, selProductId, selectedProduct } = useProjectWorkspaceContext();
</script>

<template>
  <div class="flex gap-4">
    <div class="flex w-60 shrink-0 flex-col gap-5">
      <div>
        <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">品牌设置</p>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="flex items-center gap-2.5">
            <span
              class="h-8 w-8 shrink-0 rounded-lg"
              :style="{
                background: project.color,
              }"
            ></span>
            <div class="min-w-0">
              <p class="truncate text-[13px] font-medium text-slate-800">
                {{ project.name }}
              </p>
              <p class="text-[11px] text-slate-400">品牌主页</p>
            </div>
          </div>
        </div>
        <button
          @click="toast.info('视觉标识设置（演示）')"
          class="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50/50"
        >
          <span
            class="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
          >
            {{ project.name.slice(0, 1) }}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[13px] font-medium text-slate-800">视觉标识</span>
            <span class="block text-[11px] text-slate-400">Logo / 主色 / 字体</span>
          </span>
        </button>
      </div>
      <div class="min-h-0 flex-1">
        <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">产品</p>
        <button
          @click="toast.success('创建产品（演示）：粘贴独立站商品链接，AI 自动补全信息')"
          class="flex w-full items-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 bg-white/60 p-2.5 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Plus class="h-4 w-4"></Plus>
          </span>
          <span class="text-[12.5px] font-medium">创建产品</span>
        </button>
        <div class="mt-2 space-y-1">
          <template :key="p.id" v-for="(p, i) in projectProducts">
            <button
              @click="selProductId = p.id"
              :class="
                cn(
                  'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors',
                  selProductId === p.id ? 'border-sky-200 bg-sky-50' : 'border-transparent hover:bg-slate-50',
                )
              "
            >
              <Thumb :class="cn('h-9 w-9 shrink-0 rounded-lg', i % 2 === 1 && '[filter:hue-rotate(40deg)]')">
                <ShoppingBag class="h-4 w-4 text-white/70"></ShoppingBag>
              </Thumb>
              <span class="min-w-0">
                <span class="block truncate text-[12.5px] font-medium text-slate-800">{{ p.name }}</span>
                <span class="block text-[11px] text-slate-400">{{ p.price }} · {{ p.sales }}</span>
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
    <div class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/70 p-5">
      <template v-if="selectedProduct">
        <ProductForm :key="selectedProduct.id" :product="selectedProduct"></ProductForm>
      </template>
      <template v-else>
        <p class="py-20 text-center text-[13px] text-slate-400">暂无商品，点击左侧「创建产品」开始</p>
      </template>
    </div>
  </div>
</template>
