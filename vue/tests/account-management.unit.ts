import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { identityService, currentUser } from '@/services/identity';
import {
  studio,
  authorize,
  createProject,
  saveAccountGroup,
  removeAccountGroup,
  moveAccountsToGroup,
  saveAccountNote,
  reorderGroup,
  syncAccountData,
  refreshAccounts,
  ensurePublishTask,
  validatePublish,
  blankAttributes,
} from '@/services/studio';
import {
  accountOverview,
  matchesAuthorization,
  addYouTubeExample,
  accountHomepage,
} from '@/services/accountManagement';
import { supportsPublishing } from '@/services/accounts';
import { normalizeClaimItems } from '@/services/credits';
import type { AccountClaimItem } from '@/services/credits';
import type { Film, TKAccount } from '@/types/studio';

beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  Object.assign(studio.value, {
    accounts: [],
    groups: [{ id: 'ungrouped', name: '未分组' }],
    tasks: [],
    content: [],
    films: [],
    projects: [],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const snapshot = () => JSON.stringify(studio.value);

test('分组创建校验、重命名、批量移组及删除回退，历史记录不变', () => {
  const first = authorize('@first', 'ungrouped', '成功');
  const second = authorize('@second', 'ungrouped', '成功');
  const group = saveAccountGroup('  品牌团队  ');
  expect(group.name).toBe('品牌团队');
  expect(() => saveAccountGroup('品牌团队')).toThrow('已存在');
  expect(() => saveAccountGroup(' ')).toThrow('1—30');
  expect(() => saveAccountGroup('字'.repeat(31))).toThrow('1—30');
  expect(() => saveAccountGroup('修改', 'ungrouped')).toThrow('不可重命名');
  expect(() => removeAccountGroup('ungrouped')).toThrow('不可删除');
  saveAccountGroup('运营团队', group.id);
  moveAccountsToGroup([first.id, second.id], group.id);
  saveAccountNote(first.id, '  优先发布  ');
  expect(studio.value.accounts.every((a) => a.groupId === group.id)).toBe(true);
  const records = JSON.stringify(studio.value.tasks);
  removeAccountGroup(group.id);
  expect(studio.value.accounts.every((a) => a.groupId === 'ungrouped')).toBe(true);
  expect(studio.value.accounts.find((a) => a.id === first.id)?.note).toBe('优先发布');
  expect(JSON.stringify(studio.value.tasks)).toBe(records);
  expect(JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).groups).toHaveLength(1);
});

test('分组保存、排序、移组和备注存储失败不修改工作区', () => {
  const account = authorize('@brand', 'ungrouped', '成功');
  const group = saveAccountGroup('品牌');
  const before = snapshot();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  for (const operation of [
    () => saveAccountGroup('新分组'),
    () => removeAccountGroup(group.id),
    () => moveAccountsToGroup([account.id], group.id),
    () => reorderGroup(group.id, 'ungrouped'),
    () => saveAccountNote(account.id, '备注'),
  ]) {
    expect(operation).toThrow('保存失败');
    expect(snapshot()).toBe(before);
  }
});

test('统计使用最新快照，发布记录去重、保留零值并标记部分数据', () => {
  const account = authorize('@brand', 'ungrouped', '成功');
  const content = {
    id: 'content',
    accountId: account.id,
    projectIds: [],
    title: '作品',
    type: '视频' as const,
    publishedAt: '2026-11-18',
    attributes: blankAttributes(),
    collection: '可用' as const,
    snapshots: [
      { date: '2026-11-01', views: 30, likes: 1, comments: 0, shares: 0 },
      { date: '2026-11-18', views: 0, likes: 0, comments: 0, shares: 0 },
    ],
  };
  studio.value.content.push(content, { ...content, id: 'missing', publishedAt: '2026-11-19', snapshots: [] });
  const project = createProject('项目');
  const film = {
    id: 'film',
    projectId: project.id,
    title: '作品',
    type: '视频',
    source: '普通创作',
    mediaIds: [],
  } as unknown as Film;
  const task = ensurePublishTask(film);
  Object.assign(task, {
    accountId: account.id,
    status: '发布成功',
    platformId: 'content',
    publishedAt: '2026-11-18',
  });
  studio.value.tasks.push({ ...task, id: 'duplicate' });
  expect(accountOverview(studio.value, account.id)).toEqual({
    works: 2,
    latest: '2026-11-19',
    views: 0,
    partial: true,
  });
  expect(accountOverview(studio.value, 'missing')).toEqual({
    works: 0,
    latest: undefined,
    views: undefined,
    partial: false,
  });
});

test('授权状态筛选保留旧在线和登录过期链接含义', () => {
  const account = authorize('@brand', 'ungrouped', '成功');
  expect(matchesAuthorization(account, '在线')).toBe(true);
  for (const status of ['权限不足', '已解绑', '授权过期'] as const) {
    const invalid = { ...account, status };
    expect(matchesAuthorization(invalid, '登录过期')).toBe(true);
    expect(matchesAuthorization(invalid, status)).toBe(true);
    expect(matchesAuthorization(invalid, '已授权')).toBe(false);
  }
});

test('同步补齐缺失值但保留零值，重复同步不增加作品或累计指标', async () => {
  vi.useFakeTimers();
  const account = authorize('@brand', 'ungrouped', '成功');
  Object.assign(studio.value.accounts[0]!, { statistics: { likes: 0 } });
  const pending = syncAccountData(account.id);
  await syncAccountData(account.id);
  await vi.runAllTimersAsync();
  await pending;
  const first = JSON.parse(snapshot()).accounts[0];
  expect(first.statistics.likes).toBe(0);
  expect(first.statistics.followers).toBeGreaterThan(0);
  const again = syncAccountData(account.id);
  await vi.runAllTimersAsync();
  await again;
  expect(studio.value.accounts[0]?.statistics).toEqual(first.statistics);
  expect(studio.value.content).toEqual([]);
  expect(studio.value.accounts[0]?.dataUpdatedAt).toBeDefined();
});

test('同步写入失败保留原值，可重试；未授权拒绝同步', async () => {
  vi.useFakeTimers();
  const account = authorize('@brand', 'ungrouped', '成功');
  const before = snapshot();
  const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  const pending = expect(syncAccountData(account.id)).rejects.toThrow('保存失败');
  await vi.runAllTimersAsync();
  await pending;
  expect(snapshot()).toBe(before);
  storage.mockRestore();
  const retry = syncAccountData(account.id);
  await vi.runAllTimersAsync();
  await retry;
  expect(studio.value.accounts[0]?.dataUpdatedAt).toBeDefined();
  studio.value.accounts[0]!.status = '权限不足';
  await expect(syncAccountData(account.id)).rejects.toThrow('请先授权');
});

test('同步期间切换用户不会将旧账号写入新用户', async () => {
  vi.useFakeTimers();
  const account = authorize('@brand', 'ungrouped', '成功');
  const pending = expect(syncAccountData(account.id)).rejects.toThrow('已切换');
  currentUser.value = {
    id: 'other',
    name: '其他用户',
    identity: 'other@example.com',
    method: 'email',
    bindings: ['email'],
  };
  await vi.runAllTimersAsync();
  await pending;
  expect(studio.value.accounts).toEqual([]);
  expect(localStorage.getItem('chuhai-studio-v1:other')).not.toContain('@brand');
});

test('刷新只读取保存值，读取失败保留当前数据', () => {
  authorize('@brand', 'ungrouped', '成功');
  const saved = JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!);
  saved.accounts[0].statistics = { likes: 0 };
  localStorage.setItem('chuhai-studio-v1:demo', JSON.stringify(saved));
  refreshAccounts();
  expect(studio.value.accounts[0]?.statistics?.likes).toBe(0);
  const before = snapshot();
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error('denied');
  });
  expect(refreshAccounts).toThrow('读取本地数据失败');
  expect(snapshot()).toBe(before);
});

