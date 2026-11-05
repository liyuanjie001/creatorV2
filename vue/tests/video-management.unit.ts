import { beforeEach, expect, test } from 'vitest';
import { identityService } from '@/services/identity';
import {
  studio,
  createProject,
  authorize,
  blankAttributes,
  ensurePublishTask,
  submitPublish,
  tickStudio,
  cancelPublishTask,
  reschedulePublishTask,
  startGeneration,
  validatePublish,
} from '@/services/studio';
import { videoRows, metrics, duration, publishReason } from '@/services/videoManagement';
import type { Film, PlatformContent } from '@/types/studio';
beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  studio.value.projects = [];
  studio.value.accounts = [];
  studio.value.films = [];
  studio.value.tasks = [];
  studio.value.content = [];
  studio.value.jobs = [];
});
function setup() {
  const p = createProject('视频测试');
  const a = authorize('@video_test', 'ungrouped', '成功');
  p.accountIds = [a.id];
  const film: Film = {
    id: 'film',
    projectId: p.id,
    title: '完整的商品视频测试名称',
    type: '视频',
    source: '普通创作',
    createdAt: new Date().toISOString(),
    duration: '15',
    ratio: '9:16',
    quality: '1080P',
    brief: '提示词',
    productIds: [],
    version: 1,
    mediaIds: [],
    inPublishing: true,
    attributes: blankAttributes(),
  };
  studio.value.films.push(film);
  const task = ensurePublishTask(film);
  task.accountId = a.id;
  return { p, film, task };
}
function external(projectId: string): PlatformContent {
  return {
    id: 'external',
    accountId: 'a',
    projectIds: [projectId],
    title: '外部视频',
    type: '视频',
    publishedAt: new Date().toISOString(),
    attributes: blankAttributes(),
    snapshots: [],
    collection: '未采集',
  };
}
test('全部按视频去重，已发布按独立任务展示，保留外部内容与生成任务', () => {
  const { p, film, task } = setup();
  task.status = '发布成功';
  const next = ensurePublishTask(film);
  next.status = '待发布';
  const c = external(p.id);
  studio.value.content = [c, { ...c, id: 'own', filmId: film.id }];
  task.platformId = 'own';
  startGeneration({ ...film, title: '排队创作' });
  expect(videoRows(studio.value, p.id, false)).toHaveLength(3);
  expect(videoRows(studio.value, p.id, false).find((r) => r.film?.id === film.id)?.id).toBe(film.id);
  expect(videoRows(studio.value, p.id, true)).toHaveLength(3);
  studio.value.films = [];
  expect(videoRows(studio.value, p.id, true).filter((r) => r.task)).toHaveLength(2);
});
test('图文发布必须保留至少一张图片，且可选 BGM 不影响发布配置', () => {
  const { film, task } = setup();
  film.type = '图文';
  film.mediaIds = [];
  task.imageMediaIds = [];
  expect(() => validatePublish(task)).toThrow('图文作品至少需要一张图片');
  task.imageMediaIds = ['image-id'];
  task.bgm = undefined;
  expect(() => validatePublish(task)).not.toThrow();
});
test('真实零指标与未发布、无权限指标区分，时长统一格式', () => {
  const { p, task } = setup();
  const c = external(p.id);
  c.collection = '可用';
  c.snapshots = [{ date: '2026-11-04', views: 0, likes: 0, comments: 0, shares: 0 }];
  studio.value.content = [c];
  task.platformId = c.id;
  task.status = '发布成功';
  expect(metrics(videoRows(studio.value, p.id, true)[0]!)?.views).toBe(0);
  task.status = '发布中';
  expect(metrics(videoRows(studio.value, p.id, true)[0]!)).toBeUndefined();
  task.status = '发布成功';
  c.collection = '无权限';
  expect(metrics(videoRows(studio.value, p.id, true)[0]!)).toBeUndefined();
  expect(duration('15')).toBe('00:15');
  expect(duration('75')).toBe('01:15');
});
test('再次发布创建新任务，保留历史与实际发布时间，阻止并发提交', async () => {
  const { p, film, task } = setup();
  await submitPublish([task]);
  expect(publishReason(studio.value, videoRows(studio.value, p.id, false)[0]!, false)).toContain('执行中');
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 7000);
  expect(task.status).toBe('发布成功');
  expect(task.publishedAt).toBeTruthy();
  const next = ensurePublishTask(film);
  expect(next.id).not.toBe(task.id);
  next.accountId = task.accountId;
  await submitPublish([next]);
  await expect(submitPublish([next])).rejects.toThrow('重复发布');
  expect(studio.value.tasks).toHaveLength(2);
  expect(task.status).toBe('发布成功');
  expect(videoRows(studio.value, p.id, true)).toHaveLength(2);
});
test('排期支持调整与取消，取消后新建任务保留取消历史', async () => {
  const { task, film } = setup();
  task.scheduledAt = new Date(Date.now() + 3600000).toISOString();
  await submitPublish([task]);
  const changed = new Date(Date.now() + 7200000).toISOString();
  reschedulePublishTask(task.id, changed);
  expect(task.scheduledAt).toBe(changed);
  expect(() => reschedulePublishTask(task.id, new Date(0).toISOString())).toThrow();
  cancelPublishTask(task.id);
  expect(task.status).toBe('已取消');
  const next = ensurePublishTask(film);
  expect(next.id).not.toBe(task.id);
  next.accountId = task.accountId;
  await submitPublish([next]);
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 7000);
  expect(next.status).toBe('发布成功');
  expect(task.status).toBe('已取消');
  expect(() => cancelPublishTask(next.id)).toThrow();
});
test('拒绝同一视频的两个草稿同时提交和无媒体本地上传', async () => {
  const { film, task } = setup();
  const duplicate = { ...task, id: 'duplicate' };
  studio.value.tasks.push(duplicate);
  await expect(submitPublish([task, duplicate])).rejects.toThrow('执行中');
  expect(task.status).toBe('待配置');
  film.source = '本地上传';
  await expect(submitPublish([task])).rejects.toThrow('媒体已丢失');
});

test('失败重试保留任务，旧成功任务不被新草稿借用实际发布时间', async () => {
  const { p, film, task } = setup();
  task.simulateFailure = true;
  await submitPublish([task]);
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 7000);
  expect(task.status).toBe('发布失败');
  await submitPublish([task]);
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 7000);
  expect(task.status).toBe('发布成功');
  expect(studio.value.tasks).toHaveLength(1);
  const draft = ensurePublishTask(film);
  expect(draft.publishedAt).toBeUndefined();
  const row = videoRows(studio.value, p.id, false).find((r) => r.film?.id === film.id)!;
  expect(row.content?.filmId).toBe(film.id);
  expect(row.publishStatus).toBe('发布成功');
});
