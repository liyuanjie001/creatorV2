<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import { socialAccountsRemaining, type AccountAllocation, type AccountClaim } from '@/services/credits';
import { claimSocialAccounts } from '@/services/purchasedAccounts';
import { currentUser } from '@/services/identity';
import { uid } from '@/services/storage';
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const router = useRouter();
const allocation = ref<AccountAllocation>({ facebook: 0, instagram: 0, tiktok: 0 });
const choices = [{ key: 'tiktok', label: 'TikTok (TK)' }] as const;
const requestId = ref(''),
  pendingRequest = ref(false),
  busy = ref(false),
  error = ref(''),
  result = ref<AccountClaim | null>(null);
const total = computed(() => choices.reduce((sum, choice) => sum + allocation.value[choice.key], 0));
const valid = computed(
  () =>
    choices.every(
      (choice) => Number.isSafeInteger(allocation.value[choice.key]) && allocation.value[choice.key] >= 0,
    ) &&
    total.value > 0 &&
    total.value <= socialAccountsRemaining.value,
);
watch(
  () => props.open,
  (open) => {
    if (open && !pendingRequest.value) {
      allocation.value = { facebook: 0, instagram: 0, tiktok: 0 };
      requestId.value = uid();
      error.value = '';
      result.value = null;
    }
  },
);
watch(
  () => currentUser.value?.id,
  () => {
    pendingRequest.value = false;
    result.value = null;
    emit('update:open', false);
  },
);
function claim() {
  if (busy.value || (!valid.value && !pendingRequest.value)) return;
  busy.value = true;
  error.value = '';
  try {
    result.value = claimSocialAccounts(requestId.value, allocation.value);
    pendingRequest.value = false;
  } catch (reason) {
    error.value = (reason as Error).message;
    pendingRequest.value = error.value.includes('领取记录已保存');
  } finally {
    busy.value = false;
  }
}
function manage() {
  emit('update:open', false);
  void router.push('/accounts');
}
function recharge() {
  emit('update:open', false);
  void router.push('/me');
}
</script>
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
      <DialogTitle>{{ result ? '帐号领取成功' : '领取 TikTok 帐号' }}</DialogTitle>
      <DialogDescription>仅提供 TikTok (TK) 帐号，支持分批领取，帐号与剩余名额长期有效。</DialogDescription>
      <div class="rounded-xl bg-sky-50 p-3">
        <p class="text-sm font-semibold text-sky-700">领取后可直接通过本平台发布视频至 TikTok</p>
        <p class="mt-1 text-xs leading-5 text-slate-500">
          绑定对应帐号后，也可通过本平台发布至 Facebook / Instagram。
        </p>
      </div>
      <p class="text-xs leading-5 text-slate-500">帐号所有权归用户，登录信息可在帐号管理中查看。</p>
      <template v-if="result">
        <div class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          已领取 {{ result.accounts.length }} 个帐号，所有项目均可选择，直接通过本平台发布视频。
        </div>
        <ul class="space-y-2 text-sm text-slate-600">
          <li v-for="account in result.accounts" :key="account.id">
            {{ account.name }} · {{ account.handle }}
          </li>
        </ul>
        <p class="text-xs text-slate-500">前往帐号管理，打开帐号详情即可查看用户名、密码和 IP 信息。</p>
        <button class="studio-primary w-full justify-center" @click="manage">查看帐号管理</button>
      </template>
      <template v-else>
        <div class="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
          待领取名额：
          <strong>{{ socialAccountsRemaining }}</strong>
          个
        </div>
        <template v-if="socialAccountsRemaining > 0 || pendingRequest">
          <label
            v-for="choice in choices"
            :key="choice.key"
            class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-sm"
          >
            <span>{{ choice.label }}</span>
            <input
              v-model.number="allocation[choice.key]"
              type="number"
              min="0"
              :max="socialAccountsRemaining"
              step="1"
              :disabled="busy || pendingRequest"
              :aria-label="choice.label + ' 领取数量'"
              class="studio-field !w-24"
            />
          </label>
          <p class="text-sm text-slate-500">
            本次领取 {{ total || 0 }} 个 · 默认美国地区 · 领取后无需再次授权
          </p>
          <p v-if="!valid && total > 0 && !pendingRequest" class="text-xs text-rose-600">
            请输入非负整数，合计不能超过剩余名额。
          </p>
          <p v-if="error" role="alert" class="text-sm text-rose-600">{{ error }}</p>
          <button
            class="studio-primary w-full justify-center"
            :disabled="busy || (!valid && !pendingRequest)"
            @click="claim"
          >
            {{ busy ? '领取中…' : pendingRequest ? '重试帐号交付' : '确认领取' }}
          </button>
        </template>
        <template v-else>
          <p class="text-sm text-slate-500">暂无待领取名额，充值套餐可获得积分与 TikTok 帐号。</p>
          <button class="studio-primary w-full justify-center" @click="recharge">前往充值</button>
        </template>
      </template>
    </DialogContent>
  </Dialog>
</template>
