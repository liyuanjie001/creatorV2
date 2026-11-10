<script setup lang="ts">
import { PageHeader } from '@/components/shared';
import TrendsPanel from '@/components/TrendsPanel.vue';
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="热点趋势"
      desc="实时追踪海外 6 大平台热搜话题与关键词走势，抢在流量爆发前布局"
    />
    <TrendsPanel />
  </div>
</template>
