import { computed, ref, watch } from 'vue';
import { currentUser, identityService } from './identity';
import { now, readJSON, uid, writeJSON } from './storage';

export type TeamRole = 'admin' | 'creator';
export type TeamMember = {
  id: string;
  name: string;
  identity: string;
  role: TeamRole;
  projectIds: string[];
  accountIds: string[];
  credits: number;
  creditLimit: number;
  createdAt: string;
  active: boolean;
};
export type TeamState = { ownerId: string; members: TeamMember[]; updatedAt: string };
export type MemberInput = {
  name: string;
  identity: string;
  password: string;
  role: TeamRole;
  projectIds?: string[];
  accountIds?: string[];
  credits?: number;
};

const key = (id: string) => `chuhai-team-v1:${id}`;
export const workspaceOwnerId = () => currentUser.value?.teamOwnerId ?? currentUser.value?.id ?? 'guest';
const seed = (id: string): TeamState => ({ ownerId: id, members: [], updatedAt: now() });
function load(id: string) {
  const value = readJSON<TeamState>(key(id), () => seed(id));
  if (!value || value.ownerId !== id || !Array.isArray(value.members)) return seed(id);
  return {
    ...value,
    members: value.members.map(member => ({
      ...member,
      projectIds: member.projectIds ?? [],
      accountIds: member.accountIds ?? [],
      credits: member.credits ?? 0,
      creditLimit: member.creditLimit ?? member.credits ?? 0,
      active: member.active !== false,
    })),
  };
}
function commit(value: TeamState) {
  const next = { ...value, updatedAt: now() };
  if (!writeJSON(key(next.ownerId), next)) throw new Error('团队数据保存失败，请检查浏览器存储');
  team.value = next;
}

export const team = ref<TeamState>(load(workspaceOwnerId()));
watch(() => workspaceOwnerId(), id => { team.value = load(id); }, { flush: 'sync' });

export const isTeamMember = computed(() => Boolean(currentUser.value?.teamOwnerId && currentUser.value.teamMemberId));
export const currentMember = computed(() => team.value.members.find(member => member.id === currentUser.value?.teamMemberId && member.active));
export const isTeamAdmin = computed(() => !isTeamMember.value || currentMember.value?.role === 'admin');
export const teamMembers = computed(() => team.value.members.filter(member => member.active));
export const visibleProjectIds = computed(() => currentMember.value?.projectIds ?? null);
export const visibleAccountIds = computed(() => currentMember.value?.accountIds ?? null);
let transferWorkspaceAssets: ((memberId: string) => void) | undefined;
export function registerTeamAssetTransfer(handler: (memberId: string) => void) { transferWorkspaceAssets = handler; }

export function canManageTeam() { return isTeamAdmin.value; }
export function canCreateContent() { return isTeamAdmin.value || currentMember.value?.role === 'creator'; }
export function canPublish() { return canCreateContent(); }
export function canBindAccounts() { return canCreateContent(); }
export function canAuthorizeAccounts() { return isTeamAdmin.value; }
export function canEditProject(projectId: string) { return isTeamAdmin.value || Boolean(currentMember.value?.projectIds.includes(projectId)); }
export function canUseAccount(accountId: string) { return isTeamAdmin.value || Boolean(currentMember.value?.accountIds.includes(accountId)); }
export function requireTeamPermission(allowed: boolean, message = '当前成员没有执行此操作的权限') {
  if (!allowed) throw new Error(message);
}
export function availableTeamCredits(walletBalance: number) {
  const allocated = teamMembers.value.reduce((sum, member) => sum + member.credits, 0);
  return Math.max(0, walletBalance - allocated);
}

function normalizedIdentity(identity: string) { return identity.trim().toLowerCase(); }
function validateAssignments(projectIds: string[] = [], accountIds: string[] = []) {
  const workspace = readJSON<{ projects?: { id: string; archived?: boolean }[]; accounts?: { id: string; deleted?: boolean }[] }>(`chuhai-studio-v1:${workspaceOwnerId()}`, () => ({}));
  const projects = new Set((workspace.projects ?? []).filter(project => !project.archived).map(project => project.id));
  const accounts = new Set((workspace.accounts ?? []).filter(account => !account.deleted).map(account => account.id));
  if (projectIds.some(id => !projects.has(id))) throw new Error('分配列表中包含不可用项目');
  if (accountIds.some(id => !accounts.has(id))) throw new Error('分配列表中包含不可用账号');
  if (new Set(projectIds).size !== projectIds.length || new Set(accountIds).size !== accountIds.length) throw new Error('项目或账号分配不能重复');
}
function validateInput(input: MemberInput) {
  if (!input.name.trim() || input.name.trim().length > 30) throw new Error('昵称需为 1—30 个字符');
  if (!input.identity.trim()) throw new Error('请输入成员账号');
  if (input.password.length < 8) throw new Error('密码至少 8 位');
  if (!['admin', 'creator'].includes(input.role)) throw new Error('请选择有效成员角色');
  if (!Number.isSafeInteger(input.credits ?? 0) || (input.credits ?? 0) < 0) throw new Error('积分额度需为非负整数');
}

