import { File as NodeFile } from 'node:buffer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import Team from '@/pages/Team.vue';
import { currentUser, identityService, workspaceOwnerProfile } from '@/services/identity';
import { studio, createProject, ensurePublishTask } from '@/services/studio';
import { creditUsageEvents, creditsBalance, spendCredits, teamCreditsConsumed, teamWalletBalance, ownerCreditsConsumed, refreshRechargeAccount } from '@/services/credits';
import { createMembers, memberCreditsConsumed, removeMember, recoverMember, availableTeamCredits, archivedMembers, team, updateMember, visibleAccountIds, visibleProjectIds, type RecoveryAllocation } from '@/services/team';

function installMemoryIndexedDB() {
  const files = new Map<string, Blob>();
  const factory = {
    open: () => {
      const request: Record<string, unknown> = { result: undefined };
      const database = {
        createObjectStore: () => undefined,
        close: () => undefined,
        transaction: () => {
          const transaction: Record<string, unknown> = {
            objectStore: () => ({
              put: (value: Blob, key: string) => { files.set(key, value); return {}; },
              get: (key: string) => {
                const read: Record<string, unknown> = { result: undefined };
                queueMicrotask(() => { read.result = files.get(key); (read.onsuccess as (() => void) | undefined)?.(); });
                return read;
              },
            }),
          };
          queueMicrotask(() => (transaction.oncomplete as (() => void) | undefined)?.());
          return transaction;
        },
      };
      request.result = database;
      queueMicrotask(() => {
        (request.onupgradeneeded as (() => void) | undefined)?.();
        (request.onsuccess as (() => void) | undefined)?.();
      });
      return request;
    },
  };
  vi.stubGlobal('indexedDB', factory as unknown as IDBFactory);
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('File', NodeFile);
  installMemoryIndexedDB();
  identityService.demo();
  refreshRechargeAccount();
  studio.value.projects = [];
  studio.value.accounts = [];
  studio.value.films = [];
  studio.value.tasks = [];
  studio.value.jobs = [];
  team.value = { ownerId: 'demo', members: [], updatedAt: new Date().toISOString() };
});

let wrapper: VueWrapper | undefined;
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.restoreAllMocks(); });

const input = (identity: string, credits = 10) => ({ name: identity, identity, password: 'member-pass-123', role: 'creator' as const, credits });
const ownerAllocation = (): RecoveryAllocation => ({ projectRecipients: {}, accountRecipients: {}, creditTransfers: [] });

test('空团队也展示所有者只读行，数量包含所有者', () => {
  wrapper = mount(Team);
  const row = wrapper.get('[data-testid="owner-row"]');
  expect(row.text()).toContain('林悦');
  expect(row.text()).toContain('demo@chuhai.studio');
  expect(row.text()).toContain('所有者');
  expect(row.findAll('button, input, select')).toHaveLength(0);
  expect(wrapper.text()).toContain('团队成员（1）');
  expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  expect(wrapper.text()).not.toContain('登录名');
});

test('演示工作区自动生成项目、账号和积分消耗示例，且统计保持一致', async () => {
  const first = createProject('演示护肤项目');
  const second = createProject('演示生活项目');
  studio.value.accounts = ['demo-account-a', 'demo-account-b'].map((id, index) => ({
    id, name: `演示账号 ${index + 1}`, handle: `@demo.${index + 1}`, region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString(),
  }));
  await createMembers([1, 2, 3, 4].map(index => input(`existing-demo-member-${index}`, 0)), teamWalletBalance.value);
  wrapper = mount(Team);
  await flushPromises();
  await flushPromises();

  expect(team.value.members).toHaveLength(4);
  expect(team.value.members.some(member => member.projectIds.length && member.accountIds.length)).toBe(true);
  expect(team.value.members.reduce((sum, member) => sum + member.creditLimit, 0)).toBe(40);
  expect(team.value.members.reduce((sum, member) => sum + member.credits, 0)).toBe(26);
  expect(team.value.members.reduce((sum, member) => sum + memberCreditsConsumed(member), 0)).toBe(14);
  expect(teamCreditsConsumed.value).toBe(19);
  expect(ownerCreditsConsumed.value).toBe(5);
  expect(teamWalletBalance.value).toBe(81);
  expect(creditUsageEvents.value).toHaveLength(5);
  expect(creditUsageEvents.value.filter(event => event.memberId).map(event => event.credits)).toEqual([3, 5, 2, 4]);
  expect(currentUser.value?.id).toBe('demo');
  expect(team.value.members.some(member => member.projectIds.includes(first.id) && member.projectIds.includes(second.id))).toBe(true);
});

