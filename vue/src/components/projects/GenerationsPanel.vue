<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import GenCard from '@/components/projects/GenCard.vue';
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace';

const { generating, related } = useProjectWorkspaceContext();
const query = ref('');

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return related.value;
  return related.value.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      (item.status?.toLowerCase().includes(q) ?? false),
  );
});
</script>

<template>
  <div>
    <div class="mb-3 flex items-center gap-3">
      <h2 class="shrink-0 text-[15px] font-semibold text-slate-800">创作记录</h2>
      <div class="relative w-64 max-w-full">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          v-model="query"
          placeholder="搜索标题、平台、类型…"
          class="h-8 border-slate-200 bg-slate-50 pl-9 text-[12.5px] placeholder:text-slate-300 focus-visible:ring-sky-300"
        />
      </div>
    </div>
    <div v-if="filtered.length > 0 || generating" class="grid grid-cols-5 gap-3">
      <div
        v-if="generating"
        class="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-50"
      >
        <div class="thumb-gradient h-full w-full rounded-xl opacity-40"></div>
      </div>
      <GenCard v-for="g in filtered" :key="g.id" :g="g" />
    </div>
    <p v-else class="py-16 text-center text-[13px] text-slate-400">没有匹配的创作记录</p>
  </div>
</template>
