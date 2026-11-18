<script setup lang="ts">
import { ArrowUpRight, Building2, Globe2 } from 'lucide-vue-next';
import { Button } from '@/components/ui';
import { platforms } from '@/data/mock';

defineEmits<{ contact: [] }>();
</script>

<template>
  <section
    aria-label="定制化服务"
    class="space-y-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-5 sm:p-7"
  >
    <div class="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-xs font-medium leading-5 text-sky-700">
          <Building2 class="h-4 w-4" aria-hidden="true" />
          企业定制 · 专属服务
        </p>
        <h2
          class="mt-3 text-xl font-semibold leading-8 tracking-tight text-slate-900 sm:text-2xl sm:leading-9"
        >
          让品牌内容，
          <span class="text-sky-600">规模化走向全球</span>
        </h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          面向品牌、商家与内容团队，从内容创作到多平台发布，定制适合业务的增长工作流。
        </p>
      </div>
      <dl class="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8" aria-label="服务规模数据">
        <div>
          <dt class="text-xs leading-5 text-slate-600">品牌与团队</dt>
          <dd class="mt-2 text-2xl font-semibold leading-8 tabular-nums text-sky-600 sm:text-[28px]">
            1,200+
          </dd>
        </div>
        <div>
          <dt class="text-xs leading-5 text-slate-600">已生成视频</dt>
          <dd class="mt-2 text-2xl font-semibold leading-8 tabular-nums text-sky-600 sm:text-[28px]">
            240万+
          </dd>
        </div>
        <div>
          <dt class="text-xs leading-5 text-slate-600">覆盖社媒平台</dt>
          <dd class="mt-2 text-2xl font-semibold leading-8 tabular-nums text-sky-600 sm:text-[28px]">
            {{ platforms.length }}
            <span class="text-xs font-normal text-slate-600">个</span>
          </dd>
        </div>
      </dl>
    </div>
    <div
      class="flex flex-col gap-5 border-t border-sky-100 pt-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0">
        <p class="mb-3 flex items-center gap-2 text-xs font-medium leading-5 text-slate-700">
          <Globe2 class="h-4 w-4 text-sky-600" aria-hidden="true" />
          覆盖社媒平台
        </p>
        <ul class="flex flex-wrap gap-2" aria-label="覆盖社媒平台">
          <li
            v-for="platform in platforms"
            :key="platform"
            class="rounded-lg border border-sky-100 bg-white px-3 py-1.5 text-xs font-medium leading-5 text-slate-700"
          >
            {{ platform }}
          </li>
        </ul>
      </div>
      <Button
        variant="outline"
        class="h-10 w-fit shrink-0 border-sky-200 bg-white px-5 text-sky-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus-visible:ring-sky-200"
        @click="$emit('contact')"
      >
        联系销售
        <ArrowUpRight class="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  </section>
</template>