test('团队成员卡片可进入团队席位购买页，钱包卡片显示团队剩余积分', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/team', component: Team }, { path: '/purchase', component: { template: '<div />' } }] });
  await router.push('/team');
  await router.isReady();
  wrapper = mount(Team, { global: { plugins: [router] } });
  expect(wrapper.text()).toContain('团队剩余积分');
  expect(wrapper.text()).not.toContain('团队积分钱包');
  await wrapper.get('[aria-label="购买席位"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.fullPath).toBe('/purchase?edition=team');
  await wrapper.get('[aria-label="团队积分充值"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.fullPath).toBe('/purchase?edition=team&tab=credits');
});

test('搜索按成员名称或账号名即时筛选，支持所有者、无结果和清空恢复', async () => {
  await createMembers([
    { ...input('creator-one'), name: '林小雨' },
    { ...input('designer-two'), name: '周设计' },
  ], 100);
  wrapper = mount(Team);
  const search = wrapper.get('[data-testid="team-member-search"]');

  await search.setValue('小雨');
  expect(wrapper.findAll('[data-member-id]')).toHaveLength(1);
  expect(wrapper.get('[data-member-id]').text()).toContain('林小雨');
  expect(wrapper.find('[data-testid="owner-row"]').exists()).toBe(false);

  await search.setValue('DESIGNER-TWO');
  expect(wrapper.findAll('[data-member-id]')).toHaveLength(1);
  expect(wrapper.get('[data-member-id]').text()).toContain('周设计');

  await search.setValue('demo@chuhai.studio');
  expect(wrapper.find('[data-testid="owner-row"]').exists()).toBe(true);
  expect(wrapper.findAll('[data-member-id]')).toHaveLength(0);

  await search.setValue('不存在');
  expect(wrapper.find('[data-testid="team-member-search-empty"]').text()).toContain('没有找到匹配的成员');

  await search.setValue('   ');
  expect(wrapper.find('[data-testid="team-member-search-empty"]').exists()).toBe(false);
  expect(wrapper.find('[data-testid="owner-row"]').exists()).toBe(true);
  expect(wrapper.findAll('[data-member-id]')).toHaveLength(2);
  expect(wrapper.text()).toContain('团队成员（3）');
});

test('创建成员展示系统初始密码，支持多项目和多平台账号，并限制积分额度', async () => {
  const first = createProject('创建项目一');
  const second = createProject('创建项目二');
  studio.value.accounts = ['create-one', 'create-two'].map(id => ({ id, name: id, handle: `@${id}`, region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString() }));
  wrapper = mount(Team, { attachTo: document.body });
  await wrapper.findAll('button').find(button => button.text().includes('邀请成员'))!.trigger('click');

  const password = wrapper.get('[aria-label="系统生成的初始密码"]').element as HTMLInputElement;
  expect(password.value).toMatch(/^Init-/);
  await wrapper.get(`[aria-label="分配项目 ${first.name}"]`).setValue(true);
  await wrapper.get(`[aria-label="分配项目 ${second.name}"]`).setValue(true);
  await wrapper.get('[aria-label="分配平台账号 create-one"]').setValue(true);
  await wrapper.get('[aria-label="分配平台账号 create-two"]').setValue(true);

  const credits = wrapper.get('input[type="number"]');
  const max = Number(await credits.attributes('max'));
  expect(wrapper.text()).toContain(`当前可分配：${max.toLocaleString()} 积分`);
  await credits.setValue(max + 1);
  const saveButton = () => wrapper!.findAll('button').find(button => button.text() === '保存')!;
  expect(saveButton().attributes('disabled')).toBeDefined();
  await credits.setValue(0);
  await wrapper.get('input[placeholder="请输入成员名称"]').setValue('多选成员');
  await saveButton().trigger('click');
  await flushPromises();

  const member = team.value.members.find(item => item.name === '多选成员');
  expect(member?.projectIds).toEqual([first.id, second.id]);
  expect(member?.accountIds).toEqual(['create-one', 'create-two']);
});

test('服务拒绝编辑、回收所有者', async () => {
  await expect(updateMember('demo', { name: '错误操作' }, 100)).rejects.toThrow('所有者不可操作');
  expect(() => recoverMember('demo', ownerAllocation())).toThrow('所有者不可操作');
});

test('编辑按钮打开弹窗，支持取消、改名、角色、多资源、积分和密码，消耗保持不变', async () => {
  const first = createProject('项目一');
  const second = createProject('项目二');
  studio.value.accounts = ['one', 'two'].map(id => ({ id, name: id, handle: `@${id}`, region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString() }));
  await createMembers([input('inline-writer', 30)], 100);
  await identityService.login('inline-writer', 'member-pass-123');
  spendCredits(5);
  identityService.demo();
  wrapper = mount(Team, { attachTo: document.body });
  const edit = () => wrapper!.get('[aria-label="编辑 inline-writer"]').trigger('click');
  await edit();
  expect(wrapper.get('[data-testid="edit-member-dialog"]').attributes('role')).toBe('dialog');
  expect(wrapper.find('[data-testid="editing-member-row"]').exists()).toBe(false);
  await wrapper.get('[aria-label="成员名称"]').setValue('未保存');
  await wrapper.get('[aria-label="关闭编辑成员"]').trigger('click');
  expect(team.value.members[0]!.name).toBe('inline-writer');
  await edit();
  await wrapper.get('[aria-label="成员名称"]').setValue('新名称');
  await wrapper.get('[aria-label="账号名"]').setValue('renamed-writer');
  await wrapper.get('[aria-label="新密码"]').setValue('changed-pass-123');
  await wrapper.get('[aria-label="成员角色"]').setValue('admin');
  await wrapper.get(`[aria-label="分配项目 ${first.name}"]`).setValue(true);
  await wrapper.get(`[aria-label="分配项目 ${second.name}"]`).setValue(true);
  await wrapper.get('[aria-label="分配账号 one"]').setValue(true);
  await wrapper.get('[aria-label="分配账号 two"]').setValue(true);
  await wrapper.get('[aria-label="剩余积分"]').setValue(40);
  await wrapper.get('[data-testid="edit-member-dialog"] button[type="submit"]').trigger('click');
  await flushPromises();
  expect(wrapper.find('[data-testid="edit-member-dialog"]').exists()).toBe(false);
  expect(team.value.members[0]).toMatchObject({ name: '新名称', identity: 'renamed-writer', role: 'admin', projectIds: [first.id, second.id], accountIds: ['one', 'two'], credits: 40, creditLimit: 45 });
  await expect(identityService.login('inline-writer', 'member-pass-123')).rejects.toThrow();
  await expect(identityService.login('renamed-writer', 'member-pass-123')).rejects.toThrow();
  await identityService.login('renamed-writer', 'changed-pass-123');
  expect(currentUser.value?.name).toBe('新名称');
  expect(workspaceOwnerProfile.value?.id).toBe('demo');
  expect(workspaceOwnerProfile.value?.identity).toBe('demo@chuhai.studio');
});

test('仅有一位成员时，回收弹窗默认所有资源和积分归所有者', async () => {
  const project = createProject('唯一成员项目');
  const [member] = await createMembers([{ ...input('single-writer', 30), projectIds: [project.id] }], 100);
  wrapper = mount(Team);
  await wrapper.get(`[aria-label="回收 ${member!.name}"]`).trigger('click');
  let dialog = wrapper.get('[data-testid="recovery-dialog"]');
  expect(dialog.text()).toContain('没有其他可接收成员');
  expect(dialog.findAll('option')).toHaveLength(1);
  expect(dialog.findAll('input')).toHaveLength(0);
  await dialog.findAll('button').find(button => button.text() === '取消')!.trigger('click');
  expect(team.value.members[0]!.active).toBe(true);
  await wrapper.get(`[aria-label="回收 ${member!.name}"]`).trigger('click');
  dialog = wrapper.get('[data-testid="recovery-dialog"]');
  await dialog.findAll('button').find(button => button.text() === '确认回收')!.trigger('click');
  expect(team.value.members[0]!.recovery?.allocation).toEqual({ projectRecipients: { [project.id]: null }, accountRecipients: {}, creditTransfers: [] });
  expect(availableTeamCredits(teamWalletBalance.value)).toBe(100);
  expect(wrapper.text()).toContain('团队成员（1）');
  expect(wrapper.get('[data-testid="archived-members"]').text()).toContain('single-writer');
});

test('悬停表格单元格不再进入编辑，点击编辑后可在弹窗修改项目、账号和积分', async () => {
  const first = createProject('项目一'), second = createProject('项目二');
  studio.value.accounts = ['one', 'two'].map(id => ({ id, name: id, handle: `@${id}`, region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString() }));
  const [member] = await createMembers([input('cell-writer', 30)], 100);
  await identityService.login('cell-writer', 'member-pass-123');
  spendCredits(5);
  identityService.demo();
  wrapper = mount(Team, { attachTo: document.body });
  const cell = (index: number) => wrapper!.get(`[data-member-id="${member!.id}"] td:nth-child(${index})`);
  await cell(4).trigger('mouseenter');
  await cell(5).trigger('mouseenter');
  await cell(6).trigger('mouseenter');
  expect(wrapper.find('[data-testid="edit-member-dialog"]').exists()).toBe(false);
  expect(wrapper.find('[data-member-id] input, [data-member-id] select').exists()).toBe(false);
  expect(wrapper.find('[aria-label="分配项目 项目一"]').exists()).toBe(false);
  expect(team.value.members[0]!.projectIds).toEqual([]);
  expect(team.value.members[0]!.accountIds).toEqual([]);
  expect(team.value.members[0]!.credits).toBe(25);
  await wrapper.get('[aria-label="编辑 cell-writer"]').trigger('click');
  const dialog = wrapper.get('[data-testid="edit-member-dialog"]');
  await dialog.get('[aria-label="分配项目 项目一"]').setValue(true);
  await dialog.get('[aria-label="分配项目 项目二"]').setValue(true);
  await dialog.get('[aria-label="分配账号 one"]').setValue(true);
  await dialog.get('[aria-label="分配账号 two"]').setValue(true);
  await dialog.get('[aria-label="剩余积分"]').setValue(40);
  await dialog.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(team.value.members[0]).toMatchObject({ id: member!.id, credits: 40, creditLimit: 45, projectIds: [first.id, second.id], accountIds: ['one', 'two'] });
  expect(memberCreditsConsumed(team.value.members[0]!)).toBe(5);
  expect(wrapper.find('[data-testid="edit-member-dialog"]').exists()).toBe(false);
  await wrapper.get('[aria-label="编辑 cell-writer"]').trigger('click');
  expect(wrapper.get('[data-testid="edit-member-dialog"] [aria-label="剩余积分"]').element).toHaveProperty('value', '40');
  expect(wrapper.get('[data-testid="edit-member-dialog"] [aria-label="分配账号 one"]').element).toHaveProperty('checked', true);
});

test('编辑弹窗错误显示在弹窗内，取消不保存，重新打开读取最新成员信息', async () => {
  await createMembers([input('dialog-writer')], 100);
  wrapper = mount(Team, { attachTo: document.body });
  await wrapper.get('[aria-label="编辑 dialog-writer"]').trigger('click');
  await wrapper.get('[aria-label="账号名"]').setValue('demo@chuhai.studio');
  await wrapper.get('[data-testid="edit-member-dialog"] button[type="submit"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('[data-testid="edit-member-dialog"] [role="alert"]').text()).toContain('所有者');
  await wrapper.get('[data-testid="edit-member-dialog"]').findAll('button').find(button => button.text() === '取消')!.trigger('click');
  expect(team.value.members[0]!.identity).toBe('dialog-writer');
  await wrapper.get('[aria-label="编辑 dialog-writer"]').trigger('click');
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  expect(wrapper.get('[aria-label="账号名"]').element).toHaveProperty('value', 'dialog-writer');
});

test('默认回收不把资源和积分交给管理员成员', async () => {
  const project = createProject('默认归属');
  const [source, admin] = await createMembers([{ ...input('source'), projectIds: [project.id] }, { ...input('admin'), role: 'admin' }], 100);
  recoverMember(source!.id, ownerAllocation());
  expect(team.value.members.find(item => item.id === admin!.id)).toMatchObject({ credits: 10, projectIds: [], accountIds: [] });
  expect(archivedMembers.value[0]!.recovery?.allocation.projectRecipients[project.id]).toBeNull();
  expect(availableTeamCredits(teamWalletBalance.value)).toBe(90);
});

test('团队消耗卡片打开仪表盘并展示全团队流水、趋势、模型及成员汇总', async () => {
  const [writer] = await createMembers([input('usage-writer', 20)], 100);
  spendCredits(8, { model: 'Wan 3.0', taskType: '视频生成', title: '所有者视频' });
  await identityService.login('usage-writer', 'member-pass-123');
  spendCredits(12, { model: 'Seed Lite', taskType: '视频拆解', title: '成员拆解任务' });
  identityService.demo();
  wrapper = mount(Team, { attachTo: document.body });
  expect(wrapper.find('[data-testid="team-usage-dialog"]').exists()).toBe(false);
  await wrapper.get('[data-testid="team-usage-trigger"]').trigger('click');
  const dialog = wrapper.get('[data-testid="team-usage-dialog"]');
  expect(dialog.attributes('role')).toBe('dialog');
  expect(dialog.text()).toContain('团队累计消耗');
  expect(dialog.text()).toContain('20 积分');
  expect(dialog.text()).toContain('Wan 3.0');
  expect(dialog.text()).toContain('Seed Lite');
  expect(dialog.text()).toContain('所有者视频');
  expect(dialog.text()).toContain('成员拆解任务');
  expect(dialog.text()).toContain(writer!.name);
  expect(creditUsageEvents.value.map(event => event.credits)).toEqual([8, 12]);
  await dialog.get('[aria-label="积分统计时间"]').setValue('7');
  expect(dialog.text()).toContain('7 天内记录明细');
  await dialog.get('[aria-label="查看成员 usage-writer 的消耗详情"]').trigger('click');
  const detail = dialog.get('[data-testid="member-usage-detail"]');
  expect(detail.text()).toContain('成员拆解任务');
  expect(detail.text()).not.toContain('所有者视频');
  expect(detail.text()).toContain('12');
  await dialog.get('[aria-label="积分统计时间"]').setValue('30');
  expect(dialog.get('[data-testid="member-usage-detail"]').text()).toContain('30 天内记录明细');
  await dialog.get('[aria-label="返回团队消耗总览"]').trigger('click');
  expect(dialog.text()).toContain('所有者视频');
  await dialog.get('[aria-label="关闭团队消耗仪表盘"]').trigger('click');
  expect(wrapper.find('[data-testid="team-usage-dialog"]').exists()).toBe(false);
  await wrapper.get('[aria-label="查看 usage-writer 的消耗详情"]').trigger('click');
  expect(wrapper.get('[data-testid="member-usage-detail"]').text()).toContain('成员拆解任务');
  await wrapper.get('[aria-label="关闭团队消耗仪表盘"]').trigger('click');
});

test('管理员成员登录时从历史凭证恢复真实所有者，不能显示为管理员本人', async () => {
  await identityService.newUser();
  await identityService.updateName('真实所有者');
  const owner = { ...currentUser.value! };
  await createMembers([{ ...input('team-admin'), name: '成员管理员', role: 'admin' }], 50);
  localStorage.removeItem(`chuhai-owner-profile-v1:${owner.id}`);
  identityService.logout();
  await identityService.login('team-admin', 'member-pass-123');
  await flushPromises();
  expect(workspaceOwnerProfile.value).toEqual({ id: owner.id, name: owner.name, identity: owner.identity });
  wrapper = mount(Team);
  const row = wrapper.get('[data-testid="owner-row"]');
  expect(row.text()).toContain('真实所有者');
  expect(row.text()).toContain(owner.identity);
  expect(row.text()).not.toContain('成员管理员');
  expect(row.findAll('button, input, select')).toHaveLength(0);
  expect(() => recoverMember(currentUser.value!.teamMemberId!, ownerAllocation())).toThrow('不能回收当前登录');
});

test('回收弹窗校验积分超额并提交选定项目接收方', async () => {
  const project = createProject('分配测试');
  const [source, recipient] = await createMembers([{ ...input('source', 30), projectIds: [project.id] }, input('recipient')], 100);
  wrapper = mount(Team);
  await wrapper.get('[aria-label="回收 source"]').trigger('click');
  const dialog = wrapper.get('[data-testid="recovery-dialog"]');
  const confirm = dialog.findAll('button').find(button => button.text() === '确认回收')!;
  await dialog.get('[aria-label="转移积分 recipient"]').setValue(31);
  expect(confirm.attributes('disabled')).toBeDefined();
  expect(team.value.members.find(member => member.id === source!.id)!.active).toBe(true);
  await dialog.get('[aria-label="转移积分 recipient"]').setValue(7);
  await dialog.get('[aria-label="项目接收方 分配测试"]').setValue(recipient!.id);
  expect(confirm.attributes('disabled')).toBeUndefined();
  expect(dialog.text()).toContain('交还所有者可分配积分：23');
  await confirm.trigger('click');
  expect(team.value.members.find(member => member.id === recipient!.id)).toMatchObject({ projectIds: [project.id], credits: 17 });
  expect(team.value.members.find(member => member.id === source!.id)!.active).toBe(false);
});

test('资源逐项分配、多人成员积分转移合并去重，历史与钱包消耗不变', async () => {
  const p1 = createProject('项目一'), p2 = createProject('项目二');
  studio.value.accounts = ['a1', 'a2'].map(id => ({ id, name: id, handle: `@${id}`, region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString() }));
  const [source, first, second] = await createMembers([
    { ...input('source', 40), projectIds: [p1.id, p2.id], accountIds: ['a1', 'a2'] },
    { ...input('first', 10), projectIds: [p1.id], accountIds: ['a2'] },
    input('second', 10),
  ], 100);
  spendCredits(5);
  await identityService.login('source', 'member-pass-123'); spendCredits(10);
  await identityService.login('first', 'member-pass-123'); spendCredits(2);
  identityService.demo();
  const wallet = teamWalletBalance.value;
  expect(teamCreditsConsumed.value).toBe(17);
  expect(ownerCreditsConsumed.value).toBe(5);
  recoverMember(source!.id, {
    projectRecipients: { [p1.id]: first!.id, [p2.id]: second!.id },
    accountRecipients: { a1: null, a2: first!.id },
    creditTransfers: [{ memberId: first!.id, credits: 10 }, { memberId: second!.id, credits: 5 }],
  });
  const recovered = archivedMembers.value[0]!;
  expect(recovered).toMatchObject({ active: false, credits: 0, projectIds: [], accountIds: [], recovery: { credits: 30, consumed: 10, projectIds: [p1.id, p2.id], accountIds: ['a1', 'a2'] } });
  const recipient = team.value.members.find(item => item.id === first!.id)!;
  expect(recipient).toMatchObject({ credits: 18, creditLimit: 20, projectIds: [p1.id], accountIds: ['a2'] });
  expect(memberCreditsConsumed(recipient)).toBe(2);
  expect(team.value.members.find(item => item.id === second!.id)).toMatchObject({ credits: 15, projectIds: [p2.id] });
  expect(teamWalletBalance.value).toBe(wallet);
  expect(availableTeamCredits(wallet)).toBe(50);
  expect(teamCreditsConsumed.value).toBe(17);
  expect(ownerCreditsConsumed.value).toBe(5);
  expect(studio.value.projects).toHaveLength(2);
  expect(studio.value.accounts).toHaveLength(2);
  await expect(identityService.login('source', 'member-pass-123')).rejects.toThrow();
});

test.each(['self', 'inactive', 'foreign-resource', 'negative', 'fraction', 'excess', 'duplicate'])('无效回收分配 %s 不改变数据', async kind => {
  const [source, recipient] = await createMembers([input('source', 30), input('recipient')], 100);
  const allocation = ownerAllocation();
  if (kind === 'foreign-resource') allocation.projectRecipients.missing = recipient!.id;
  else allocation.creditTransfers = [{ memberId: kind === 'self' ? source!.id : kind === 'inactive' ? 'missing' : recipient!.id, credits: kind === 'negative' ? -1 : kind === 'fraction' ? 0.5 : kind === 'excess' ? 31 : 1 }];
  if (kind === 'duplicate') allocation.creditTransfers.push({ memberId: recipient!.id, credits: 1 });
  const previous = JSON.stringify(team.value);
  const credentials = localStorage.getItem('chuhai-team-credentials-v1:demo');
  expect(() => recoverMember(source!.id, allocation)).toThrow();
  expect(JSON.stringify(team.value)).toBe(previous);
  expect(localStorage.getItem('chuhai-team-credentials-v1:demo')).toBe(credentials);
  await identityService.login('source', 'member-pass-123');
});

test.each(['chuhai-team-credentials-v1:demo', 'chuhai-team-credential-index-v1', 'chuhai-team-v1:demo', 'chuhai-studio-v1:demo'])('回收保存 %s 失败时恢复已写入数据且成员仍可登录', async failedKey => {
  const [source, recipient] = await createMembers([input('source', 30), input('recipient')], 100);
  const keys = ['chuhai-team-credentials-v1:demo', 'chuhai-team-credential-index-v1', 'chuhai-team-v1:demo', 'chuhai-studio-v1:demo'];
  const snapshots = keys.map(key => localStorage.getItem(key));
  const state = JSON.stringify(team.value), workspace = JSON.stringify(studio.value);
  const original = Storage.prototype.setItem;
  let failed = false;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
    if (key === failedKey && !failed) { failed = true; throw new Error('quota'); }
    original.call(this, key, value);
  });
  expect(() => recoverMember(source!.id, { ...ownerAllocation(), creditTransfers: [{ memberId: recipient!.id, credits: 20 }] })).toThrow('修改已撤销');
  expect(keys.map(key => localStorage.getItem(key))).toEqual(snapshots);
  expect(JSON.stringify(team.value)).toBe(state);
  expect(JSON.stringify(studio.value)).toBe(workspace);
  spy.mockRestore();
  await identityService.login('source', 'member-pass-123');
});

