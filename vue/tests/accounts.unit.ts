import { beforeEach, expect, test } from 'vitest';
import { identityService } from '@/services/identity';
import { studio, authorize, createProject, deleteAccount, accountDeleteReason, ensurePublishTask, reorderGroup, blankAttributes, submitPublish } from '@/services/studio';
import type { Film } from '@/types/studio';
beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  Object.assign(studio.value, {
    projects: [],
    accounts: [],
    groups: [{ id: 'ungrouped', name: '未分组' }],
    films: [],
    jobs: [],
    tasks: [],
    content: [],
  });
});
function setup() {
  const p = createProject('回归项目'),
    a = authorize('@brand', 'ungrouped', '成功');
  p.accountIds = [a.id];
  const f: Film = {
    id: 'film',
    projectId: p.id,
    title: '测试成片',
    type: '视频',
    source: '普通创作',
    createdAt: '2026-11-05T00:00:00Z',
    duration: '15',
    ratio: '9:16',
    quality: '1080P',
    brief: '内容',
    productIds: [],
    version: 1,
    mediaIds: [],
    inPublishing: false,
    attributes: blankAttributes(),
  };
  studio.value.films.push(f);
  const t = ensurePublishTask(f);
  t.accountId = a.id;
  return { p, a, f, t };
}
test('删除帐号取消待执行任务、解除项目关联，保留历史身份；重新授权不恢复任务', () => {
  const { p, a, t } = setup();
  t.status = '已排期';
  studio.value.tasks.push(
    { ...t, id: 'pending', status: '待发布' },
    { ...t, id: 'success', status: '发布成功' },
  );
  deleteAccount(a.id);
  expect(studio.value.accounts[0]).toMatchObject({ id: a.id, deleted: true, handle: '@brand' });
  expect(studio.value.tasks.map((t) => t.status)).toEqual(['已取消', '已取消', '发布成功']);
  expect(p.accountIds).toEqual([]);
  expect(authorize('@brand', 'ungrouped', '成功')).toMatchObject({ id: a.id, deleted: false });
  expect(studio.value.tasks[0]?.status).toBe('已取消');
});
test('发布中拒绝删除帐号，所有状态保持原样', () => {
  const { p, a, t } = setup();
  t.status = '发布中';
  expect(accountDeleteReason(a.id)).toContain('正在发布');
  expect(() => deleteAccount(a.id)).toThrow('正在发布');
  expect(a.deleted).toBeFalsy();
  expect(p.accountIds).toEqual([a.id]);
});
test('分组顺序可移动默认分组并持久化', () => {
  studio.value.groups.push({ id: 'a', name: '品牌' }, { id: 'b', name: '创作者' });
  reorderGroup('ungrouped', 'b');
  expect(studio.value.groups.map((g) => g.id)).toEqual(['a', 'b', 'ungrouped']);
  expect(
    JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).groups.map((g: { id: string }) => g.id),
  ).toEqual(['a', 'b', 'ungrouped']);
});
test('帐号删除后阻止旧草稿提交', async () => {
  const { a, t } = setup();
  deleteAccount(a.id);
  await expect(submitPublish([t])).rejects.toThrow('帐号');
});
