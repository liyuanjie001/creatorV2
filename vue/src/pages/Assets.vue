<script setup lang="ts">
import { useAssetLibrary } from '@/composables/useAssetLibrary';
import { PageHeader } from '@/components/shared';
import AssetSidebar from '@/components/assets/AssetSidebar.vue';
import AssetToolbar from '@/components/assets/AssetToolbar.vue';
import AssetContent from '@/components/assets/AssetContent.vue';

useAssetLibrary();
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-white">
    <div class="shrink-0 px-8 pt-6">
      <PageHeader title="素材库" desc="统一管理全部素材与收藏">
        <template #extra>
          <AssetToolbar />
        </template>
      </PageHeader>
    </div>
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <AssetSidebar />
      <div class="min-w-0 flex-1 overflow-y-auto scroll-slim px-8 pb-6">
        <AssetContent />
      </div>
    </div>
  </div>
</template>
