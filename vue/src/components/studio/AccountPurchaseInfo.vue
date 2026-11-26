<script setup lang="ts">
import InfoTip from './InfoTip.vue';
withDefaults(defineProps<{ label?: string; legacy?: boolean; coupon?: boolean; triggerClass?: string }>(), { label: '账号购买说明', legacy: false, coupon: false });
</script>

<template>
  <InfoTip :text="label" :trigger-class="triggerClass">
    <template v-if="$slots.trigger" #trigger><slot name="trigger" /></template>
    <ol class="list-decimal pl-4">
      <template v-if="coupon">
        <li>购买后自动发放并兑换，无需手动操作。</li>
        <li>美国 TikTok 账号将在 3 个中国法定工作日内到账。</li>
        <li>可在账号管理查看到账进度，到账后通过本平台发布作品。</li>
      </template>
      <template v-else>
      <li v-if="legacy">历史名额可选择 TikTok、Instagram、Facebook 账号及国家地区</li>
      <li v-else>美国 TikTok 账号，付款后自动到账</li>
      <li class="font-semibold">可直接通过本平台发布视频、图文等作品</li>
      <li v-if="!legacy">历史订单按购买时的账号数量交付</li>
      </template>
    </ol>
  </InfoTip>
</template>
