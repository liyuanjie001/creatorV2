<script setup lang="ts">
import { Play } from 'lucide-vue-next';
</script>

<template>
  <div class="thumb-gradient relative flex items-center justify-center overflow-hidden">
    <div class="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-sky-100 blur-2xl" />
    <div class="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-sky-100 blur-2xl" />
    <slot><Play class="h-7 w-7 text-slate-500" fill="currentColor" /></slot>
  </div>
</template>
