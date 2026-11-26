<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ArrowUpRight, Check, Coins, Copy, Gift, Link, Megaphone, UserPlus, Users } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { currentUser } from '@/services/identity';
import { referralRewards, refreshRechargeAccount } from '@/services/credits';
import { canPromote, getInvitationCode, getInvitedUsers, invitationUrl } from '@/services/invitations';

type ViewMode = 'actual' | 'populated' | 'empty';
type InvitationRow = {
  id: string;
  name: string;
  registeredAt: string;
  credits: number | null;
  rewardedAt?: string;
};
const mode = ref<ViewMode>(canPromote(currentUser.value) ? 'actual' : 'populated');
const tab = ref<'invitations' | 'rewards'>('invitations');
const code = ref('');
const invitees = ref<ReturnType<typeof getInvitedUsers>>([]);
const error = ref('');
const eligible = computed(() => canPromote(currentUser.value));
const isDemo = computed(() => mode.value !== 'actual');
// Preview fixtures stay in memory; switching modes never changes a wallet or invitation registry.
const demoRows: InvitationRow[] = [
  {
    id: 'demo-1',
    name: '林晓',
    registeredAt: '2026-11-25T02:30:00Z',
    credits: 96,
    rewardedAt: '2026-11-25T03:18:00Z',
  },
  {
    id: 'demo-2',
    name: '陈可',
    registeredAt: '2026-11-24T06:12:00Z',
    credits: 227,
    rewardedAt: '2026-11-24T07:10:00Z',
  },
  { id: 'demo-3', name: 'Mia', registeredAt: '2026-11-23T01:45:00Z', credits: null },
  {
    id: 'demo-4',
    name: '张一帆',
    registeredAt: '2026-11-22T08:20:00Z',
    credits: 500,
    rewardedAt: '2026-11-22T09:05:00Z',
  },
  { id: 'demo-5', name: 'Alex', registeredAt: '2026-11-21T03:10:00Z', credits: null },
  { id: 'demo-6', name: '许晴', registeredAt: '2026-11-20T07:30:00Z', credits: null },
  { id: 'demo-7', name: '周宁', registeredAt: '2026-11-19T02:18:00Z', credits: null },
  { id: 'demo-8', name: '小鹿工作室', registeredAt: '2026-11-18T05:45:00Z', credits: null },
];
const rows = computed<InvitationRow[]>(() => {
  if (mode.value === 'empty') return [];
  if (mode.value === 'populated') return demoRows;
  if (!eligible.value) return [];
  return invitees.value
    .map((friend) => {
      const reward = referralRewards.value.find((item) => item.buyerId === friend.userId);
      return {
        id: friend.userId,
        name: friend.name,
        registeredAt: friend.registeredAt,
        credits: reward?.credits ?? null,
        rewardedAt: reward?.createdAt,
      };
    })
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
});
const paidRows = computed(() => rows.value.filter((item) => item.credits !== null));
const visibleRows = computed(() =>
  tab.value === 'rewards'
    ? [...paidRows.value].sort((a, b) => (b.rewardedAt ?? '').localeCompare(a.rewardedAt ?? ''))
    : rows.value,
);
const total = computed(() => paidRows.value.reduce((sum, item) => sum + (item.credits ?? 0), 0));
const displayedCode = computed(() => (isDemo.value ? 'ROXYDEMO2026' : code.value));
const link = computed(() => (!isDemo.value && code.value ? invitationUrl(code.value) : ''));