test('YouTube 示例只升级一次，编辑和软删除不恢复，新授权保存一年期限', () => {
  delete studio.value.youtubeExampleAdded;
  addYouTubeExample(studio.value, 'other');
  expect(studio.value.accounts).toHaveLength(0);
  addYouTubeExample(studio.value, 'demo');
  const account = studio.value.accounts[0]!;
  expect(account.authorizationExpiresAt).toBeUndefined();
  account.deleted = true;
  account.note = '编辑过';
  addYouTubeExample(studio.value, 'demo');
  expect(studio.value.accounts).toHaveLength(1);
  expect(studio.value.accounts[0]).toMatchObject({ deleted: true, note: '编辑过' });
  const fresh = authorize('@new.youtube', 'ungrouped', '成功', 'youtube');
  const expiry = new Date(fresh.authorizationExpiresAt!);
  expect(expiry.getFullYear()).toBe(new Date(fresh.authorizedAt).getFullYear() + 1);
  expect(accountHomepage(fresh)).toBe('https://www.youtube.com/@new.youtube');
});

test('YouTube 可管理但不能发布或用于历史领取', () => {
  const account = authorize('@brand', 'ungrouped', '成功', 'youtube');
  expect(supportsPublishing(account as TKAccount)).toBe(false);
  const project = createProject('项目');
  project.accountIds.push(account.id);
  const film = {
    id: 'film',
    projectId: project.id,
    title: '作品',
    type: '视频',
    source: '普通创作',
    mediaIds: [],
  } as unknown as Film;
  studio.value.films.push(film);
  const task = ensurePublishTask(film);
  task.accountId = account.id;
  expect(() => validatePublish(task)).toThrow('YouTube 暂不支持发布');
  expect(() =>
    normalizeClaimItems([
      { platform: 'youtube', countryCode: 'US', quantity: 1 },
    ] as unknown as AccountClaimItem[]),
  ).toThrow('有效的社媒平台');
});
