import { File as NodeFile } from 'node:buffer';
import { beforeEach, expect, test, vi } from 'vitest';
import { currentUser, identityService } from '@/services/identity';
import { studio, createProject } from '@/services/studio';
import { creditsBalance, spendCredits } from '@/services/credits';
import { createMembers, removeMember, team, visibleAccountIds, visibleProjectIds } from '@/services/team';

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
  studio.value.projects = [];
  studio.value.accounts = [];
  studio.value.films = [];
  studio.value.tasks = [];
  team.value = { ownerId: 'demo', members: [], updatedAt: new Date().toISOString() };
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
  await createMembers([{ name: '创作者', identity: 'writer', password: 'writer-pass-123', role: 'creator', credits: 30 }], 100);
  identityService.logout();
  await identityService.login('writer', 'writer-pass-123');
  spendCredits(20);
  expect(creditsBalance.value).toBe(10);
  expect(team.value.members[0]?.credits).toBe(10);
});

test('回收成员会使登录失效并解除其作品成员归属', async () => {
  const project = createProject('回收测试项目');
  const [member] = await createMembers([{ name: '待回收', identity: 'remove-me', password: 'remove-pass-123', role: 'creator', projectIds: [project.id], credits: 10 }], 100);
  studio.value.films.push({ id: 'film-1', projectId: project.id, title: '成员作品', type: '视频', source: '普通创作', createdAt: new Date().toISOString(), duration: '15', ratio: '9:16', quality: '1080P', brief: '', productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: { theme: '商品种草', product: '未分类', hook: '问题开场', scene: '日常生活', format: '产品展示', confirmed: false }, createdByMemberId: member!.id });
  identityService.demo();
  removeMember(member!.id);
  expect(studio.value.films[0]?.createdByMemberId).toBeUndefined();
  await expect(identityService.login('remove-me', 'remove-pass-123')).rejects.toThrow('帐号或密码不正确');
});
