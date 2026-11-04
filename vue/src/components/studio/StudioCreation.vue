<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowRight } from 'lucide-vue-next';
import CreationConsole from '@/components/CreationConsole.vue';
import InspirationCard from '@/components/InspirationCard.vue';
import { inspirations } from '@/data/mock';
import ExpertMode from './ExpertMode.vue';

defineProps<{ projectId: string }>();
const route = useRoute();
const mode = computed(() => route.query.mode === 'expert' ? 'expert' : 'normal');
const coverAspects = ['3/4', '9/16', '4/5', '9/16', '3/4'];
</script>

<template>
  <div class="p-6">
    <ExpertMode v-if="mode === 'expert'" :project-id="projectId" />
    <template v-else>
      <div class="rounded-2xl px-2 pb-8 pt-10 xl:px-6 xl:pt-12">
        <h2 class="mb-2 text-center text-2xl font-semibold brand-text">让你的品牌故事鲜活起来</h2>
        <p class="mb-8 text-center text-sm text-slate-400">写下提示词，添加参考素材，选择模型开始创作</p>
        <CreationConsole :project-id="projectId" spacious class-name="mx-auto max-w-[1200px]" />
      </div>
      <section aria-label="爆款视频推荐" class="mt-4 border-t border-slate-100 pt-6">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-slate-800">爆款视频</h2>
            <p class="mt-1 text-xs text-slate-400">发现创作灵感，参考爆款结构与节奏</p>
          </div>
          <RouterLink to="/inspiration" class="inline-flex shrink-0 items-center gap-1 text-xs text-sky-600 hover:text-sky-700">
            查看更多 <ArrowRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
        <div class="columns-1 gap-4 min-[700px]:columns-2 xl:columns-3 2xl:columns-4">
          <div v-for="(video, index) in inspirations" :key="video.id" class="mb-4 break-inside-avoid">
            <InspirationCard :item="video" :cover-aspect="coverAspects[index % coverAspects.length]" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
