<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search, Sparkles } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import InspirationCard from '@/components/InspirationCard.vue';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';

const { project, projectProducts, recs } = useProjectWorkspaceContext();
const query = ref('');

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return recs.value;
  return recs.value.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
});
</script>

<template>
  <div>
    <div
      class="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-[12.5px] text-sky-700"
    >
      <Sparkles class="h-4 w-4 shrink-0" />
      基于本项目
      <template v-if="projectProducts.length > 0">
        的商品「{{ projectProducts.map((p) => p.name).join('、') }}」
      </template>
      和目标平台 {{ project.platforms.join(' / ') }} 推荐近期爆款
    </div>
    <div class="relative mb-4 max-w-xl">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        v-model="query"
        placeholder="搜索灵感关键词、话题、作者…"
        class="border-slate-200 bg-slate-50 pl-9 text-[13px] placeholder:text-slate-300 focus-visible:ring-sky-300"
      />
    </div>
    <div
      v-if="filtered.length > 0"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <InspirationCard v-for="v in filtered" :key="v.id" :item="v" />
    </div>
    <p v-else class="py-16 text-center text-[13px] text-slate-400">
      没有匹配的灵感，试试其他关键词
    </p>
  </div>
</template>