function refresh() {
  error.value = '';
  if (isDemo.value || !eligible.value) return;
  try {
    refreshRechargeAccount();
    code.value = getInvitationCode(currentUser.value!);
    invitees.value = getInvitedUsers(currentUser.value!.id);
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function changeMode(next: ViewMode) {
  mode.value = next;
  error.value = '';
  refresh();
}
async function copy(value: string, label: string) {
  if (isDemo.value || !eligible.value || !value) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('unavailable');
    await navigator.clipboard.writeText(value);
    toast.success(`${label}已复制`);
  } catch {
    toast.error('复制失败，请长按或选中下方内容手动复制');
  }
}
function date(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
}
watch(
  () => currentUser.value?.id,
  () => {
    code.value = '';
    invitees.value = [];
    changeMode(eligible.value ? 'actual' : 'populated');
  },
  { immediate: true },
);
onMounted(() => window.addEventListener('storage', refresh));
onBeforeUnmount(() => window.removeEventListener('storage', refresh));
</script>

<template>
  <section aria-label="推广计划页面" class="mx-auto max-w-[1400px] space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">推广计划</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">邀请好友一起创作，让每一次分享都有回报</p>
      </div>
      <div
        aria-label="推广数据视图"
        role="group"
        class="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs"
      >
        <button
          v-if="eligible"
          type="button"
          :aria-pressed="mode === 'actual'"
          :class="[
            'rounded-lg px-3 py-2 transition',
            mode === 'actual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ]"
          @click="changeMode('actual')"
        >
          真实数据
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'populated'"
          :class="[
            'rounded-lg px-3 py-2 transition',
            mode === 'populated' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ]"
          @click="changeMode('populated')"
        >
          有数据演示
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'empty'"
          :class="[
            'rounded-lg px-3 py-2 transition',
            mode === 'empty' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ]"
          @click="changeMode('empty')"
        >
          无数据演示
        </button>
      </div>
    </div>

    <p
      v-if="isDemo"
      role="status"
      class="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700"
    >
      当前为{{ mode === 'populated' ? '有数据' : '无数据' }}演示，示例仅用于预览，不计入真实邀请及积分。{{
        eligible ? '切换「真实数据」可复制你的专属邀请链接。' : '请使用个人账号参与推广。'
      }}
    </p>

    <div
      class="grid overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-blue-50/70 to-white lg:grid-cols-[1.1fr_1fr]"
    >
      <div class="p-5 sm:p-7 lg:p-8">
        <div
          class="mb-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-sky-600"
        >
          <Gift class="h-4 w-4" />
          好友得助力，你得好礼
        </div>
        <h2 class="text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
          分享好工具
          <br />
          赚取
          <span class="text-sky-500">10%</span>
          套餐积分奖励
        </h2>
        <p class="mt-3 max-w-md text-sm leading-6 text-slate-500">
          好友通过你的邀请注册并首次购买套餐，奖励积分自动到账，可用于平台创作。
        </p>
        <div class="mt-5 flex items-center gap-2 text-xs text-sky-700">
          <Check class="h-4 w-4 shrink-0" />
          每位好友首购奖励一次，邀请人数不设上限
        </div>
      </div>
      <div
        class="m-4 mt-0 min-w-0 rounded-xl border border-white bg-white/80 p-4 sm:m-6 sm:p-5 lg:ml-0 lg:mt-6"
      >
        <h3 class="text-sm font-semibold text-slate-800">{{ isDemo ? '邀请方式预览' : '我的专属邀请' }}</h3>
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
        >
          <div class="min-w-0">
            <p class="text-xs text-slate-400">注册邀请码{{ isDemo ? '（示例）' : '' }}</p>
            <p
              aria-label="注册邀请码"
              class="mt-1 select-all break-all font-mono text-lg font-semibold tracking-wide text-slate-800"
            >
              {{ displayedCode || '暂不可用' }}
            </p>
          </div>
          <button
            type="button"
            aria-label="复制注册邀请码"
            :disabled="isDemo || !code"
            class="rounded-lg p-2 text-sky-600 hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300"
            @click="copy(code, '注册邀请码')"
          >
            <Copy class="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          :disabled="isDemo || !link"
          class="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-3 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          @click="copy(link, '注册邀请链接')"
        >
          <Link class="h-4 w-4 shrink-0" />
          {{ isDemo ? '演示状态不可邀请' : '注册邀请链接' }}
        </button>
        <p
          v-if="link"
          aria-label="注册邀请链接"
          class="mt-3 select-all break-all text-xs leading-5 text-slate-400"
        >
          {{ link }}
        </p>
        <p v-else class="mt-3 text-xs leading-5 text-slate-400">
          好友注册时通过邀请链接或填写邀请码完成绑定。
        </p>
      </div>
    </div>
    <div
      v-if="error"
      role="alert"
      class="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600"
    >
      {{ error }}
      <button type="button" class="underline" @click="refresh">重新加载</button>
    </div>

    <div aria-label="推广数据概览" class="grid gap-4 md:grid-cols-3">
      <div
        v-for="stat in [
          { label: '已邀请好友', value: rows.length, unit: '人', icon: Users },
          { label: '已完成首购', value: paidRows.length, unit: '人', icon: UserPlus },
          { label: '累计奖励积分', value: total, unit: '积分', icon: Coins },
        ]"
        :key="stat.label"
        :aria-label="stat.label"
        class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 p-5"
      >
        <div>
          <p class="text-xs text-slate-500">{{ stat.label }}</p>
          <p class="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
            {{ stat.value.toLocaleString() }}
            <span class="ml-2 text-xs font-normal text-slate-400">{{ stat.unit }}</span>
          </p>
        </div>
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
          <component :is="stat.icon" class="h-5 w-5" />
        </span>
      </div>
    </div>

    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="推广记录" class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80">
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6"
        >
          <div role="group" aria-label="记录类型" class="flex flex-wrap gap-4 text-sm">
            <button
              type="button"
              :aria-pressed="tab === 'invitations'"
              :class="tab === 'invitations' ? 'font-semibold text-sky-600' : 'text-slate-400'"
              @click="tab = 'invitations'"
            >
              邀请记录
              <span class="ml-1 text-xs">{{ rows.length }}</span>
            </button>
            <button
              type="button"
              :aria-pressed="tab === 'rewards'"
              :class="tab === 'rewards' ? 'font-semibold text-sky-600' : 'text-slate-400'"
              @click="tab = 'rewards'"
            >
              奖励明细
              <span class="ml-1 text-xs">{{ paidRows.length }}</span>
            </button>
          </div>
          <span class="text-xs text-slate-400">{{ isDemo ? '示例数据' : '实时记录' }}</span>
        </div>
        <div
          v-if="!visibleRows.length"
          class="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center"
        >
          <span class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-400">
            <Megaphone class="h-8 w-8" />
          </span>
          <h3 class="text-sm font-semibold text-slate-700">
            {{ tab === 'invitations' ? '还没有邀请记录' : '还没有奖励记录' }}
          </h3>
          <p class="mt-2 max-w-xs text-xs leading-6 text-slate-400">
            {{
              tab === 'invitations'
                ? '分享你的专属邀请链接，邀请第一位好友一起开始创作吧。'
                : '好友首次购买套餐后，奖励积分和到账记录将显示在这里。'
            }}
          </p>
          <button
            v-if="!isDemo && link"
            type="button"
            class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-600"
            @click="copy(link, '注册邀请链接')"
          >
            立即邀请好友
            <ArrowUpRight class="h-4 w-4" />
          </button>
        </div>
        <template v-else>
          <div
            class="hidden grid-cols-[minmax(0,1fr)_110px_100px_100px] gap-3 bg-slate-50 px-6 py-3 text-xs text-slate-400 lg:grid"
          >
            <span>受邀好友</span>
            <span>{{ tab === 'rewards' ? '奖励时间' : '注册时间' }}</span>
            <span>状态</span>
            <span class="text-right">奖励积分</span>
          </div>
          <ul aria-label="邀请与奖励记录" class="divide-y divide-slate-100">
            <li
              v-for="row in visibleRows"
              :key="row.id"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_110px_100px_100px]"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-600 sm:flex"
                >
                  {{ row.name.slice(0, 1) }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm text-slate-700">{{ row.name }}</p>
                  <p class="mt-1 text-[11px] text-slate-400 lg:hidden">
                    {{ date(tab === 'rewards' ? row.rewardedAt! : row.registeredAt) }} ·
                    {{ row.credits === null ? '已注册，待首购' : '首购已完成' }}
                  </p>
                </div>
              </div>
              <span class="hidden text-xs text-slate-400 lg:block">
                {{ date(tab === 'rewards' ? row.rewardedAt! : row.registeredAt) }}
              </span>
              <span
                :class="[
                  'hidden w-fit rounded-md px-2 py-1 text-[11px] lg:block',
                  row.credits === null ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600',
                ]"
              >
                {{ row.credits === null ? '待首购' : '已到账' }}
              </span>
              <span
                :class="[
                  'text-right text-sm font-medium tabular-nums',
                  row.credits === null ? 'text-slate-300' : 'text-sky-600',
                ]"
              >
                {{ row.credits === null ? '—' : `+${row.credits.toLocaleString()}积分` }}
              </span>
            </li>
          </ul>
        </template>
      </section>

      <aside aria-label="推广规则" class="space-y-5 rounded-2xl border border-slate-200/80 p-5 sm:p-6">
        <h2 class="text-sm font-semibold text-slate-800">三步获得奖励</h2>
        <ol class="space-y-5">
          <li
            v-for="(step, index) in [
              { title: '分享邀请', text: '将专属链接或邀请码分享给好友' },
              { title: '好友注册并首购', text: '完成绑定后首次成功购买套餐' },
              { title: '积分自动到账', text: '获得好友套餐积分的10%奖励' },
            ]"
            :key="step.title"
            class="flex gap-3"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-600"
            >
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm text-slate-700">{{ step.title }}</p>
              <p class="mt-1 text-xs leading-5 text-slate-400">{{ step.text }}</p>
            </div>
          </li>
        </ol>
        <div class="space-y-2 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500">
          <h3 class="font-medium text-slate-700">活动规则</h3>
          <p>1. 好友须在注册时绑定邀请关系，注册后不可补绑、修改或邀请自己。</p>
          <p>2. 仅首次成功购买套餐返奖，积分向下取整。例如961积分套餐，奖励96积分。</p>
          <p>3. 续费、再次购买、单独充值积分及购买账号不参与返奖。</p>
          <p>4. 个人账号可参与，演示账号和团队子账号仅可预览。</p>
        </div>
      </aside>
    </div>
  </section>
</template>
