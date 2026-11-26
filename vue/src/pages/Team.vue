<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { BarChart3, Copy, Search, UserPlus, UsersRound, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';
import { Button, Card } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { creditUsageEvents, seedDemoTeamUsage, teamWalletBalance, teamCreditsConsumed, ownerCreditsConsumed } from '@/services/credits';
import { studio } from '@/services/studio';
import { currentUser, workspaceOwnerProfile } from '@/services/identity';
import { uid } from '@/services/storage';
import DataChart from '@/components/DataChart.vue';
import {
  availableTeamCredits,
  commitDemoMemberCreditSpend,
  createMembers,
  isTeamAdmin,
  memberCreditsConsumed,
  recoverMember,
  archivedMembers,
  teamMembers,
  updateMember,
  type MemberInput,
  type TeamMember,
  type TeamRole,
  type RecoveryAllocation,
} from '@/services/team';

type Draft = MemberInput;
const blank = (): Draft => ({ name: '', identity: '', password: '', role: 'creator', projectIds: [], accountIds: [], credits: 0 });
const createDraft = ref<Draft>(blank());
const createProjectIds = ref<string[]>([]);
const createAccountIds = ref<string[]>([]);
const editing = ref<TeamMember | null>(null);
const createOpen = ref(false);
const inviteOpen = ref(false);
const editDraft = ref<Draft>(blank());
const busy = ref(false);
const error = ref('');
const inviteText = ref('');
const memberSearch = ref('');
const usageOpen = ref(false);
const usageRange = ref<'all' | '30' | '7'>('all');
type UsageMember = { id: string; name: string; consumed: number | null };
const usageDetailMember = ref<UsageMember | null>(null);
const recovering = ref<TeamMember | null>(null);
const recoveryDraft = ref<RecoveryAllocation>({ projectRecipients: {}, accountRecipients: {}, creditTransfers: [] });
const recoveryError = ref('');
const recipients = computed(() => teamMembers.value.filter(member => member.id !== recovering.value?.id));
const recoveryCredits = computed(() => recoveryDraft.value.creditTransfers.reduce((sum, item) => sum + Number(item.credits), 0));
const ownerRecoveryCredits = computed(() => (recovering.value?.credits ?? 0) - recoveryCredits.value);
const recoveryInvalid = computed(() => ownerRecoveryCredits.value < 0 || recoveryDraft.value.creditTransfers.some(item => !Number.isSafeInteger(item.credits) || item.credits < 0));
const ownerName = computed(() => workspaceOwnerProfile.value?.name ?? '所有者');
const normalizedMemberSearch = computed(() => memberSearch.value.trim().toLocaleLowerCase());
const filteredTeamMembers = computed(() => {
  const query = normalizedMemberSearch.value;
  if (!query) return teamMembers.value;
  return teamMembers.value.filter(member => `${member.name}\n${member.identity}`.toLocaleLowerCase().includes(query));
});
const showOwnerRow = computed(() => {
  const query = normalizedMemberSearch.value;
  return !query || `${ownerName.value}\n${workspaceOwnerProfile.value?.identity ?? ''}`.toLocaleLowerCase().includes(query);
});
const router = useRouter();
const usageEvents = computed(() => {
  const events = creditUsageEvents.value;
  if (usageRange.value === 'all') return events;
  const since = Date.now() - Number(usageRange.value) * 86400000;
  return events.filter(event => Date.parse(event.occurredAt) >= since);
});
const selectedRangeUsage = computed(() => usageEvents.value.reduce((sum, event) => sum + event.credits, 0));
const historicalUsage = computed(() => Math.max(0, teamCreditsConsumed.value - creditUsageEvents.value.reduce((sum, event) => sum + event.credits, 0)));
const usageByDay = computed(() => {
  const values = new Map<string, number>();
  for (const event of usageEvents.value) {
    const day = event.occurredAt.slice(0, 10);
    values.set(day, (values.get(day) ?? 0) + event.credits);
  }
  return [...values.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, credits]) => ({ day: day.slice(5), credits }));
});
const usageByModel = computed(() => {
  const values = new Map<string, number>();
  for (const event of usageEvents.value) values.set(event.model, (values.get(event.model) ?? 0) + event.credits);
  return [...values.entries()].sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
});
const usageByMember = computed(() => {
  const rows = [
    { id: 'owner', name: ownerName.value, consumed: ownerCreditsConsumed.value },
    ...teamMembers.value.map(member => ({ id: member.id, name: member.name, consumed: memberCreditsConsumed(member) })),
    ...archivedMembers.value.map(member => ({ id: member.id, name: `${member.name}（已回收）`, consumed: member.recovery?.consumed ?? null })),
  ];
  return rows.map(row => ({ ...row, known: usageEvents.value.filter(event => event.memberId === row.id || (row.id === 'owner' && event.memberId === null)).reduce((sum, event) => sum + event.credits, 0) }));
});
const memberUsageEvents = computed(() => {
  const member = usageDetailMember.value;
  if (!member) return [];
  return usageEvents.value.filter(event => member.id === 'owner' ? event.memberId === null : event.memberId === member.id);
});
const memberRangeUsage = computed(() => memberUsageEvents.value.reduce((sum, event) => sum + event.credits, 0));
const memberUsageByDay = computed(() => {
  const values = new Map<string, number>();
  for (const event of memberUsageEvents.value) {
    const day = event.occurredAt.slice(0, 10);
    values.set(day, (values.get(day) ?? 0) + event.credits);
  }
  return [...values.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, credits]) => ({ day: day.slice(5), credits }));
});
const memberUsageByModel = computed(() => {
  const values = new Map<string, number>();
  for (const event of memberUsageEvents.value) values.set(event.model, (values.get(event.model) ?? 0) + event.credits);
  return [...values.entries()].sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
});
const usageChartData = computed(() => usageByDay.value.length ? usageByDay.value : [{ day: '暂无', credits: 0 }]);
const usageModelData = computed(() => usageByModel.value.length ? usageByModel.value : [{ name: '暂无明细', value: 0 }]);
const memberUsageChartData = computed(() => memberUsageByDay.value.length ? memberUsageByDay.value : [{ day: '暂无', credits: 0 }]);
const memberUsageModelData = computed(() => memberUsageByModel.value.length ? memberUsageByModel.value : [{ name: '暂无明细', value: 0 }]);
function openUsage() {
  usageDetailMember.value = null;
  usageOpen.value = true;
}
function openMemberUsage(member: UsageMember) {
  usageDetailMember.value = member;
  usageOpen.value = true;
}
function closeMemberUsage() { usageDetailMember.value = null; }
function closeUsage() { usageOpen.value = false; usageDetailMember.value = null; }
function openSeatPurchase() { void router.push({ path: '/purchase', query: { edition: 'team' } }); }
function openTeamCreditPurchase() { void router.push({ path: '/purchase', query: { edition: 'team', tab: 'credits' } }); }
function formatDate(value: string) { return new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const activeProjects = computed(() => studio.value.projects.filter(project => !project.archived));
const activeAccounts = computed(() => studio.value.accounts.filter(account => !account.deleted && account.status !== '已解绑'));
const availableCredits = computed(() => availableTeamCredits(teamWalletBalance.value));
const createCreditsInvalid = computed(() => {
  const credits = createDraft.value.credits;
  return typeof credits !== 'number' || !Number.isSafeInteger(credits) || credits < 0 || credits > availableCredits.value;
});
const invitePreview = computed(() => inviteText.value || '创建成员后，这里会生成可复制的邀请文案。');
const generatedLogin = () => `team-${uid().replaceAll('-', '').slice(0, 12)}`;
const generatedPassword = () => `Init-${uid().replaceAll('-', '').slice(0, 10)}`;

async function seedDemoTeamScenario() {
  if (currentUser.value?.id !== 'demo' || activeProjects.value.length < 2 || activeAccounts.value.length < 2 || teamWalletBalance.value < 40) return;
  const projects = activeProjects.value;
  const accounts = activeAccounts.value;
  const samples = [
    { name: '内容策划', identity: 'demo-planner', projectIds: [projects[0]!.id], accountIds: [accounts[0]!.id], consumed: 3 },
    { name: '视频创作', identity: 'demo-video', projectIds: [projects[0]!.id, projects[1]!.id], accountIds: [accounts[0]!.id, accounts[1]!.id], consumed: 5 },
    { name: '账号运营', identity: 'demo-operator', projectIds: [projects[1]!.id], accountIds: [accounts[1]!.id], consumed: 2 },
    { name: '数据分析', identity: 'demo-analyst', projectIds: [projects[0]!.id, projects[1]!.id], accountIds: [accounts[0]!.id], consumed: 4 },
  ];
  const activeMembers = teamMembers.value;
  if (activeMembers.length !== samples.length || activeMembers.some(member => member.credits !== 0 || member.creditLimit !== 0 || member.projectIds.length || member.accountIds.length)) return;
  for (const [index, member] of activeMembers.entries()) {
    const sample = samples[index]!;
    await updateMember(member.id, { projectIds: sample.projectIds, accountIds: sample.accountIds, credits: 10 }, teamWalletBalance.value);
    commitDemoMemberCreditSpend(member.id, sample.consumed);
  }
  seedDemoTeamUsage([
    { memberId: null, memberName: ownerName.value, credits: 5, model: 'Seed Lite', taskType: '视频生成', title: '所有者 · 品牌月度内容规划（演示）' },
    ...samples.map((sample, index) => ({
      memberId: activeMembers[index]!.id, memberName: activeMembers[index]!.name, credits: sample.consumed,
      model: index % 2 ? 'Wan 3.0' : 'Seed Lite', taskType: index === 2 ? '视频拆解' : '视频生成',
      title: `${sample.name} · ${['晨间护肤短片', '产品卖点解析', '账号内容复盘', '品牌故事脚本'][index]}（演示）`,
    })),
  ]);
}

onMounted(() => { void seedDemoTeamScenario().catch(error => toast.error((error as Error).message)); });

function accountLabel(id: string) {
  const account = activeAccounts.value.find(item => item.id === id);
  return account ? `${account.name} · ${account.handle}` : id;
}
function projectLabel(id: string) { return activeProjects.value.find(item => item.id === id)?.name ?? id; }
function invitation(member: { name: string; identity: string; password: string; role: TeamRole }) {
  return `你已被邀请加入「${ownerName.value}」内容工作区\n账号名：${member.identity}\n初始密码：${member.password}\n登录方式：密码登录\n角色：${member.role === 'admin' ? '管理员' : '创作者'}\n入口：${window.location.origin}${window.location.pathname}#/auth?mode=password`;
}
async function copy(text: string) {
  inviteText.value = text;
  try { await navigator.clipboard.writeText(text); toast.success('邀请文案已复制'); }
  catch { toast.info('邀请文案已生成，请手动复制'); }
}
function openCreate() {
  createDraft.value = { ...blank(), identity: generatedLogin(), password: generatedPassword() };
  createProjectIds.value = [];
  createAccountIds.value = [];
  error.value = '';
  createOpen.value = true;
}
function closeCreate() {
  if (busy.value) return;
  createOpen.value = false;
}
async function create() {
  if (busy.value) return;
  if (createCreditsInvalid.value) {
    error.value = `初始积分不能超过当前可分配积分（${availableCredits.value.toLocaleString()}）`;
    return;
  }
  busy.value = true; error.value = '';
  try {
    const draft = { ...createDraft.value, projectIds: [...createProjectIds.value], accountIds: [...createAccountIds.value] };
    const created = await createMembers([draft], teamWalletBalance.value);
    await copy(invitation({ ...draft, name: created[0]!.name, identity: created[0]!.identity }));
    toast.success('成员账号已创建');
    createOpen.value = false;
    inviteOpen.value = true;
  } catch (e) { error.value = (e as Error).message; toast.error(error.value); }
  finally { busy.value = false; }
}
function openEdit(member: TeamMember) {
  if (editing.value) return;
  editing.value = member;
  editDraft.value = { name: member.name, identity: member.identity, password: '', role: member.role, projectIds: [...member.projectIds], accountIds: [...member.accountIds], credits: member.credits };
  error.value = '';
}
function closeEdit() {
  if (busy.value) return;
  editing.value = null;
  editDraft.value = blank();
  error.value = '';
}
async function saveEdit() {
  if (!editing.value || busy.value) return;
  busy.value = true;
  try {
    await updateMember(editing.value.id, editDraft.value, teamWalletBalance.value);
    toast.success('成员信息已更新'); editing.value = null;
    editDraft.value = blank();
  } catch (e) { error.value = (e as Error).message; toast.error(error.value); }
  finally { busy.value = false; }
}
function openRecovery(member: TeamMember) {
  recovering.value = member;
  recoveryDraft.value = {
    projectRecipients: Object.fromEntries(member.projectIds.map(id => [id, null])),
    accountRecipients: Object.fromEntries(member.accountIds.map(id => [id, null])),
    creditTransfers: teamMembers.value.filter(item => item.id !== member.id).map(item => ({ memberId: item.id, credits: 0 })),
  };
  recoveryError.value = '';
}
function confirmRecovery() {
  if (!recovering.value) return;
  try {
    recoverMember(recovering.value.id, recoveryDraft.value);
    toast.success(`已回收 ${recovering.value.name} 的成员账号`);
    recovering.value = null;
  } catch (e) { recoveryError.value = (e as Error).message; }
}
function recipientLabel(id: string | null) {
  return id === null ? `所有者（${ownerName.value}）` : teamMembers.value.find(member => member.id === id)?.name ?? archivedMembers.value.find(member => member.id === id)?.name ?? id;
}
function recoverySummary(member: TeamMember) {
  if (!member.recovery) return '历史分配记录缺失';
  const { allocation, credits } = member.recovery;
  const resources = [
    ...Object.entries(allocation.projectRecipients).map(([id, target]) => `${projectLabel(id)} → ${recipientLabel(target)}`),
    ...Object.entries(allocation.accountRecipients).map(([id, target]) => `${accountLabel(id)} → ${recipientLabel(target)}`),
  ];
  const transfers = allocation.creditTransfers.filter(item => item.credits > 0);
  return [...resources, ...transfers.map(item => `${item.credits} 积分 → ${recipientLabel(item.memberId)}`), `${credits - transfers.reduce((sum, item) => sum + item.credits, 0)} 积分 → 所有者`].join('；');
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="团队协作" desc="邀请成员共同创作、发布并分配项目资源" />

    <template v-if="isTeamAdmin">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card class="relative border-slate-100 p-5"><div class="text-xs text-slate-400">团队成员</div><div class="mt-2 text-2xl font-semibold text-slate-800">{{ teamMembers.length + 1 }}</div><div class="mt-1 text-xs text-slate-400">所有者及当前有效成员</div><button aria-label="购买席位" class="absolute right-4 top-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 transition hover:border-sky-300 hover:bg-sky-100" @click="openSeatPurchase">购买席位</button></Card>
        <Card class="relative border-slate-100 p-5"><div class="text-xs text-slate-400">团队剩余积分</div><div class="mt-2 text-2xl font-semibold text-slate-800">{{ teamWalletBalance.toLocaleString() }}</div><div class="mt-1 text-xs text-slate-400">团队共享积分余额</div><button aria-label="团队积分充值" class="absolute right-4 top-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 transition hover:border-sky-300 hover:bg-sky-100" @click="openTeamCreditPurchase">积分充值</button></Card>
        <Card class="border-slate-100 p-5"><div class="text-xs text-slate-400">可分配积分</div><div class="mt-2 text-2xl font-semibold text-sky-600">{{ availableCredits.toLocaleString() }}</div><div class="mt-1 text-xs text-slate-400">已分配额度会暂时锁定</div></Card>
        <button data-testid="team-usage-trigger" class="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl" aria-label="查看团队累计消耗详情" @click="openUsage"><Card class="h-full border-slate-100 p-5 transition hover:border-sky-200 hover:shadow-md"><div class="flex items-center justify-between text-xs text-slate-400"><span>团队累计消耗</span><BarChart3 class="h-4 w-4 text-sky-600" /></div><div class="mt-2 text-2xl font-semibold text-slate-800">{{ teamCreditsConsumed.toLocaleString() }}</div><div class="mt-1 text-xs text-slate-400">点击查看整体消耗仪表盘</div></Card></button>
      </div>

      <Card class="border-slate-100 p-6">
          <h2 class="mb-4 text-[15px] font-semibold text-slate-800">团队成员（{{ teamMembers.length + 1 }}）</h2>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <label class="relative min-w-56 flex-1 sm:max-w-sm">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input v-model="memberSearch" data-testid="team-member-search" aria-label="搜索团队成员" type="search" placeholder="搜索成员名称或账号名" class="studio-field w-full pl-9" />
            </label>
            <Button size="sm" class="gap-1.5 brand-gradient text-white" :disabled="!!editing" @click="openCreate"><UserPlus class="h-3.5 w-3.5" />邀请成员</Button>
          </div>
          <div class="overflow-x-auto rounded-xl border border-slate-100">
            <table class="w-full min-w-[960px] text-left text-xs">
              <thead class="bg-slate-50 text-slate-400"><tr><th class="px-4 py-3 font-medium">成员</th><th class="px-4 py-3 font-medium">账号名</th><th class="px-4 py-3 font-medium">角色</th><th class="px-4 py-3 font-medium">分配项目</th><th class="px-4 py-3 font-medium">平台账号</th><th class="px-4 py-3 font-medium">剩余 / 累计分配积分</th><th class="px-4 py-3 font-medium">累计消耗</th><th class="px-4 py-3 text-right font-medium">操作</th></tr></thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="showOwnerRow" data-testid="owner-row" class="bg-sky-50/40 text-slate-600">
                  <td class="px-4 py-4 font-medium text-slate-800">{{ ownerName }}</td>
                  <td class="px-4 py-4 font-mono text-[11px]">{{ workspaceOwnerProfile?.identity ?? '—' }}</td>
                  <td class="px-4 py-4"><span class="rounded-full bg-amber-50 px-2 py-1 text-amber-700">所有者</span></td>
                  <td class="px-4 py-4">全部项目</td><td class="px-4 py-4">全部平台账号</td>
                  <td class="px-4 py-4">{{ availableCredits.toLocaleString() }} <span class="text-slate-400">可分配</span></td>
                  <td class="px-4 py-4">{{ ownerCreditsConsumed?.toLocaleString() ?? '—' }}</td>
                  <td class="px-4 py-4 text-right text-slate-400">不可操作</td>
                </tr>
                <tr v-for="member in filteredTeamMembers" :key="member.id" :data-member-id="member.id" class="text-slate-600 hover:bg-slate-50/70">
                  <td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-xs font-semibold text-white">{{ member.name.slice(0, 2) }}</div><div><div class="font-medium text-slate-800">{{ member.name }}</div><div class="mt-1 text-[11px] text-slate-400">有效成员</div></div></div></td>
                  <td class="px-4 py-4 font-mono text-[11px] text-slate-500">{{ member.identity }}</td>
                  <td class="px-4 py-4"><span class="rounded-full bg-sky-50 px-2 py-1 text-[11px] text-sky-600">{{ member.role === 'admin' ? '管理员' : '创作者' }}</span></td>
                  <td class="max-w-48 px-4 py-4"><span :class="!member.projectIds.length ? 'text-slate-400' : 'text-slate-600'">{{ member.projectIds.length ? member.projectIds.map(projectLabel).join('、') : '关联项目' }}</span></td>
                  <td class="max-w-56 px-4 py-4"><span :class="!member.accountIds.length ? 'text-slate-400' : 'text-slate-600'">{{ member.accountIds.length ? member.accountIds.map(accountLabel).join('、') : '关联成员' }}</span></td>
                  <td class="whitespace-nowrap px-4 py-4">{{ member.credits.toLocaleString() }} <span class="text-slate-400">/ {{ member.creditLimit.toLocaleString() }}</span></td>
                  <td class="whitespace-nowrap px-4 py-4 font-medium"><button :aria-label="`查看 ${member.name} 的消耗详情`" class="rounded px-1 py-1 text-slate-700 transition hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" @click="openMemberUsage({ id: member.id, name: member.name, consumed: memberCreditsConsumed(member) })">{{ memberCreditsConsumed(member).toLocaleString() }}</button></td>
                  <td class="whitespace-nowrap px-4 py-4 text-right">
                    <button class="mr-2 rounded-lg px-2 py-1.5 text-sky-600 disabled:opacity-40" :disabled="!!editing" :aria-label="`编辑 ${member.name}`" @click="openEdit(member)">编辑</button><button class="rounded-lg px-2 py-1.5 text-rose-500 disabled:opacity-40" :disabled="!!editing || member.id === currentUser?.teamMemberId" :aria-label="`回收 ${member.name}`" @click="openRecovery(member)">账号回收</button>
                  </td>
                </tr>
                <tr v-if="!showOwnerRow && !filteredTeamMembers.length" data-testid="team-member-search-empty">
                  <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">没有找到匹配的成员</td>
                </tr>
              </tbody>
            </table>
          </div>
          <details v-if="archivedMembers.length" class="mt-6 text-xs text-slate-600">
            <summary class="cursor-pointer font-medium">已回收成员（{{ archivedMembers.length }}）</summary>
            <div class="mt-3 overflow-x-auto rounded-xl border border-slate-100"><table data-testid="archived-members" class="w-full min-w-[700px] text-left"><thead class="bg-slate-50"><tr><th class="p-3">成员 / 账号名</th><th class="p-3">回收时间</th><th class="p-3">回收时剩余积分</th><th class="p-3">累计消耗</th><th class="p-3">资源分配记录</th></tr></thead><tbody><tr v-for="member in archivedMembers" :key="member.id" class="border-t border-slate-100"><td class="p-3">{{ member.name }}<div class="mt-1 text-slate-400">{{ member.identity }}</div></td><td class="whitespace-nowrap p-3">{{ member.recovery ? new Date(member.recovery.recoveredAt).toLocaleString('zh-CN') : '—' }}</td><td class="p-3">{{ member.recovery?.credits.toLocaleString() ?? '—' }}</td><td class="p-3"><button :aria-label="`查看已回收成员 ${member.name} 的消耗详情`" class="rounded px-1 py-1 text-slate-700 hover:bg-sky-50 hover:text-sky-700" @click="openMemberUsage({ id: member.id, name: `${member.name}（已回收）`, consumed: member.recovery?.consumed ?? null })">{{ member.recovery?.consumed.toLocaleString() ?? '—' }}</button></td><td class="max-w-96 p-3 leading-6">{{ recoverySummary(member) }}</td></tr></tbody></table></div>
          </details>
      </Card>
    </template>

    <Card v-else class="border-slate-100 p-8"><div class="flex items-center gap-3 text-slate-700"><UsersRound class="h-5 w-5 text-sky-600" /><div><h2 class="font-semibold">你是团队成员</h2><p class="mt-1 text-sm text-slate-500">当前账号可访问管理员分配的项目与账号，剩余积分 {{ (teamMembers.find(member => member.id === currentUser?.teamMemberId)?.credits ?? 0).toLocaleString() }}。</p></div></div></Card>

    <div v-if="usageOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-3 sm:p-6" @click.self="closeUsage" @keydown.esc="closeUsage">
      <Card data-testid="team-usage-dialog" role="dialog" aria-modal="true" aria-labelledby="team-usage-title" class="max-h-[94vh] w-full max-w-6xl overflow-y-auto border-slate-200 bg-slate-50 p-0 shadow-2xl">
        <div class="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7"><div><h2 id="team-usage-title" class="text-lg font-semibold text-slate-900">{{ usageDetailMember ? `${usageDetailMember.name} · 消耗详情` : '团队积分消耗' }}</h2><p class="mt-1 text-xs text-slate-500">{{ usageDetailMember ? '成员积分消耗及对应任务明细' : '团队所有者、有效成员及已回收成员的整体用量' }}</p></div><button aria-label="关闭团队消耗仪表盘" class="rounded-md p-2 text-slate-500 hover:bg-slate-100" @click="closeUsage"><X class="h-4 w-4" /></button></div>
        <div class="space-y-4 p-4 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div><h3 class="text-sm font-semibold text-slate-800">全局时间筛选</h3><p class="mt-1 text-xs text-slate-500">同步筛选趋势、模型、成员明细及消耗流水</p></div>
            <select v-model="usageRange" aria-label="积分统计时间" class="studio-field !w-auto !min-w-36 !py-2 text-xs"><option value="all">全部时间</option><option value="30">最近 30 天</option><option value="7">最近 7 天</option></select>
          </div>

          <div v-if="usageDetailMember" data-testid="member-usage-detail" class="space-y-4">
            <button class="text-sm font-medium text-sky-700 hover:text-sky-800" aria-label="返回团队消耗总览" @click="closeMemberUsage">← 返回团队消耗总览</button>
            <section class="grid gap-3 sm:grid-cols-3">
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">累计消耗</div><div class="mt-2 text-2xl font-semibold">{{ usageDetailMember.consumed?.toLocaleString() ?? '—' }} <span class="text-sm font-normal text-slate-500">积分</span></div></Card>
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">{{ usageRange === 'all' ? '已记录明细' : `${usageRange} 天内记录明细` }}</div><div class="mt-2 text-2xl font-semibold text-sky-700">{{ memberRangeUsage.toLocaleString() }} <span class="text-sm font-normal text-slate-500">积分</span></div></Card>
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">筛选范围内任务数</div><div class="mt-2 text-2xl font-semibold">{{ memberUsageEvents.length }} <span class="text-sm font-normal text-slate-500">条</span></div></Card>
            </section>
            <section class="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
              <Card class="border-slate-200 p-4 sm:p-5"><h3 class="text-sm font-semibold">成员消耗趋势</h3><p class="mt-1 text-xs text-slate-500">按全局时间筛选范围汇总</p><div v-if="memberUsageByDay.length" class="mt-3 h-64"><DataChart type="bar" :data="memberUsageChartData" :series="[{ name: 'credits', color: '#2563eb', type: 'bar' }]" /></div><div v-else class="mt-3 flex h-64 items-center justify-center text-sm text-slate-400">所选时间内暂无逐笔消耗记录</div></Card>
              <Card class="border-slate-200 p-4 sm:p-5"><h3 class="text-sm font-semibold">成员模型使用</h3><p class="mt-1 text-xs text-slate-500">按筛选范围内已记录明细统计</p><div v-if="memberUsageByModel.length" class="mt-3 h-52"><DataChart type="pie" :data="memberUsageModelData" :series="[]" :colors="['#2563eb', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']" /></div><div v-else class="mt-3 flex h-52 items-center justify-center text-sm text-slate-400">暂无模型明细</div><div class="space-y-2"><div v-for="model in memberUsageByModel" :key="model.name" class="flex items-center justify-between gap-3 text-xs"><span class="truncate text-slate-600">{{ model.name }}</span><span class="shrink-0 font-medium">{{ model.value.toLocaleString() }} 积分</span></div></div></Card>
            </section>
            <Card class="border-slate-200 p-4 sm:p-5"><div class="mb-4"><h3 class="text-sm font-semibold">{{ usageDetailMember.name }} · 消耗流水</h3><p class="mt-1 text-xs text-slate-500">{{ memberUsageEvents.length }} 条明细，按发生时间倒序</p></div><div v-if="memberUsageEvents.length" class="overflow-x-auto"><table class="w-full min-w-[680px] text-left text-xs"><thead class="border-y border-slate-200 text-slate-500"><tr><th class="px-3 py-2 font-medium">任务</th><th class="px-3 py-2 font-medium">类型 / 模型</th><th class="px-3 py-2 font-medium">消耗积分</th><th class="px-3 py-2 font-medium">发生时间</th></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="event in [...memberUsageEvents].reverse()" :key="event.id"><td class="max-w-md truncate px-3 py-3 font-medium text-slate-800">{{ event.title }}</td><td class="px-3 py-3"><span>{{ event.taskType }}</span><span class="block pt-1 text-slate-400">{{ event.model }}</span></td><td class="px-3 py-3 font-medium">{{ event.credits.toLocaleString() }}</td><td class="whitespace-nowrap px-3 py-3 text-slate-500">{{ formatDate(event.occurredAt) }}</td></tr></tbody></table></div><div v-else class="py-12 text-center text-sm text-slate-400">所选时间内暂无该成员的消耗记录</div></Card>
          </div>

          <template v-else>
            <section class="grid gap-3 sm:grid-cols-3">
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">团队累计消耗</div><div class="mt-2 text-2xl font-semibold">{{ teamCreditsConsumed.toLocaleString() }} <span class="text-sm font-normal text-slate-500">积分</span></div></Card>
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">{{ usageRange === 'all' ? '已记录明细' : `${usageRange} 天内记录明细` }}</div><div class="mt-2 text-2xl font-semibold text-sky-700">{{ selectedRangeUsage.toLocaleString() }} <span class="text-sm font-normal text-slate-500">积分</span></div></Card>
              <Card class="border-slate-200 p-4"><div class="text-xs text-slate-500">历史明细未记录</div><div class="mt-2 text-2xl font-semibold text-slate-700">{{ historicalUsage.toLocaleString() }} <span class="text-sm font-normal text-slate-500">积分</span></div></Card>
            </section>
            <section class="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
              <Card class="border-slate-200 p-4 sm:p-5"><h3 class="text-sm font-semibold">积分消耗趋势</h3><p class="mt-1 text-xs text-slate-500">按全局时间筛选范围内已记录消耗汇总</p><div v-if="usageByDay.length" class="mt-3 h-64"><DataChart type="bar" :data="usageChartData" :series="[{ name: 'credits', color: '#2563eb', type: 'bar' }]" /></div><div v-else class="mt-3 flex h-64 items-center justify-center text-sm text-slate-400">所选时间内暂无逐笔消耗记录</div></Card>
              <Card class="border-slate-200 p-4 sm:p-5"><h3 class="text-sm font-semibold">模型使用比例</h3><p class="mt-1 text-xs text-slate-500">按筛选范围内已记录明细统计</p><div v-if="usageByModel.length" class="mt-3 h-64"><DataChart type="pie" :data="usageModelData" :series="[]" :colors="['#2563eb', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']" /></div><div v-else class="mt-3 flex h-64 items-center justify-center text-sm text-slate-400">暂无模型明细</div><div class="space-y-2"> <div v-for="model in usageByModel" :key="model.name" class="flex items-center justify-between gap-3 text-xs"><span class="truncate text-slate-600">{{ model.name }}</span><span class="shrink-0 font-medium">{{ model.value.toLocaleString() }} 积分</span></div></div></Card>
            </section>
            <Card class="border-slate-200 p-4 sm:p-5"><div class="mb-4"><h3 class="text-sm font-semibold">成员消耗</h3><p class="mt-1 text-xs text-slate-500">点击成员名称查看详情；已回收成员保留历史消耗。</p></div><div class="overflow-x-auto"><table class="w-full min-w-[480px] text-left text-xs"><thead class="border-b border-slate-200 text-slate-500"><tr><th class="px-3 py-2 font-medium">成员</th><th class="px-3 py-2 font-medium">累计消耗</th><th class="px-3 py-2 font-medium">当前筛选明细</th></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="row in usageByMember" :key="row.id"><td class="px-3 py-3"><button :aria-label="`查看成员 ${row.name} 的消耗详情`" class="rounded px-1 py-1 text-left text-sky-700 hover:bg-sky-50 hover:text-sky-800" @click="openMemberUsage(row)">{{ row.name }}</button></td><td class="px-3 py-3">{{ row.consumed?.toLocaleString() ?? '—' }} 积分</td><td class="px-3 py-3">{{ row.known.toLocaleString() }} 积分</td></tr></tbody></table></div></Card>
            <Card class="border-slate-200 p-4 sm:p-5"><div class="mb-4"><h3 class="text-sm font-semibold">积分消耗记录</h3><p class="mt-1 text-xs text-slate-500">{{ usageEvents.length }} 条明细，按发生时间倒序</p></div><div v-if="usageEvents.length" class="overflow-x-auto"><table class="w-full min-w-[760px] text-left text-xs"><thead class="border-y border-slate-200 text-slate-500"><tr><th class="px-3 py-2 font-medium">任务</th><th class="px-3 py-2 font-medium">成员</th><th class="px-3 py-2 font-medium">类型 / 模型</th><th class="px-3 py-2 font-medium">消耗积分</th><th class="px-3 py-2 font-medium">发生时间</th></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="event in [...usageEvents].reverse()" :key="event.id"><td class="max-w-md truncate px-3 py-3 font-medium text-slate-800">{{ event.title }}</td><td class="px-3 py-3">{{ event.memberName }}</td><td class="px-3 py-3"><span>{{ event.taskType }}</span><span class="block pt-1 text-slate-400">{{ event.model }}</span></td><td class="px-3 py-3 font-medium">{{ event.credits.toLocaleString() }}</td><td class="whitespace-nowrap px-3 py-3 text-slate-500">{{ formatDate(event.occurredAt) }}</td></tr></tbody></table></div><div v-else class="py-12 text-center text-sm text-slate-400">所选时间内暂无消耗记录</div></Card>
          </template>
        </div>
      </Card>
    </div>

    <div v-if="createOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" @click.self="closeCreate">
      <Card class="max-h-[90vh] w-full max-w-lg overflow-hidden border-slate-200 bg-white p-0 shadow-xl">
        <div class="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 data-testid="create-member-title" class="text-base font-semibold text-slate-800">创建成员</h2><p class="mt-1 text-xs leading-5 text-slate-400">创作者只能访问已分配的项目和平台账号，管理员可以管理全部账号和项目。</p></div>
          <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" aria-label="关闭创建成员面板" @click="closeCreate"><X class="h-4 w-4" /></button>
        </div>
        <div class="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
          <div class="space-y-4">
            <label class="block"><span class="studio-label">成员名称</span><input v-model="createDraft.name" class="studio-field" placeholder="请输入成员名称" autofocus /></label>
            <label class="block"><span class="studio-label">账号名</span><input v-model="createDraft.identity" class="studio-field bg-slate-50 text-slate-500" readonly /></label>
            <label class="block"><span class="studio-label">初始密码</span><input :value="createDraft.password" aria-label="系统生成的初始密码" class="studio-field bg-slate-50 font-mono text-slate-600" readonly /></label>
            <label class="block"><span class="studio-label">角色</span><select v-model="createDraft.role" class="studio-field"><option value="creator">创作者</option><option value="admin">管理员</option></select></label>
            <div>
              <span class="studio-label">分配项目</span>
              <div class="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <label v-for="project in activeProjects" :key="project.id" class="flex items-start gap-2"><input v-model="createProjectIds" type="checkbox" :value="project.id" :aria-label="`分配项目 ${project.name}`" />{{ project.name }}</label>
                <span v-if="!activeProjects.length" class="text-slate-400">暂无可分配项目</span>
              </div>
            </div>
            <div>
              <span class="studio-label">分配平台账号</span>
              <div class="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <label v-for="account in activeAccounts" :key="account.id" class="flex items-start gap-2"><input v-model="createAccountIds" type="checkbox" :value="account.id" :aria-label="`分配平台账号 ${account.name}`" />{{ account.name }} · {{ account.handle }}</label>
                <span v-if="!activeAccounts.length" class="text-slate-400">暂无可分配平台账号</span>
              </div>
            </div>
            <label class="block"><span class="studio-label">初始积分</span><input v-model.number="createDraft.credits" class="studio-field" type="number" min="0" :max="availableCredits" step="1" placeholder="0" /><span class="mt-1 block text-[11px] leading-5" :class="createCreditsInvalid ? 'text-rose-600' : 'text-slate-400'">当前可分配：{{ availableCredits.toLocaleString() }} 积分<span v-if="createCreditsInvalid">；请输入不超过可分配额度的非负整数</span></span></label>
          </div>
          <p v-if="error" role="alert" class="mt-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">{{ error }}</p>
          <div class="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" :disabled="busy" @click="closeCreate">取消</Button><Button class="brand-gradient text-white" :disabled="busy || createCreditsInvalid" @click="create">{{ busy ? '保存中…' : '保存' }}</Button></div>
        </div>
      </Card>
    </div>

    <div v-if="inviteOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" @click.self="inviteOpen = false">
      <Card data-testid="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title" class="w-full max-w-lg border-slate-200 bg-white p-0 shadow-xl">
        <div class="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 id="invite-dialog-title" class="text-base font-semibold text-slate-800">成员创建成功</h2><p class="mt-1 text-xs leading-5 text-slate-400">请将以下登录信息发送给成员，初始密码仅在此处展示。</p></div>
          <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" aria-label="关闭邀请信息" @click="inviteOpen = false"><X class="h-4 w-4" /></button>
        </div>
        <div class="px-6 py-5">
          <div aria-label="成员邀请信息" class="w-full whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">{{ invitePreview }}</div>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="outline" @click="inviteOpen = false">关闭</Button>
            <Button class="gap-1.5 brand-gradient text-white" @click="copy(inviteText)"><Copy class="h-3.5 w-3.5" />再次复制</Button>
          </div>
        </div>
      </Card>
    </div>

    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" @click.self="closeEdit" @keydown.esc="closeEdit">
      <Card data-testid="edit-member-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-member-title" class="max-h-[90vh] w-full max-w-xl overflow-y-auto border-slate-200 bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between"><h2 id="edit-member-title" class="text-base font-semibold text-slate-800">编辑成员</h2><button aria-label="关闭编辑成员" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" :disabled="busy" @click="closeEdit"><X class="h-4 w-4" /></button></div>
        <form class="mt-5 space-y-4" @submit.prevent="saveEdit">
          <fieldset :disabled="busy" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <label><span class="studio-label">成员名称</span><input v-model="editDraft.name" aria-label="成员名称" class="studio-field" maxlength="30" /></label>
              <label><span class="studio-label">账号名</span><input v-model="editDraft.identity" aria-label="账号名" class="studio-field" /></label>
              <label><span class="studio-label">角色</span><select v-model="editDraft.role" aria-label="成员角色" class="studio-field"><option value="creator">创作者</option><option value="admin">管理员</option></select></label>
              <label><span class="studio-label">剩余积分</span><input v-model.number="editDraft.credits" aria-label="剩余积分" type="number" min="0" step="1" class="studio-field" /></label>
            </div>
            <label class="block"><span class="studio-label">新密码</span><input v-model="editDraft.password" aria-label="新密码" type="password" autocomplete="new-password" placeholder="留空则保留原密码" class="studio-field" /></label>
            <div class="grid gap-4 sm:grid-cols-2">
              <div><span class="studio-label">分配项目</span><div class="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><label v-for="project in activeProjects" :key="project.id" class="flex items-start gap-2"><input v-model="editDraft.projectIds" type="checkbox" :value="project.id" :aria-label="`分配项目 ${project.name}`" />{{ project.name }}</label><span v-if="!activeProjects.length" class="text-slate-400">暂无可分配项目</span></div></div>
              <div><span class="studio-label">分配平台账号</span><div class="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><label v-for="account in activeAccounts" :key="account.id" class="flex items-start gap-2"><input v-model="editDraft.accountIds" type="checkbox" :value="account.id" :aria-label="`分配账号 ${account.name}`" />{{ account.name }} · {{ account.handle }}</label><span v-if="!activeAccounts.length" class="text-slate-400">暂无可分配账号</span></div></div>
            </div>
          </fieldset>
          <p class="text-xs text-slate-400">累计消耗 {{ memberCreditsConsumed(editing).toLocaleString() }} 积分，调整剩余额度不会改变历史消耗。</p>
          <p v-if="error" role="alert" class="rounded-lg bg-rose-50 p-3 text-xs text-rose-600">{{ error }}</p>
          <div class="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" :disabled="busy" @click="closeEdit">取消</Button><Button type="submit" class="brand-gradient text-white" :disabled="busy">{{ busy ? '保存中…' : '保存修改' }}</Button></div>
        </form>
      </Card>
    </div>

    <div v-if="recovering" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" @click.self="recovering = null">
      <Card data-testid="recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="recovery-title" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-slate-200 bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between"><h2 id="recovery-title" class="text-base font-semibold text-slate-800">账号回收 · {{ recovering.name }}</h2><button aria-label="关闭账号回收" class="p-1.5 text-slate-400" @click="recovering = null"><X class="h-4 w-4" /></button></div>
        <p class="mt-2 text-xs leading-6 text-slate-500">回收后该成员无法登录。项目与平台账号可逐项分配，默认交还所有者；作品、任务和历史消耗会保留。</p>
        <p v-if="!recipients.length" class="mt-4 rounded-lg bg-sky-50 p-3 text-xs text-sky-700">没有其他可接收成员，全部资源和剩余积分将交还所有者（{{ ownerName }}）。</p>
        <div class="mt-5 space-y-4">
          <div v-if="recovering.projectIds.length"><h3 class="mb-2 text-sm font-medium">项目接收方</h3><label v-for="id in recovering.projectIds" :key="id" class="mb-2 grid grid-cols-2 items-center gap-3 text-xs text-slate-600"><span>{{ projectLabel(id) }}</span><select v-model="recoveryDraft.projectRecipients[id]" class="studio-field" :aria-label="`项目接收方 ${projectLabel(id)}`"><option :value="null">所有者（{{ ownerName }}）</option><option v-for="member in recipients" :key="member.id" :value="member.id">{{ member.name }}（{{ member.role === 'admin' ? '管理员' : '创作者' }}）</option></select></label></div>
          <div v-if="recovering.accountIds.length"><h3 class="mb-2 text-sm font-medium">平台账号接收方</h3><label v-for="id in recovering.accountIds" :key="id" class="mb-2 grid grid-cols-2 items-center gap-3 text-xs text-slate-600"><span>{{ accountLabel(id) }}</span><select v-model="recoveryDraft.accountRecipients[id]" class="studio-field" :aria-label="`账号接收方 ${accountLabel(id)}`"><option :value="null">所有者（{{ ownerName }}）</option><option v-for="member in recipients" :key="member.id" :value="member.id">{{ member.name }}（{{ member.role === 'admin' ? '管理员' : '创作者' }}）</option></select></label></div>
          <div><h3 class="mb-2 text-sm font-medium">积分分配（剩余 {{ recovering.credits.toLocaleString() }}）</h3><label v-for="transfer in recoveryDraft.creditTransfers" :key="transfer.memberId" class="mb-2 grid grid-cols-2 items-center gap-3 text-xs text-slate-600"><span>{{ recipientLabel(transfer.memberId) }}</span><input v-model.number="transfer.credits" type="number" min="0" step="1" :max="recovering.credits" :aria-label="`转移积分 ${recipientLabel(transfer.memberId)}`" class="studio-field" /></label><p class="rounded-lg bg-slate-50 p-3 text-xs" :class="recoveryInvalid ? 'text-rose-600' : 'text-slate-600'">交还所有者可分配积分：{{ ownerRecoveryCredits.toLocaleString() }}<span v-if="recoveryInvalid">，请输入有效积分，分配总额不能超过剩余积分。</span></p></div>
        </div>
        <p v-if="recoveryError" role="alert" class="mt-4 text-xs text-rose-600">{{ recoveryError }}</p>
        <div class="mt-6 flex justify-end gap-2"><Button variant="outline" @click="recovering = null">取消</Button><Button class="bg-rose-500 text-white hover:bg-rose-600" :disabled="recoveryInvalid" @click="confirmRecovery">确认回收</Button></div>
      </Card>
    </div>
  </div>
</template>
