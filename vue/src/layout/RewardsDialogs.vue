<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Check, Gift, LockKeyhole, RotateCcw, Sparkles } from 'lucide-vue-next';
import { CreditsIcon } from '@/components/shared';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { currentUser } from '@/services/identity';
import { claimDailyCredits, creditsBalance, getCheckInStatus, resetCheckIn } from '@/services/credits';
import { toast } from 'vue-sonner';

const checkInOpen = ref(false);
const status = ref<ReturnType<typeof getCheckInStatus>>();
const busy = ref(false);
let lastError = '';
const claimButton = ref<HTMLButtonElement | null>(null);
const emit = defineEmits<{
  claimed: [{ source: HTMLElement; amount: number; before: number; after: number }];
  closed: [];
  reset: [];
}>();
const claimLabel = computed(() =>
  busy.value
    ? '正在领取…'
    : !status.value
      ? '暂时无法领取'
      : !status.value.eligible
        ? '请使用个人账号登录'
        : status.value.completed
          ? '已领满100积分'
          : status.value.checkedInToday
            ? '今日已签到，明天再来'
            : '立即签到 · 领取10积分',
);

function updateStatus() {
  try {
    status.value = getCheckInStatus();
    lastError = '';
  } catch (e) {
    status.value = undefined;
    const message = (e as Error).message;
    if (message !== lastError) toast.error(message);
    lastError = message;
  }
}
function openCheckIn() {
  lastError = '';
  updateStatus();
  checkInOpen.value = true;
}
function claim() {
  if (busy.value) return;
  busy.value = true;
  const before = creditsBalance.value;
  try {
    status.value = claimDailyCredits();
    emit('claimed', {
      source: claimButton.value ?? document.body,
      amount: 10,
      before,
      after: creditsBalance.value,
    });
  } catch (e) {
    lastError = (e as Error).message;
    toast.error(lastError);
    updateStatus();
  } finally {
    busy.value = false;
  }
}
function reset() {
  if (busy.value || !status.value?.eligible || !status.value.days) return;
  busy.value = true;
  try {
    status.value = resetCheckIn();
    emit('reset');
    toast.success('签到功能已重置，可以重新领取');
  } catch (e) {
    lastError = (e as Error).message;
    toast.error(lastError);
    updateStatus();
  } finally {
    busy.value = false;
  }
}
let timer: ReturnType<typeof setInterval> | undefined;
watch(checkInOpen, (open) => {
  clearInterval(timer);
  if (open) timer = setInterval(() => updateStatus(), 1000);
  else emit('closed');
});
watch(
  () => currentUser.value?.id,
  () => {
    checkInOpen.value = false;
  },
);
onBeforeUnmount(() => clearInterval(timer));
defineExpose({ openCheckIn });
</script>

<template>
  <Dialog v-model:open="checkInOpen">
    <DialogContent class="w-[calc(100vw-32px)] max-w-[520px] gap-0 overflow-hidden rounded-3xl border-0 p-0">
      <div class="max-h-[85vh] overflow-y-auto">
        <DialogHeader
          class="bg-gradient-to-br from-orange-50 via-amber-50 to-white px-6 pb-6 pt-8 text-left sm:px-8"
        >
          <span
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm"
          >
            <Gift class="h-6 w-6" />
          </span>
          <DialogTitle class="text-2xl font-semibold text-slate-900">签到领好礼</DialogTitle>
          <DialogDescription class="pt-2 text-sm text-slate-500">
            每天来签到，领取10积分，累计最高100积分
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-5 px-6 pb-7 sm:px-8">
          <div
            class="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
          >
            <div>
              <p class="text-xs font-medium text-amber-700">
                {{
                  status?.completed
                    ? '签到奖励已全部领取'
                    : status?.checkedInToday
                      ? '今日奖励已到账'
                      : '今日签到奖励'
                }}
              </p>
              <p class="mt-1 flex items-baseline gap-1 text-orange-600">
                <span class="text-3xl font-semibold tracking-tight">+10</span>
                <span class="text-sm">积分</span>
              </p>
              <p class="mt-1 text-xs text-amber-700/70">
                {{
                  status?.completed
                    ? '累计100积分，感谢你的每一次签到'
                    : status?.checkedInToday
                      ? '明天再来，继续积累创作灵感'
                      : '每天签到，把灵感变成更多创作'
                }}
              </p>
            </div>
            <span
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm shadow-amber-200/60"
            >
              <CreditsIcon class="h-11 w-11" />
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">本轮已累计领取</span>
            <span class="font-semibold text-orange-600">
              {{ status?.earned ?? 0 }}
              <span class="font-normal text-slate-400">/ 100积分</span>
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="签到奖励领取进度"
            :aria-valuenow="status?.earned ?? 0"
            :aria-valuemin="0"
            :aria-valuemax="100"
            class="!mt-2 h-1.5 overflow-hidden rounded-full bg-orange-50"
          >
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-300 motion-reduce:transition-none"
              :style="{ width: `${status?.earned ?? 0}%` }"
            />
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div
              v-for="day in 10"
              :key="day"
              :class="[
                'flex flex-col items-center gap-1 rounded-xl border py-3 text-xs',
                day <= (status?.days ?? 0)
                  ? 'border-orange-100 bg-orange-50 text-orange-600'
                  : status?.canClaim && day === status.days + 1
                    ? 'border-orange-300 bg-orange-50 text-orange-600 ring-2 ring-orange-100'
                    : 'border-slate-100 bg-slate-50 text-slate-400',
              ]"
            >
              <span>第{{ day }}次</span>
              <Check v-if="day <= (status?.days ?? 0)" class="my-0.5 h-5 w-5" />
              <Sparkles
                v-else-if="status?.canClaim && day === status.days + 1"
                class="my-0.5 h-5 w-5 text-amber-500"
              />
              <LockKeyhole v-else class="my-0.5 h-5 w-5 text-slate-300" />
              <span class="font-semibold">+10积分</span>
            </div>
          </div>
          <button
            ref="claimButton"
            type="button"
            :disabled="!status?.canClaim || busy"
            class="h-12 w-full rounded-xl bg-orange-500 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
            @click="claim"
          >
            {{ claimLabel }}
          </button>
          <button
            v-if="!status"
            type="button"
            class="w-full text-center text-xs text-orange-600 hover:underline"
            @click="updateStatus"
          >
            重新加载领取状态
          </button>
          <div class="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              :disabled="busy || !status?.eligible || !status.days"
              class="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-default disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
              @click="reset"
            >
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
              功能重置
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
