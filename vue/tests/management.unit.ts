import { beforeEach, expect, test } from 'vitest';
import { identityService } from '@/services/identity';
import {
  studio,
  authorize,
  createProject,
  deleteAccount,
  accountDeleteReason,
  ensurePublishTask,
  reorderGroup,
  tickStudio,
  cancelPublishTask,
  reschedulePublishTask,
  submitPublish,
} from '@/services/studio';
import { blankAttributes } from '@/services/studio';
import { videoRows, videoActions, hideWorks, metrics } from '@/services/videoManagement';
import { upgradeManagementExamples, MANAGEMENT_EXAMPLES_VERSION } from '@/services/managementExamples';
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
    hiddenWorkIds: {},
    managementExamplesVersion: undefined,
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
test('成功后的草稿不覆盖状态、实际时间或再次发布文案', () => {
  const { p, f, t } = setup();
  t.status = '发布成功';
  t.submittedAt = '2026-11-04T00:00:00Z';
  t.publishedAt = t.submittedAt;
  const draft = ensurePublishTask(f);
  draft.createdAt = '2026-11-05T00:00:00Z';
  const row = videoRows(studio.value, p.id, false)[0]!;
  expect(row.publishStatus).toBe('发布成功');
  expect(row.task?.id).toBe(t.id);
  expect(draft.publishedAt).toBeUndefined();
  expect(videoActions(studio.value, row, { published: false, archived: false })[0]?.label).toBe('再次发布');
});
test.each([
  ['未发布', '去发布'],
  ['发布成功', '再次发布'],
  ['发布失败', '重新配置'],
  ['已取消', '去发布'],
  ['待发布', '取消发布'],
  ['已排期', '改期'],
  ['发布中', undefined],
] as const)('状态 %s 的主要操作为 %s', (status, label) => {
  const { p, t } = setup();
  if (status === '未发布') t.status = '待配置';
  else t.status = status;
  const row = videoRows(studio.value, p.id, false)[0]!;
  expect(
    videoActions(studio.value, row, { published: false, archived: false }).find((a) => a.primary)?.label,
  ).toBe(label);
});
test('失败新任务保留曾成功标志，不借用旧任务指标', () => {
  const { p, t } = setup();
  t.status = '发布成功';
  t.submittedAt = '2026-11-04T00:00:00Z';
  studio.value.content.push({
    id: 'old',
    filmId: t.filmId,
    projectIds: [p.id],
    accountId: t.accountId,
    title: '旧内容',
    type: '视频',
    publishedAt: t.submittedAt,
    attributes: blankAttributes(),
    collection: '可用',
    snapshots: [{ date: '2026-11-04', views: 99, likes: 1, comments: 0, shares: 0 }],
  });
  t.platformId = 'old';
  studio.value.tasks.push({
    ...t,
    id: 'new',
    status: '发布失败',
    platformId: undefined,
    publishedAt: undefined,
    submittedAt: '2026-11-05T00:00:00Z',
  });
  const row = videoRows(studio.value, p.id, false)[0]!;
  expect(row.everPublished).toBe(true);
  expect(row.publishStatus).toBe('发布失败');
  expect(metrics(row)).toBeUndefined();
  expect(row.content).toBeUndefined();
});
test('隐藏作品不删除媒体、记录、内容或分析关联，执行中禁止移除', () => {
  const { p, t } = setup();
  t.status = '已排期';
  const row = videoRows(studio.value, p.id, false)[0]!;
  expect(() => hideWorks(studio.value, p.id, [row])).toThrow('执行中');
  t.status = '发布成功';
  hideWorks(studio.value, p.id, videoRows(studio.value, p.id, false));
  expect(videoRows(studio.value, p.id, false)).toHaveLength(0);
  expect(videoRows(studio.value, p.id, true)).toHaveLength(1);
  expect(studio.value.films).toHaveLength(1);
  expect(studio.value.tasks).toHaveLength(1);
  expect(
    videoActions(studio.value, videoRows(studio.value, p.id, true)[0]!, {
      published: true,
      archived: false,
    }).some((a) => a.key === 'delete'),
  ).toBe(false);
});
test('媒体缺失禁止图文发布及下载；本地上传不提供重新生成或修改', () => {
  const { p, f } = setup();
  f.source = '本地上传';
  f.type = '图文';
  const actions = videoActions(studio.value, videoRows(studio.value, p.id, false)[0]!, {
    published: false,
    archived: false,
    missing: true,
  });
  expect(actions.find((a) => a.key === 'publish')?.reason).toContain('媒体');
  expect(actions.find((a) => a.key === 'download')?.reason).toContain('媒体');
  expect(actions.some((a) => ['regenerate', 'modify'].includes(a.key))).toBe(false);
});
test('示例升级完整覆盖状态、保持固定、幂等且不复活已隐藏作品', async () => {
  const { p, a } = setup();
  p.id = 'P1';
  a.id = 'tk-glow';
  p.accountIds = ['tk-glow'];
  upgradeManagementExamples(studio.value);
  expect(studio.value.managementExamplesVersion).toBe(MANAGEMENT_EXAMPLES_VERSION);
  const statuses = videoRows(studio.value, 'P1', false).map((r) => r.publishStatus);
  for (const status of ['未发布', '发布成功', '发布失败', '已取消', '待发布', '已排期', '发布中'])
    expect(statuses).toContain(status);
  const count = studio.value.films.length;
  const pending = studio.value.tasks.find((t) => t.status === '待发布')!;
  await tickStudio(Date.now() + 9999999);
  expect(pending.status).toBe('待发布');
  const photo = videoRows(studio.value, 'P1', false).find((r) => r.film?.id === 'management-photo')!;
  hideWorks(studio.value, 'P1', [photo]);
  upgradeManagementExamples(studio.value);
  expect(studio.value.films).toHaveLength(count);
  expect(videoRows(studio.value, 'P1', false).some((r) => r.id === photo.id)).toBe(false);
  cancelPublishTask(pending.id);
  expect(pending.demoPreview).toBe(false);
  const scheduled = studio.value.tasks.find((t) => t.status === '已排期')!;
  reschedulePublishTask(scheduled.id, new Date(Date.now() + 86400000).toISOString());
  expect(scheduled.demoPreview).toBe(false);
});
test('新用户工作区不添加演示示例', () => {
  setup();
  upgradeManagementExamples(studio.value);
  expect(studio.value.managementExamplesVersion).toBeUndefined();
});
test('帐号删除后阻止旧草稿提交', async () => {
  const { a, t } = setup();
  deleteAccount(a.id);
  await expect(submitPublish([t])).rejects.toThrow('帐号');
});
test.each(['生成失败', '已取消', '等待中', '生成中'] as const)(
  '生成 %s 在详情和菜单使用相同可用操作',
  (status) => {
    const { p, f } = setup();
    studio.value.films = [];
    studio.value.jobs = [{ id: 'job', projectId: p.id, status, dueAt: 0, fail: false, film: f }];
    const row = videoRows(studio.value, p.id, false)[0]!;
    const actions = videoActions(studio.value, row, { published: false, archived: false });
    expect(actions.some((a) => a.key === 'retry')).toBe(['生成失败', '已取消'].includes(status));
    expect(!!actions.find((a) => a.key === 'delete')?.reason).toBe(['等待中', '生成中'].includes(status));
  },
);

test('再次发布不复用早于最近成功的失败任务', () => {
  const { f, t } = setup();
  t.status = '发布失败';
  t.submittedAt = '2026-11-03T00:00:00Z';
  studio.value.tasks.push({
    ...t,
    id: 'latest-success',
    status: '发布成功',
    submittedAt: '2026-11-04T00:00:00Z',
  });
  const draft = ensurePublishTask(f);
  expect(draft.status).toBe('待配置');
  expect(draft.id).not.toBe(t.id);
  expect(t.status).toBe('发布失败');
});
