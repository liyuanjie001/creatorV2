<script setup lang="ts">
import { computed, ref } from 'vue';
import { Copy, Plus, ShieldCheck, Trash2, UserPlus, UsersRound, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Button, Card } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { creditsBalance } from '@/services/credits';
import { studio } from '@/services/studio';
import { currentUser } from '@/services/identity';
import {
  availableTeamCredits,
  createMembers,
  isTeamAdmin,
  removeMember,
  teamMembers,
  updateMember,
  type MemberInput,
  type TeamMember,
  type TeamRole,
} from '@/services/team';

type Draft = MemberInput;
const blank = (): Draft => ({ name: '', identity: '', password: '', role: 'creator', projectIds: [], accountIds: [], credits: 0 });
const drafts = ref<Draft[]>([blank()]);
const editing = ref<TeamMember | null>(null);
const createOpen = ref(false);
const editDraft = ref<Draft>(blank());
const busy = ref(false);
const error = ref('');
const inviteText = ref('');
const groupFilter = ref('');

const activeProjects = computed(() => studio.value.projects.filter(project => !project.archived));
const activeAccounts = computed(() => studio.value.accounts.filter(account => !account.deleted && account.status !== '已解绑'));
const groups = computed(() => studio.value.groups.filter(group => group.id !== 'ungrouped'));
const filteredAccounts = computed(() => activeAccounts.value.filter(account => !groupFilter.value || account.groupId === groupFilter.value));
const availableCredits = computed(() => availableTeamCredits(creditsBalance.value));
const invitePreview = computed(() => inviteText.value || '创建成员后，这里会生成可复制的邀请文案。');

