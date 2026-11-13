<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui';
import {
  socialAccountsRemaining,
  normalizeClaimItems,
  type AccountClaimItem,
  type AccountClaim,
} from '@/services/credits';
import { claimSocialAccounts } from '@/services/purchasedAccounts';
import { currentUser } from '@/services/identity';
import { uid } from '@/services/storage';
import { platforms, platformName } from '@/services/accounts';
import { countryName } from '@/services/countries';
import CountrySelect from './CountrySelect.vue';
import AccountPurchaseInfo from './AccountPurchaseInfo.vue';
import { Plus, Trash2 } from 'lucide-vue-next';
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const router = useRouter();
const newRow = () => ({ id: uid(), platform: 'tiktok' as const, countryCode: 'US', quantity: 0 });
const rows = ref<(AccountClaimItem & { id: string })[]>([newRow()]);
const requestId = ref(''),
  pendingRequest = ref(false),
  busy = ref(false),
  error = ref(''),
  result = ref<AccountClaim | null>(null);
const total = computed(() => rows.value.reduce((sum, row) => sum + Number(row.quantity), 0));
const validationError = computed(() => {
  try {
    normalizeClaimItems(rows.value);
    return total.value > socialAccountsRemaining.value ? '领取数量不能超过待领取名额' : '';
  } catch (reason) {
    return (reason as Error).message;
  }
});
const valid = computed(() => !validationError.value);
const locked = computed(() => busy.value || pendingRequest.value);
watch(
  () => props.open,
  (open) => {
    if (open && !pendingRequest.value) {
      rows.value = [newRow()];
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
    result.value = claimSocialAccounts(
      requestId.value,
      rows.value.map(({ platform, countryCode, quantity }) => ({ platform, countryCode, quantity })),
    );
    pendingRequest.value = false;
  } catch (reason) {
    error.value = (reason as Error).message;
    pendingRequest.value = error.value.includes('领取记录已保存');
  } finally {
    busy.value = false;
  }
}
function focusClaim(event: Event) {
  event.preventDefault();
  (event.target as HTMLElement)
    .querySelector<HTMLElement>('select:not(:disabled), button.studio-primary:not(:disabled)')
    ?.focus();
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
    <DialogContent
      class="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6"
      @open-auto-focus="focusClaim"
    >
      <DialogTitle class="flex items-center">
        {{ result ? '帐号领取成功' : '领取社媒帐号' }}
        <AccountPurchaseInfo />
      </DialogTitle>
      <DialogDescription>
        选择平台、国家地区和数量，支持混合及分批领取，帐号与剩余名额长期有效。
      </DialogDescription>
      <template v-if="result">
        <div class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          已领取 {{ result.accounts.length }} 个帐号，所有项目均可选择，直接通过本平台发布视频、图文等作品。
        </div>
        <ul v-if="result.items" class="space-y-1 text-sm text-sky-700" aria-label="领取组合汇总">
          <li v-for="item in result.items" :key="`${item.platform}:${item.countryCode}`">
            {{ platformName(item.platform) }} · {{ countryName(item.countryCode) }} × {{ item.quantity }}
          </li>
        </ul>
        <ul class="space-y-2 text-sm text-slate-600">
          <li v-for="account in result.accounts" :key="account.id">
            <p class="break-words">{{ account.name }} · {{ account.region }}</p>
            <p class="break-all text-xs text-slate-400">{{ account.handle }}</p>
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
          <div
            v-for="(row, index) in rows"
            :key="row.id"
            class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_5rem_auto]"
            :aria-label="`领取组合 ${index + 1}`"
          >
            <label class="col-span-2 min-w-0 text-xs text-slate-500 sm:col-span-1">
              <span class="mb-1.5 block">平台</span>
              <select
                v-model="row.platform"
                :disabled="locked"
                :aria-label="`第 ${index + 1} 组平台`"
                class="studio-field !w-full"
              >
                <option v-for="platform in platforms" :key="platform.value" :value="platform.value">
                  {{ platform.label }}
                </option>
              </select>
            </label>
            <div class="col-span-2 min-w-0 text-xs text-slate-500 sm:col-span-1">
              <span class="mb-1.5 block">国家地区</span>
              <CountrySelect
                v-model="row.countryCode"
                :disabled="locked"
                :label="`第 ${index + 1} 组国家地区`"
              />
            </div>
            <label class="min-w-0 text-xs text-slate-500">
              <span class="mb-1.5 block">数量</span>
              <input
                v-model.number="row.quantity"
                type="number"
                min="0"
                :max="socialAccountsRemaining"
                step="1"
                :disabled="locked"
                :aria-label="`第 ${index + 1} 组领取数量`"
                class="studio-field !w-full"
              />
            </label>
            <button
              type="button"
              class="studio-btn h-10 !px-2 text-slate-400 disabled:opacity-40"
              :disabled="locked || rows.length === 1"
              :aria-label="`删除第 ${index + 1} 组`"
              @click="rows.splice(index, 1)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            class="studio-btn w-fit text-sm"
            :disabled="locked"
            @click="rows.push(newRow())"
          >
            <Plus class="h-4 w-4" />
            添加组合
          </button>
          <p class="text-sm text-slate-500" aria-live="polite">
            本次领取 {{ Number.isFinite(total) ? total : 0 }} 个 · 剩余
            {{
              pendingRequest
                ? socialAccountsRemaining
                : Math.max(0, socialAccountsRemaining - (Number.isFinite(total) ? total : 0))
            }}
            个
          </p>
          <p
            v-if="!valid && !pendingRequest && rows.some((row) => row.quantity !== 0)"
            class="text-xs text-rose-600"
          >
            {{ validationError }}
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
          <p class="text-sm text-slate-500">暂无待领取名额，购买套餐或帐号可获得社媒帐号名额。</p>
          <button class="studio-primary w-full justify-center" @click="recharge">前往充值</button>
        </template>
      </template>
    </DialogContent>
  </Dialog>
</template>