test('旧回收记录缺失消耗快照时显示未知，不能记入所有者个人消耗', () => {
  team.value.members = [{ ...input('legacy'), id: 'legacy', projectIds: [], accountIds: [], active: false, credits: 0, creditLimit: 0, createdAt: new Date().toISOString() }];
  expect(ownerCreditsConsumed.value).toBeNull();
  wrapper = mount(Team);
  expect(wrapper.get('[data-testid="owner-row"]').text()).toContain('—');
  expect(wrapper.get('[data-testid="archived-members"]').text()).toContain('历史分配记录缺失');
});

test('账号名重复和密码不合规编辑不会部分保存，保存失败也保持原账号', async () => {
  const [first] = await createMembers([input('first'), input('second')], 100);
  const previous = JSON.stringify(team.value);
  await expect(updateMember(first!.id, { identity: 'second', name: '未保存' }, 100)).rejects.toThrow('已存在');
  await expect(updateMember(first!.id, { identity: 'demo@chuhai.studio' }, 100)).rejects.toThrow('所有者');
  await expect(updateMember(first!.id, { identity: 'renamed', password: 'short' }, 100)).rejects.toThrow('至少 8 位');
  const original = Storage.prototype.setItem;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
    if (key === 'chuhai-team-v1:demo') throw new Error('quota');
    original.call(this, key, value);
  });
  await expect(updateMember(first!.id, { identity: 'renamed', credits: 20 }, 100)).rejects.toThrow('修改已撤销');
  spy.mockRestore();
  expect(JSON.stringify(team.value)).toBe(previous);
  await identityService.login('first', 'member-pass-123');
});

