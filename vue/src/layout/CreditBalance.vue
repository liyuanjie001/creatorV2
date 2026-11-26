<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { CreditsIcon } from '@/components/shared';
import { creditsBalance } from '@/services/credits';
import { currentUser } from '@/services/identity';
import { animateCreditClaim, prefersReducedMotion } from '@/lib/animateCreditClaim';

const router = useRouter();
const button = ref<HTMLButtonElement | null>(null);
const balanceText = ref<HTMLElement | null>(null);
const displayed = ref(creditsBalance.value);
const feedback = ref<{ left: number; top: number; width: number; height: number }>();
const landed = ref(false);
const formatted = computed(() => displayed.value.toLocaleString());
let expectedBalance: number | undefined;
let cancelFlight: (() => void) | undefined;
let frame = 0;
let finishTimer: ReturnType<typeof setTimeout> | undefined;
let animationId = 0;

function cancel() {
  animationId++;
  cancelFlight?.();
  cancelFlight = undefined;
  cancelAnimationFrame(frame);
  clearTimeout(finishTimer);
  feedback.value = undefined;
  landed.value = false;
  expectedBalance = undefined;
  displayed.value = creditsBalance.value;
}

function claimed({ source, before, after }: { source: HTMLElement; before: number; after: number }) {
  cancel();
  const target = button.value;
  if (!target || !balanceText.value || prefersReducedMotion()) {
    toast.success('签到成功，10积分已到账');
    return;
  }
  expectedBalance = after;
  displayed.value = before;
  const bounds = target.getBoundingClientRect();
  feedback.value = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
  const id = animationId;

  const complete = () => {
    if (id !== animationId) return;
    cancel();
    toast.success('签到成功，10积分已到账');
  };
  const arrive = () => {
    if (id !== animationId) return;
    landed.value = true;
    const start = performance.now();
    const step = (time: number) => {
      if (id !== animationId) return;
      const progress = Math.min(1, (time - start) / 550);
      displayed.value = Math.round(before + (after - before) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
      else finishTimer = setTimeout(complete, 150);
    };
    frame = requestAnimationFrame(step);
  };
  try {
    cancelFlight = animateCreditClaim(source, balanceText.value, arrive);
  } catch {
    complete();
  }
}

watch(creditsBalance, (value) => {
  if (expectedBalance !== undefined && value === expectedBalance) return;
  cancel();
});
watch(() => currentUser.value?.id, cancel, { flush: 'sync' });
onMounted(() => window.addEventListener('resize', cancel));
onBeforeUnmount(() => {
  cancel();
  window.removeEventListener('resize', cancel);
});
defineExpose({ claimed, cancel });
</script>

<template>
  <button
    ref="button"
    type="button"
    class="flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-800 max-[380px]:px-1 sm:px-3"
    title="积分"
    @click="router.push('/me')"
  >
    <CreditsIcon class="h-4 w-4 max-[380px]:hidden" />
    <span
      ref="balanceText"
      class="max-w-[52px] truncate text-[13px] font-semibold tabular-nums text-slate-800 max-[380px]:max-w-[32px] sm:max-w-none"
      aria-label="积分余额"
    >
      {{ formatted }}
    </span>
  </button>
  <Teleport to="body">
    <div
      v-if="feedback"
      data-credit-balance-feedback
      aria-hidden="true"
      class="pointer-events-none fixed z-[1001] flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 text-[13px] font-semibold tabular-nums text-slate-800 max-[380px]:px-1 sm:px-3"
      :class="{ 'credit-balance-landed': landed }"
      :style="{
        left: `${feedback.left}px`,
        top: `${feedback.top}px`,
        width: `${feedback.width}px`,
        height: `${feedback.height}px`,
      }"
    >
      <CreditsIcon class="h-4 w-4 max-[380px]:hidden" />
      <span class="max-w-[52px] truncate max-[380px]:max-w-[32px] sm:max-w-none">{{ formatted }}</span>
      <span
        v-if="landed"
        class="credit-balance-gain absolute top-full mt-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600"
      >
        +10
      </span>
    </div>
  </Teleport>
</template>

<style scoped>
.credit-balance-landed {
  animation: credit-balance-pulse 700ms ease-out;
}
.credit-balance-gain {
  animation: credit-balance-gain 700ms ease-out both;
}
@keyframes credit-balance-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 #fbbf2470;
  }
  30% {
    transform: scale(1.1);
    color: #d97706;
    box-shadow: 0 0 0 7px #fbbf2420;
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 12px #fbbf2400;
  }
}
@keyframes credit-balance-gain {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  25%,
  65% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