function accountLabel(id: string) {
  const account = activeAccounts.value.find(item => item.id === id);
  return account ? `${account.name} · ${account.handle}` : id;
}
function projectLabel(id: string) { return activeProjects.value.find(item => item.id === id)?.name ?? id; }
function invitation(member: { name: string; identity: string; password: string; role: TeamRole }) {
  return `你已被邀请加入「${currentUser.value?.name ?? '团队'}」内容工作区\n登录账号：${member.identity}\n初始密码：${member.password}\n登录方式：密码登录\n角色：${member.role === 'admin' ? '管理员' : '创作者'}\n入口：${window.location.origin}${window.location.pathname}#/auth?mode=password`;
}
async function copy(text: string) {
  inviteText.value = text;
  try { await navigator.clipboard.writeText(text); toast.success('邀请文案已复制'); }
  catch { toast.info('邀请文案已生成，请手动复制'); }
}
function addDraft() { drafts.value.push(blank()); }
function removeDraft(index: number) { if (drafts.value.length > 1) drafts.value.splice(index, 1); }
function openCreate() {
  drafts.value = [blank()];
  groupFilter.value = '';
  error.value = '';
  createOpen.value = true;
}
function closeCreate() {
  if (busy.value) return;
  createOpen.value = false;
}
async function create() {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try {
    const created = await createMembers(drafts.value, creditsBalance.value);
    await copy(created.map((member, index) => invitation({ ...drafts.value[index]!, name: member.name, identity: member.identity })).join('\n\n'));
    toast.success(`已创建 ${created.length} 个成员账号`);
    drafts.value = [blank()];
    createOpen.value = false;
  } catch (e) { error.value = (e as Error).message; toast.error(error.value); }
  finally { busy.value = false; }
}
function openEdit(member: TeamMember) {
  editing.value = member;
  editDraft.value = { name: member.name, identity: member.identity, password: '', role: member.role, projectIds: [...member.projectIds], accountIds: [...member.accountIds], credits: member.credits };
  error.value = '';
}
function saveEdit() {
  if (!editing.value) return;
  try {
    updateMember(editing.value.id, editDraft.value, creditsBalance.value);
    toast.success('成员信息已更新'); editing.value = null;
  } catch (e) { error.value = (e as Error).message; toast.error(error.value); }
}
function recover(member: TeamMember) {
  const assets = `${member.projectIds.length} 个项目、${member.accountIds.length} 个账号、${member.credits} 积分`;
  if (!window.confirm(`回收「${member.name}」前，${assets} 将转回管理员名下，成员登录会立即失效。确认继续？`)) return;
  try { removeMember(member.id); toast.success(`已回收 ${member.name} 的成员账号`); }
  catch (e) { toast.error((e as Error).message); }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="团队协作" desc="邀请成员共同创作、发布并分配项目资源">
      <template #extra>
        <div class="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-700">
          <ShieldCheck class="h-4 w-4" /> 管理员工作区
        </div>
      </template>
    </PageHeader>

    <template v-if="isTeamAdmin">
      <div class="grid gap-4 sm:grid-cols-3">
        <Card class="border-slate-100 p-5"><div class="text-xs text-slate-400">团队成员</div><div class="mt-2 text-2xl font-semibold text-slate-800">{{ teamMembers.length }}</div><div class="mt-1 text-xs text-slate-400">当前有效成员</div></Card>
        <Card class="border-slate-100 p-5"><div class="text-xs text-slate-400">团队积分钱包</div><div class="mt-2 text-2xl font-semibold text-slate-800">{{ creditsBalance.toLocaleString() }}</div><div class="mt-1 text-xs text-slate-400">当前管理员余额</div></Card>
        <Card class="border-slate-100 p-5"><div class="text-xs text-slate-400">可分配积分</div><div class="mt-2 text-2xl font-semibold text-sky-600">{{ availableCredits.toLocaleString() }}</div><div class="mt-1 text-xs text-slate-400">已分配额度会暂时锁定</div></Card>
      </div>

      <Card class="border-slate-100 p-6">
          <div class="mb-4 flex items-center justify-between">
            <div><h2 class="text-[15px] font-semibold text-slate-800">团队成员（{{ teamMembers.length }}）</h2><p class="mt-1 text-xs text-slate-400">管理员可分配项目、账号与积分额度</p></div>
            <Button size="sm" class="gap-1.5 brand-gradient text-white" @click="openCreate"><UserPlus class="h-3.5 w-3.5" />邀请成员</Button>
          </div>
          <div v-if="!teamMembers.length" class="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">还没有团队成员，点击“邀请成员”创建第一个成员账号。</div>
          <div v-for="member in teamMembers" :key="member.id" class="mb-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 last:mb-0">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-xs font-semibold text-white">{{ member.name.slice(0, 2) }}</div>
              <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">{{ member.name }}<span class="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-600">{{ member.role === 'admin' ? '管理员' : '创作者' }}</span></div><div class="mt-1 text-xs text-slate-400">{{ member.identity }} · 剩余 {{ member.credits.toLocaleString() }} / {{ member.creditLimit.toLocaleString() }} 积分</div></div>
              <div class="flex shrink-0 gap-1"><button class="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-white hover:text-sky-600" @click="openEdit(member)">编辑</button><button class="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white hover:text-rose-500" @click="recover(member)"><Trash2 class="h-3.5 w-3.5" /></button></div>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500"><span v-for="id in member.projectIds" :key="id" class="rounded-full bg-white px-2 py-1">项目：{{ projectLabel(id) }}</span><span v-for="id in member.accountIds" :key="id" class="rounded-full bg-white px-2 py-1">账号：{{ accountLabel(id) }}</span><span v-if="!member.projectIds.length && !member.accountIds.length" class="text-slate-400">尚未分配项目或账号</span></div>
          </div>
      </Card>
    </template>

    <Card v-else class="border-slate-100 p-8"><div class="flex items-center gap-3 text-slate-700"><UsersRound class="h-5 w-5 text-sky-600" /><div><h2 class="font-semibold">你是团队成员</h2><p class="mt-1 text-sm text-slate-500">当前账号可访问管理员分配的项目与账号，剩余积分 {{ (teamMembers.find(member => member.id === currentUser?.teamMemberId)?.credits ?? 0).toLocaleString() }}。</p></div></div></Card>

    <div v-if="createOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" @click.self="closeCreate">
      <Card class="max-h-[90vh] w-full max-w-3xl overflow-hidden border-slate-200 bg-white p-0 shadow-xl">
        <div class="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 class="text-base font-semibold text-slate-800">创建成员账号</h2><p class="mt-1 text-xs leading-5 text-slate-400">支持一次创建多个成员，保存后自动生成邀请文案。</p></div>
          <div class="flex items-center gap-2"><button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" title="新增一行" @click="addDraft"><Plus class="h-4 w-4" /></button><button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" aria-label="关闭创建成员面板" @click="closeCreate"><X class="h-4 w-4" /></button></div>
        </div>
        <div class="max-h-[calc(90vh-150px)] space-y-5 overflow-y-auto px-6 py-5">
            <div v-for="(draft, index) in drafts" :key="index" class="rounded-xl border border-slate-100 p-3">
              <div class="mb-3 flex items-center justify-between text-xs font-medium text-slate-600">成员 {{ index + 1 }}<button v-if="drafts.length > 1" class="text-slate-400 hover:text-rose-500" @click="removeDraft(index)"><X class="h-3.5 w-3.5" /></button></div>
              <div class="space-y-2.5"><input v-model="draft.name" class="studio-field" placeholder="成员昵称" /><input v-model="draft.identity" class="studio-field" placeholder="账号名 / 邮箱 / 手机号" /><input v-model="draft.password" class="studio-field" type="password" placeholder="初始密码（至少 8 位）" /><div class="grid grid-cols-2 gap-2"><select v-model="draft.role" class="studio-field"><option value="creator">创作者</option><option value="admin">管理员</option></select><input v-model.number="draft.credits" class="studio-field" type="number" min="0" placeholder="积分额度" /></div></div>
              <div class="mt-3 space-y-2"><div class="text-[11px] font-medium text-slate-500">分配项目</div><div class="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto"> <label v-for="project in activeProjects" :key="project.id" class="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-100 px-2 py-1 text-[11px] text-slate-500 hover:border-sky-200"><input v-model="draft.projectIds" type="checkbox" :value="project.id" class="accent-sky-500" />{{ project.name }}</label><span v-if="!activeProjects.length" class="text-[11px] text-slate-400">暂无项目</span></div></div>
              <div class="mt-3 space-y-2"><div class="flex items-center justify-between text-[11px] font-medium text-slate-500"><span>分配账号（支持按分组筛选）</span><select v-model="groupFilter" class="rounded border-0 bg-slate-50 px-1.5 py-1 text-[10px] text-slate-500"><option value="">全部分组</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></div><div class="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto"><label v-for="account in filteredAccounts" :key="account.id" class="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-100 px-2 py-1 text-[11px] text-slate-500 hover:border-sky-200"><input v-model="draft.accountIds" type="checkbox" :value="account.id" class="accent-sky-500" />{{ account.name }}</label><span v-if="!filteredAccounts.length" class="text-[11px] text-slate-400">暂无可分配账号</span></div></div>
            </div>
          </div>
          <p v-if="error" role="alert" class="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">{{ error }}</p>
          <div class="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="outline" :disabled="busy" @click="closeCreate">取消</Button><Button class="brand-gradient text-white" :disabled="busy" @click="create">{{ busy ? '创建中…' : `创建 ${drafts.length} 个成员并复制邀请` }}</Button></div>
      </Card>
    </div>

    <Card v-if="inviteText" class="border-sky-100 bg-sky-50/50 p-5"><div class="flex items-start justify-between"><div><h2 class="text-sm font-semibold text-slate-800">最近生成的邀请文案</h2><p class="mt-1 text-xs text-slate-500">密码只在本次创建结果中展示，请及时发送给成员。</p></div><button class="rounded-lg p-1.5 text-slate-400 hover:bg-white" @click="inviteText = ''"><X class="h-4 w-4" /></button></div><textarea readonly class="mt-3 min-h-28 w-full rounded-xl border border-sky-100 bg-white p-3 text-xs leading-5 text-slate-600" :value="invitePreview" /><Button size="sm" class="mt-3 gap-1.5" variant="outline" @click="copy(inviteText)"><Copy class="h-3.5 w-3.5" />再次复制</Button></Card>

    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" @click.self="editing = null"><Card class="max-h-[90vh] w-full max-w-xl overflow-y-auto border-slate-200 bg-white p-6"><div class="flex items-center justify-between"><h2 class="text-base font-semibold text-slate-800">编辑成员</h2><button class="text-slate-400" @click="editing = null"><X class="h-4 w-4" /></button></div><div class="mt-5 grid gap-3 sm:grid-cols-2"><input v-model="editDraft.name" class="studio-field" placeholder="成员昵称" /><input v-model="editDraft.identity" class="studio-field" placeholder="账号名" /><input v-model="editDraft.password" class="studio-field" type="password" placeholder="留空则保留原密码" /><select v-model="editDraft.role" class="studio-field"><option value="creator">创作者</option><option value="admin">管理员</option></select><input v-model.number="editDraft.credits" class="studio-field" type="number" min="0" placeholder="剩余积分额度" /></div><div class="mt-4 text-xs font-medium text-slate-500">项目与账号分配</div><div class="mt-2 grid gap-3 sm:grid-cols-2"><div class="space-y-1.5"><label v-for="project in activeProjects" :key="project.id" class="flex items-center gap-2 text-xs text-slate-600"><input v-model="editDraft.projectIds" type="checkbox" :value="project.id" class="accent-sky-500" />{{ project.name }}</label></div><div class="space-y-1.5"><label v-for="account in activeAccounts" :key="account.id" class="flex items-center gap-2 text-xs text-slate-600"><input v-model="editDraft.accountIds" type="checkbox" :value="account.id" class="accent-sky-500" />{{ account.name }}</label></div></div><p v-if="error" role="alert" class="mt-3 text-xs text-rose-600">{{ error }}</p><div class="mt-6 flex justify-end gap-2"><Button variant="outline" @click="editing = null">取消</Button><Button class="brand-gradient text-white" @click="saveEdit">保存修改</Button></div></Card></div>
  </div>
</template>
