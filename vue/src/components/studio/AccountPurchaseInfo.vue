<script setup lang="ts">
import InfoTip from './InfoTip.vue';
withDefaults(defineProps<{ label?: string }>(), { label: '账号购买说明' });
</script>

<template>
  <InfoTip :text="label">
    <p>购买后可选择Tiktok、Instagram、Facebook账号，覆盖100+国家地区</p>
    <p class="font-semibold">可直接通过本平台发布视频、图文等作品</p>
    <p>帐号所有权归用户</p>
    <p>登录信息在帐号管理中查看</p>
  </InfoTip>
</template>
