<script setup lang="ts">
import LinkRemake from '@/components/studio/LinkRemake.vue';
import { Search, Globe, ChevronDown } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import InspirationCard from '@/components/InspirationCard.vue';
import { inspirations } from '@/data/mock';
import { ref, computed } from 'vue';

const query = ref('');
const category = ref('');
const country = ref('');
const categories = [...new Set(inspirations.map(v => v.category).filter((v): v is string => !!v))];
const countries = [...new Set(inspirations.map(v => v.country).filter((v): v is string => !!v))];

const list = computed(() => {
  const q = query.value.trim().toLowerCase();
  return inspirations.filter(v =>
    (!category.value || v.category === category.value) &&
    (!country.value || v.country === country.value) &&
    (!q || [v.title, v.author, v.platform, ...v.tags].some(text => text.toLowerCase().includes(q))),
  );
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="爆款视频"
      desc="采集海外全平台爆款内容，拆解脚本结构，一键翻拍为你的品牌素材"
    />
    <div class="py-2">
      <LinkRemake />
    </div>

    <div class="flex flex-wrap items-center gap-3">
    <div class="relative w-full max-w-[570px] shrink-0">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        v-model="query"
        placeholder="搜索灵感关键词、话题、作者…"
        class="h-10 border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
      />
    </div>
      <label class="relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
        <span>品类</span>
        <select v-model="category" aria-label="品类" class="cursor-pointer appearance-none bg-transparent py-2 pr-6 font-medium text-slate-600 outline-none">
          <option value="">全部</option>
          <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-3 h-3.5 w-3.5" />
      </label>
      <label class="relative inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
        <Globe class="h-4 w-4" />
        <span>国家</span>
        <select v-model="country" aria-label="国家" class="cursor-pointer appearance-none bg-transparent py-2 pr-6 font-medium text-slate-600 outline-none">
          <option value="">全部</option>
          <option v-for="item in countries" :key="item" :value="item">{{ item }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-3 h-3.5 w-3.5" />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <InspirationCard v-for="v in list" :key="v.id" :item="v" />
    </div>
    <p v-if="list.length === 0" class="py-16 text-center text-[13px] text-slate-400">
      没有匹配的视频，试试其他关键词、品类或国家
    </p>
  </div>
</template>
