<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { tickStudio, storageError } from '@/services/studio';
import { currentUser } from '@/services/identity';
let ticker: ReturnType<typeof setInterval>;
let ticking = false;
onMounted(() => { ticker = setInterval(async () => { if (ticking || !currentUser.value) return; ticking = true; try { await tickStudio(); } finally { ticking = false; } }, 1000); });
onBeforeUnmount(() => clearInterval(ticker));
import { RouterView, useRoute } from 'vue-router';
import { Toaster } from 'vue-sonner';
import Sidebar from '@/layout/Sidebar.vue';
import InspirationDialog from '@/layout/InspirationDialog.vue';
import VideoPlayerDialog from '@/components/VideoPlayerDialog.vue';
const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-[#eef0f3] text-slate-900">
    <RouterView v-if="route.name === 'unlock' || route.name === 'auth'" />
    <template v-else-if="route.matched.length">
      <Sidebar />
      <div v-if="storageError" role="alert" class="fixed bottom-4 right-4 z-50 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{{ storageError }}</div>
      <div class="min-h-screen py-3 pl-[104px] pr-3">
        <div
          :class="
            route.meta.immersive
              ? 'flex h-[calc(100vh-24px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]'
              : 'min-h-[calc(100vh-24px)] overflow-hidden rounded-[20px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]'
          "
        >
          <main
            v-if="!route.meta.immersive"
            :class="route.meta.wide ? 'flex-1 px-8 py-6' : 'mx-auto w-full max-w-[1400px] flex-1 px-6 py-6'"
          >
            <RouterView :key="route.path" />
          </main>
          <div v-else class="min-h-0 flex-1">
            <RouterView :key="route.path" />
          </div>
        </div>
      </div>
    </template>
    <InspirationDialog />
    <VideoPlayerDialog />
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
