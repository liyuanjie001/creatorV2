<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CreationConsole from '@/components/CreationConsole.vue';
import ExpertMode from './ExpertMode.vue';

defineProps<{ projectId: string }>();
const route = useRoute();
const mode = computed(() => route.query.mode === 'expert' ? 'expert' : 'normal');
</script>

<template>
  <div class="p-6">
    <ExpertMode v-if="mode === 'expert'" :project-id="projectId" />
    <template v-else>
      <div class="rounded-2xl px-2 pb-8 pt-10 xl:px-6 xl:pt-12">
        <h2 class="mb-2 text-center text-2xl font-semibold brand-text">让你的品牌故事鲜活起来</h2>
        <p class="mb-8 text-center text-sm text-slate-400">写下提示词，添加参考素材，选择模型开始创作</p>
        <CreationConsole :project-id="projectId" quick-actions spacious class-name="mx-auto max-w-[1200px]" />
      </div>

    </template>
  </div>
</template>