export async function createMembers(inputs: MemberInput[], walletBalance: number) {
  requireTeamPermission(canManageTeam(), '仅管理员可以邀请成员');
  if (!inputs.length) throw new Error('请至少添加一位成员');
  const identities = new Set<string>();
  for (const input of inputs) {
    validateInput(input);
    const identity = normalizedIdentity(input.identity);
    if (identities.has(identity)) throw new Error('批量成员账号不能重复');
    identities.add(identity);
    validateAssignments(input.projectIds, input.accountIds);
  }
  const total = inputs.reduce((sum, input) => sum + (input.credits ?? 0), 0);
  if (total > availableTeamCredits(walletBalance)) throw new Error('可分配积分不足');

  const ids = inputs.map(() => uid());
  const users = await identityService.createTeamMembers(workspaceOwnerId(), inputs.map((input, index) => ({
    memberId: ids[index]!, name: input.name.trim(), identity: normalizedIdentity(input.identity),
    password: input.password, role: input.role,
  })));
  const created = inputs.map((input, index) => ({
    id: ids[index]!, name: users[index]!.name, identity: users[index]!.identity,
    role: input.role, projectIds: [...(input.projectIds ?? [])], accountIds: [...(input.accountIds ?? [])],
    credits: input.credits ?? 0, creditLimit: input.credits ?? 0, createdAt: now(), active: true,
  }));
  const next = { ...team.value, members: [...team.value.members, ...created] };
  try { commit(next); }
  catch (error) {
    for (const member of created) identityService.disableTeamMember(workspaceOwnerId(), member.id);
    throw error;
  }
  return created;
}

export function updateMember(id: string, changes: Partial<Omit<MemberInput, 'password'>> & { password?: string }, walletBalance: number) {
  requireTeamPermission(canManageTeam(), '仅管理员可以编辑成员');
  const member = team.value.members.find(value => value.id === id && value.active);
  if (!member) throw new Error('成员不存在');
  const nextCredits = changes.credits === undefined ? member.credits : changes.credits;
  if (!Number.isSafeInteger(nextCredits) || nextCredits < 0) throw new Error('积分额度需为非负整数');
  const available = availableTeamCredits(walletBalance) + member.credits;
  if (nextCredits > available) throw new Error('可分配积分不足');
  const name = changes.name?.trim() || member.name;
  if (name.length > 30) throw new Error('昵称最多 30 个字符');
  const identity = changes.identity ? normalizedIdentity(changes.identity) : member.identity;
  const role = changes.role ?? member.role;
  const projectIds = changes.projectIds ? [...changes.projectIds] : member.projectIds;
  const accountIds = changes.accountIds ? [...changes.accountIds] : member.accountIds;
  validateAssignments(projectIds, accountIds);
  const nextMembers = team.value.members.map(value => value.id === id ? {
    ...value, name, identity, role, credits: nextCredits,
    creditLimit: Math.max(0, value.creditLimit + nextCredits - value.credits),
    projectIds, accountIds,
  } : value);
  const previous = team.value;
  commit({ ...previous, members: nextMembers });
  try {
    identityService.updateTeamMember(workspaceOwnerId(), id, {
      ...(changes.name ? { name } : {}), ...(changes.identity ? { identity } : {}),
      ...(changes.password ? { password: changes.password } : {}), ...(changes.role ? { role } : {}),
    });
  } catch (error) {
    commit(previous);
    throw error;
  }
}

export function assertCreditSpend(amount: number, walletBalance: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return;
  if (walletBalance < amount) throw new Error('团队积分余额不足');
  if (isTeamMember.value) {
    if (!currentMember.value || currentMember.value.credits < amount) throw new Error('成员积分不足');
  } else if (availableTeamCredits(walletBalance) < amount) {
    throw new Error('团队可用积分不足，部分额度已分配给成员');
  }
}

export function commitCreditSpend(amount: number) {
  if (!isTeamMember.value || !amount) return;
  const member = currentMember.value;
  if (!member || member.credits < amount) throw new Error('成员积分不足');
  commit({
    ...team.value,
    members: team.value.members.map(value => value.id === member.id ? { ...value, credits: value.credits - amount } : value),
  });
}

export function removeMember(id: string) {
  requireTeamPermission(canManageTeam(), '仅管理员可以回收成员账号');
  const member = team.value.members.find(value => value.id === id && value.active);
  if (!member) throw new Error('成员不存在');
  const owner = workspaceOwnerId();
  const workspaceKey = `chuhai-studio-v1:${owner}`;
  const workspace = readJSON<{ films?: { createdByMemberId?: string }[]; tasks?: { createdByMemberId?: string }[] } | null>(workspaceKey, () => null);
  if (workspace) {
    for (const film of workspace.films ?? []) if (film.createdByMemberId === id) delete film.createdByMemberId;
    for (const task of workspace.tasks ?? []) if (task.createdByMemberId === id) delete task.createdByMemberId;
    if (!writeJSON(workspaceKey, workspace)) throw new Error('资产归属转移失败，请稍后重试');
  }
  transferWorkspaceAssets?.(id);
  commit({ ...team.value, members: team.value.members.map(value => value.id === id ? { ...value, active: false, credits: 0, projectIds: [], accountIds: [] } : value) });
  identityService.disableTeamMember(owner, id);
  return member;
}
