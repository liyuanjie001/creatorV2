<script setup lang="ts">
import { Wand2, AtSign, Clapperboard } from 'lucide-vue-next';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { toast } from 'vue-sonner';
import Topbar from '@/layout/Topbar.vue';
import { useAssetLibrary } from '@/composables/useAssetLibrary';
import AssetSidebar from '@/components/assets/AssetSidebar.vue';
import AssetToolbar from '@/components/assets/AssetToolbar.vue';
import AssetContent from '@/components/assets/AssetContent.vue';
useAssetLibrary();
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AssetSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <Topbar></Topbar>
      <div class="flex-1 overflow-y-auto scroll-slim">
        <div class="px-6 py-5">
          <AssetToolbar />
          <AssetContent />
          <div
            class="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/60 backdrop-blur"
          >
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl brand-gradient">
                <Clapperboard class="h-5 w-5 text-white"></Clapperboard>
              </span>
              <div class="relative flex-1">
                <Input
                  placeholder="描述你的需求，基于素材生成新内容，例如：用「数字人艾米」拍一条精华实测短片…"
                  class="h-11 border-slate-200 bg-slate-50 pr-24 text-[13px] placeholder:text-slate-400 focus-visible:ring-sky-300"
                ></Input>
                <span
                  class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[10.5px] text-sky-500"
                >
                  <AtSign class="h-3 w-3"></AtSign>
                  可引用元素
                </span>
              </div>
              <Button
                class="h-11 gap-2 brand-gradient px-5 text-white hover:opacity-90"
                @click="toast.success('已加入生成队列（演示）')"
              >
                <Wand2 class="h-4 w-4"></Wand2>
                开始生成
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
