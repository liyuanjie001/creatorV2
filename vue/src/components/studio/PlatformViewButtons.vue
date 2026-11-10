<script setup lang="ts">
import { computed } from 'vue';
import { ExternalLink } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { studio } from '@/services/studio';
import { publishedVideoPlatforms } from '@/services/accountStatistics';
import { platformName } from '@/services/accounts';
import type { VideoRow } from '@/services/videoManagement';
const props = defineProps<{ row: VideoRow }>();
const platforms = computed(() => publishedVideoPlatforms(studio.value, props.row));
</script>
<template>
  <div v-if="platforms.length" class="flex flex-wrap gap-2" aria-label="平台查看入口">
    <button
      v-for="platform in platforms"
      :key="platform"
      type="button"
      class="studio-btn !bg-sky-50 !text-sky-700"
      @click="toast.info('平台查看暂未接入')"
    >
      <ExternalLink class="h-4 w-4" />
      去 {{ platformName(platform) }} 查看
    </button>
  </div>
</template>
