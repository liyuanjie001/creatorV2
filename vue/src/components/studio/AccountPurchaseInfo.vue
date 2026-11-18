<script setup lang="ts">
import InfoTip from './InfoTip.vue';
withDefaults(defineProps<{ label?: string; legacy?: boolean }>(), { label: '账号购买说明', legacy: false });
</script>

<template>
  <InfoTip :text="label">
    <ol class="list-decimal pl-4">
      <li v-if="legacy">历史名额可选择 TikTok、Instagram、Facebook 账号及国家地区</li>
      <li v-else>美国 TikTok 账号，付款后自动到账</li>
      <li class="font-semibold">可直接通过本平台发布视频、图文等作品</li>
    </ol>
  </InfoTip>
</template>