test('成员密码登录后进入管理员共享 workspace，并保留项目与账号范围', async () => {
  const project = createProject('共享项目');
  const account = { id: 'shared-account', name: 'Shared', handle: '@shared', region: 'US', groupId: 'ungrouped', note: '', status: '已授权' as const, authorizedAt: new Date().toISOString() };
  studio.value.accounts = [account];
  const [member] = await createMembers([{ name: '创作者', identity: 'writer', password: 'writer-pass-123', role: 'creator', projectIds: [project.id], accountIds: [account.id], credits: 30 }], 100);

  identityService.logout();
  await identityService.login('writer', 'writer-pass-123');

  expect(currentUser.value?.teamOwnerId).toBe('demo');
  expect(currentUser.value?.teamMemberId).toBe(member!.id);
  expect(studio.value.projects.some(item => item.id === project.id)).toBe(true);
  expect(visibleProjectIds.value).toEqual([project.id]);
  expect(visibleAccountIds.value).toEqual([account.id]);
  expect(creditsBalance.value).toBe(30);
});

test('成员创作扣自己的团队额度，不能消耗管理员可分配额度', async () => {
  const [writer, second] = await createMembers([
    { name: '创作者', identity: 'writer', password: 'writer-pass-123', role: 'creator', credits: 30 },
    { name: '另一位成员', identity: 'writer-two', password: 'writer-two-pass', role: 'creator', credits: 20 },
  ], 100);
  expect(memberCreditsConsumed(writer!)).toBe(0);
  identityService.logout();
  await identityService.login('writer', 'writer-pass-123');
  spendCredits(20);
  expect(creditsBalance.value).toBe(10);
  expect(team.value.members[0]?.credits).toBe(10);
  expect(memberCreditsConsumed(team.value.members[0]!)).toBe(20);
  expect(teamCreditsConsumed.value).toBe(20);

  identityService.logout();
  await identityService.login('writer-two', 'writer-two-pass');
  spendCredits(5);
  expect(memberCreditsConsumed(team.value.members.find(member => member.id === second!.id)!)).toBe(5);
  expect(teamCreditsConsumed.value).toBe(25);
});

