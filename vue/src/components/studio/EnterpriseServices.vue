<script setup lang="ts">
import { ArrowUpRight, Building2, Globe2 } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { platforms } from '@/data/mock';

defineEmits<{ contact: [] }>();
</script>

<template>
  <section
    aria-label="定制化服务"
    class="grid items-center gap-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-5 lg:grid-cols-[minmax(0,1.25fr)_auto_minmax(0,1fr)] lg:gap-6 lg:px-6"
  >
    <div class="min-w-0">
      <p class="flex items-center gap-1.5 text-[11px] font-medium leading-4 text-sky-700">
        <Building2 class="h-3.5 w-3.5" aria-hidden="true" />
        企业定制 · 专属服务
      </p>
      <h2 class="mt-2 text-xl font-semibold leading-7 tracking-tight text-slate-900">
        让品牌内容，
        <span class="text-sky-600">规模化走向全球</span>
      </h2>
      <p class="mt-1.5 text-xs leading-5 text-slate-600">
        面向品牌、商家与内容团队，从内容创作到多平台发布，定制适合业务的增长工作流。
      </p>
      <Button
        size="sm"
        class="mt-3 w-fit bg-sky-600 px-4 text-white shadow-sm shadow-sky-200 hover:bg-sky-700 focus-visible:ring-sky-300"
        @click="$emit('contact')"
      >
        联系销售
        <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
    <dl class="grid grid-cols-2 gap-3 lg:gap-5" aria-label="服务规模数据">
      <div>
        <dt class="text-[10px] leading-4 text-slate-600 sm:text-[11px]">服务品牌与团队</dt>
        <dd class="mt-1.5 whitespace-nowrap text-base font-semibold leading-6 tabular-nums text-sky-600 sm:text-2xl sm:leading-8">
          1,200+
        </dd>
      </div>
      <div>
        <dt class="text-[10px] leading-4 text-slate-600 sm:text-[11px]">已生成视频</dt>
        <dd class="mt-1.5 whitespace-nowrap text-base font-semibold leading-6 tabular-nums text-sky-600 sm:text-2xl sm:leading-8">
          240万+
        </dd>
      </div>
    </dl>
    <div class="min-w-0 border-t border-sky-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
      <p class="mb-2.5 flex items-center gap-2 text-[11px] font-medium leading-4 text-slate-700">
        <Globe2 class="h-4 w-4 text-sky-600" aria-hidden="true" />
        覆盖社媒平台
      </p>
      <ul class="flex flex-wrap gap-2" aria-label="覆盖社媒平台">
        <li
          v-for="platform in platforms"
          :key="platform"
          class="rounded-lg border border-sky-100 bg-white px-2.5 py-1 text-[11px] font-medium leading-5 text-slate-700"
        >
          {{ platform }}
        </li>
      </ul>
    </div>
  </section>
</template>
