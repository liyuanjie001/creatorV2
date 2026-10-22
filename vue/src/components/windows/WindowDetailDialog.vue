<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { PlatformBadge } from '@/components/shared';
import { platforms } from '@/data/mock';
import { useWindowManager } from '@/composables/useWindowManager';
import { useDemoTimers } from '@/composables/useDemoTimers';

const windowId = defineModel<string>('windowId', { default: '' });
const emit = defineEmits<{ report: [windowId: string] }>();
const manager = useWindowManager();
const window = computed(() => manager.windows.value.find((w) => w.id === windowId.value));
const busy = ref('');
const { delay } = useDemoTimers();
let generation = 0;
watch(windowId, () => {
  generation++;
  busy.value = '';
});
function recover(accountId: string) {
  busy.value = accountId;
  const current = generation;
  delay(() => {
    if (current !== generation) return;
    manager.synchronize(manager.selectedProjectIds.value, [accountId]);
    busy.value = '';
  }, 1200);
}
function viewReport() {
  emit('report', windowId.value);
  windowId.value = '';
}
</script>

<template>
  <Dialog
    :open="Boolean(window)"
    @update:open="
      (value) => {
        if (!value) windowId = '';
      }
    "
  >
    <DialogContent class="max-w-2xl rounded-2xl border-slate-200 bg-white">
      <DialogTitle class="pr-6 text-lg text-slate-800">{{ window?.name }}</DialogTitle>
      <DialogDescription class="text-[12px] text-slate-400">
        窗口 #{{ window?.serial }} · {{ window?.region }} · {{ manager.projectForWindow(windowId)?.name }}
      </DialogDescription>
      <div class="rounded-lg bg-sky-50 px-4 py-3 text-[12px] leading-5 text-sky-700">
        每个平台选择一个目标账号。账号身份需要登录检查确认；同一账号可在多个窗口关联，分析时统一去重。
      </div>
      <div class="space-y-2">
        <div v-for="platform in platforms" :key="platform" class="rounded-xl border border-slate-200 p-3.5">
          <div class="flex items-center gap-3">
            <PlatformBadge :platform="platform" />
            <span
              class="ml-auto text-[11px]"
              :class="
                manager.windowAccounts(windowId).find((a) => a.platform === platform)?.status === '正常'
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              "
            >
              {{ manager.windowAccounts(windowId).find((a) => a.platform === platform)?.status ?? '未登录' }}
            </span>
          </div>
          <template
            v-for="account in manager.windowAccounts(windowId).filter((a) => a.platform === platform)"
            :key="account.id"
          >
            <div class="mt-3 flex items-center gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-medium text-slate-700">{{ account.name }}</p>
                <p class="mt-1 truncate text-[11px] text-slate-400">
                  {{ account.handle }} · 平台账号 ID {{ account.platformAccountId }}
                </p>
              </div>
              <Button
                v-if="account.status === '登录失效'"
                size="sm"
                variant="outline"
                class="border-amber-200 text-[11px] text-amber-700"
                :disabled="Boolean(busy)"
                @click="recover(account.id)"
              >
                {{ busy === account.id ? '正在恢复并同步…' : '模拟恢复登录并同步' }}
              </Button>
            </div>
          </template>
        </div>
      </div>
      <Button class="brand-gradient text-white" @click="viewReport">查看此窗口数据</Button>
    </DialogContent>
  </Dialog>
</template>