test('管理员调整成员余额不会改写其累计消耗', async () => {
  const [member] = await createMembers([{ name: '创作者', identity: 'writer', password: 'writer-pass-123', role: 'creator', credits: 30 }], 100);
  identityService.logout();
  await identityService.login('writer', 'writer-pass-123');
  spendCredits(20);
  identityService.demo();

  await updateMember(member!.id, { credits: 20 }, 100);

  expect(team.value.members[0]?.creditLimit).toBe(40);
  expect(memberCreditsConsumed(team.value.members[0]!)).toBe(20);
  expect(teamCreditsConsumed.value).toBe(20);
});

test('回收成员会使登录失效并解除其作品成员归属', async () => {
  const project = createProject('回收测试项目');
  const [member] = await createMembers([{ name: '待回收', identity: 'remove-me', password: 'remove-pass-123', role: 'creator', projectIds: [project.id], credits: 10 }], 100);
  studio.value.films.push({ id: 'film-1', projectId: project.id, title: '成员作品', type: '视频', source: '普通创作', createdAt: new Date().toISOString(), duration: '15', ratio: '9:16', quality: '1080P', brief: '', productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: { theme: '商品种草', product: '未分类', hook: '问题开场', scene: '日常生活', format: '产品展示', confirmed: false }, createdByMemberId: member!.id });
  await identityService.login('remove-me', 'remove-pass-123');
  ensurePublishTask(studio.value.films[0]!);
  studio.value.jobs.push({ id: 'pending-job', projectId: project.id, status: '生成中', dueAt: Date.now() + 5000, fail: false, film: { ...studio.value.films[0]! } });
  identityService.demo();
  removeMember(member!.id);
  expect(studio.value.films[0]?.createdByMemberId).toBeUndefined();
  expect(studio.value.tasks).toHaveLength(1);
  expect(studio.value.tasks[0]?.createdByMemberId).toBeUndefined();
  expect(studio.value.jobs).toHaveLength(1);
  expect(studio.value.jobs[0]?.film.createdByMemberId).toBeUndefined();
  expect(studio.value.jobs[0]?.status).toBe('生成中');
  await expect(identityService.login('remove-me', 'remove-pass-123')).rejects.toThrow('帐号或密码不正确');
});
