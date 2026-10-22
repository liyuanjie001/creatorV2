<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { Toaster } from 'vue-sonner';
import Sidebar from '@/layout/Sidebar.vue';
import Topbar from '@/layout/Topbar.vue';
const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-[#f5f8fb] text-slate-900">
    <RouterView v-if="route.name === 'unlock'" />
    <RouterView v-else-if="route.meta.immersive" :key="route.path" />
    <template v-else-if="route.matched.length">
      <Sidebar />
      <div class="pl-60">
        <Topbar />
        <main class="mx-auto max-w-[1400px] px-6 py-6">
          <RouterView :key="route.path" />
        </main>
      </div>
    </template>
    <Toaster
      theme="light"
      position="top-center"
      :toast-options="{
        style: {
          background: '#ffffff',
          border: '1px solid #e2e9ee',
          color: '#0f172a',
        },
      }"
    />
  </div>
</template>
