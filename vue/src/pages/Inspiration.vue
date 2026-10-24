<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import InspirationCard from '@/components/InspirationCard.vue';
import { inspirations } from '@/data/mock';
import { ref, computed } from 'vue';

const query = ref('');

const list = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return inspirations;
  return inspirations.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.author.toLowerCase().includes(q) ||
      v.platform.toLowerCase().includes(q) ||
      v.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="创意中心"
      desc="采集海外全平台爆款内容，拆解脚本结构，一键翻拍为你的品牌素材"
    />

    <div class="relative max-w-xl">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        v-model="query"
        placeholder="搜索灵感关键词、话题、作者…"
        class="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
      />
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <InspirationCard v-for="v in list" :key="v.id" :item="v" />
    </div>
    <p v-if="list.length === 0" class="py-16 text-center text-[13px] text-slate-400">
      没有匹配的灵感，试试其他关键词
    </p>
  </div>
</template>
