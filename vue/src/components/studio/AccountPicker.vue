<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';
import { Search, ChevronDown, Check } from 'lucide-vue-next';
import type { TKAccount } from '@/types/studio';
import { loginStatus, accountPlatform, platformName, platforms } from '@/services/accounts';
import { dateTime } from '@/services/videoManagement';
const props = defineProps<{
  accounts: TKAccount[];
  groups: { id: string; name: string }[];
  modelValue: string;
  selectedAccount?: TKAccount;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [id: string]; authorize: [account: TKAccount] }>();
const open = ref(false),
  query = ref('');
const platform = ref('');
const search = ref<HTMLInputElement>();
const groupName = (account: TKAccount) =>
  props.groups.find((g) => g.id === account.groupId)?.name || '未分组';
const selected = computed(
  () => props.selectedAccount ?? props.accounts.find((a) => a.id === props.modelValue),
);
const unavailable = computed(
  () => !!props.modelValue && !props.accounts.some((a) => a.id === props.modelValue),
);
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.accounts.filter(a => !platform.value || accountPlatform(a) === platform.value).filter((a) =>
    `${a.name} ${a.handle} ${groupName(a)} ${a.note} ${platformName(accountPlatform(a))}`.toLowerCase().includes(q),
  );
});
watch(open, (value) => {
  if (value) { query.value = ''; platform.value = ''; }
});
watch(
  () => props.disabled,
  (value) => {
    if (value) open.value = false;
  },
);
function choose(account: TKAccount) {
  if (
    props.disabled ||
    account.deleted ||
    account.status !== '已授权' ||
    !props.accounts.some((a) => a.id === account.id)
  )
    return;
  emit('update:modelValue', account.id);
  open.value = false;
}
function keyboard(event: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.isComposing) return;
  if (event.target === search.value && ['Home', 'End'].includes(event.key)) return;
  const buttons = Array.from(
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[data-account-action]:not(:disabled)',
    ),
  );
  if (!buttons.length) return;
  event.preventDefault();
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : event.key === 'ArrowDown'
          ? (index + 1) % buttons.length
          : (index <= 0 ? buttons.length : index) - 1;
  buttons[next]?.focus();
}
</script>

<template>
  <div>
    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          aria-label="选择发布帐号"
          :disabled="disabled"
          class="flex min-h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
        >
          <span class="min-w-0 flex-1 truncate">
            {{
              selected ? `${selected.name} · ${selected.handle} · ${platformName(accountPlatform(selected))}` : modelValue ? '帐号不可用' : '请选择帐号'
            }}
          </span>
          <span
            v-if="modelValue"
            class="shrink-0 rounded-md px-2 py-1 text-[11px]"
            :class="
              !unavailable && selected?.status === '已授权'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            "
          >
            {{ unavailable ? '不可用' : loginStatus(selected?.status || '') }}
          </span>
          <ChevronDown class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          aria-label="发布帐号列表"
          class="z-[60] flex max-h-[min(480px,var(--reka-popover-content-available-height))] w-[var(--reka-popover-trigger-width)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl outline-none"
          @open-auto-focus.prevent="nextTick(() => search?.focus())"
          @keydown="keyboard"
        >
<label class="mb-2 flex items-center gap-2 text-xs text-slate-500">平台<select v-model="platform" aria-label="筛选帐号平台" class="studio-field !h-9"><option value="">全部平台</option><option v-for="p in platforms" :key="p.value" :value="p.value">{{ p.label }}</option></select></label>
          <label class="relative m-3 block shrink-0">
            <Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              ref="search"
              v-model="query"
              aria-label="搜索发布帐号"
              placeholder="搜索名称、用户名、分组或备注"
              class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-sky-300"
            />
          </label>
          <div class="min-h-0 overflow-y-auto overscroll-contain px-2 pb-2">
            <div
              v-for="account in filtered"
              :key="account.id"
              class="rounded-lg border-b border-slate-100 last:border-0"
              :class="account.id === modelValue ? 'bg-sky-50/60' : ''"
            >
              <button
                type="button"
                data-account-action
                :aria-label="`选择 ${account.handle}${accountPlatform(account) === 'tiktok' ? '' : ' · ' + platformName(accountPlatform(account))}`"
                :disabled="account.status !== '已授权'"
                class="flex w-full items-start gap-3 rounded-lg p-3 text-left outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 disabled:cursor-not-allowed"
                @click="choose(account)"
              >
                <span
                  class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-medium text-white"
                >
                  {{ account.name.slice(0, 1) }}
                </span>
                <span class="min-w-0 flex-1 space-y-1 text-xs">
                  <span class="flex flex-wrap items-center gap-2">
                    <strong class="break-all text-sm font-medium text-slate-800">{{ account.name }}</strong>
                    <span
                      class="rounded px-1.5 py-0.5 text-[11px]"
                      :class="
                        account.status === '已授权'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      "
                    >
                      {{ loginStatus(account.status) }}
                    </span>
                  </span>
                  <span class="block break-all text-slate-500">{{ account.handle }} · {{ platformName(accountPlatform(account)) }}</span>
                  <span class="block break-words text-slate-500">
                    分组：{{ groupName(account) }} · 备注：{{ account.note || '未填写' }}
                  </span>
                  <span class="block text-[11px] text-slate-400">
                    授权时间：{{ dateTime(account.authorizedAt) }}
                  </span>
                </span>
                <Check
                  v-if="account.id === modelValue"
                  class="mt-1 h-4 w-4 shrink-0 text-sky-600"
                  aria-label="已选中"
                />
              </button>
              <button
                v-if="account.status !== '已授权'"
                type="button"
                data-account-action
                :aria-label="`立即登录授权 ${account.handle}`"
                class="mb-3 ml-[60px] rounded-md bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 outline-none hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-300"
                @click="
                  open = false;
                  emit('authorize', account);
                "
              >
                立即登录授权
              </button>
            </div>
            <p v-if="!filtered.length" class="px-3 py-8 text-center text-xs text-slate-400">
              {{
                accounts.length
                  ? '没有匹配的帐号，请尝试其他关键词'
                  : '当前项目暂无关联帐号，请在项目设置中关联帐号'
              }}
            </p>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
    <p v-if="unavailable" role="alert" class="mt-2 text-xs text-amber-600">
      已选帐号已删除或不再关联当前项目，请重新选择。
    </p>
    <p v-else-if="selected && selected.status !== '已授权'" role="alert" class="mt-2 text-xs text-amber-600">
      登录过期，请立即登录授权后再发布。
    </p>
  </div>
</template>
