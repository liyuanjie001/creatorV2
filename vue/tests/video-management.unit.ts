import { beforeEach, expect, test } from 'vitest';
import { currentUser, identityService } from '@/services/identity';
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
  ensureDemoProjectContent,
} from '@/services/studio';
import { videoRows, metrics, duration, publishReason, mediaTypeName, workPublishStatus, videoActions, latestSubmittedTask } from '@/services/videoManagement';
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
test('作品类型区分视频与图集', () => {
  const { p, film } = setup();
  const rows = videoRows(studio.value, p.id, false);
  expect(mediaTypeName(rows[0]!)).toBe('视频');
  film.type = '图文';
  expect(mediaTypeName(videoRows(studio.value, p.id, false)[0]!)).toBe('图集');
});
test('作品发布状态映射到筛选项，发布任务状态不泄漏待配置与已取消', () => {
  const { p, task } = setup();
  const row = videoRows(studio.value, p.id, false)[0]!;
  expect(workPublishStatus(row)).toBe('未发布');
  task.status = '已排期';
  expect(workPublishStatus({ ...row, publishStatus: task.status })).toBe('定时发布');
  task.status = '发布失败';
  expect(workPublishStatus({ ...row, publishStatus: task.status })).toBe('发布失败');
  task.status = '发布成功';
  expect(workPublishStatus({ ...row, publishStatus: task.status })).toBe('发布成功');
  const publishedRow = { ...row, task: undefined, content: external(p.id), publishStatus: '发布成功' };
  expect(workPublishStatus(publishedRow)).toBe('发布成功');
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
  expect(row.content).toBeDefined();
  expect(row.publishStatus).toBe('发布成功');
});


test('最新提交结果忽略草稿与更新时间，取消未提交草稿不覆盖成功历史', () => {
  const { p, film, task } = setup();
  Object.assign(task, {status:'发布成功',submittedAt:'2026-11-01T00:00:00Z',updatedAt:'2099-01-01T00:00:00Z'});
  const draft = ensurePublishTask(film);
  expect(videoRows(studio.value,p.id,false)[0]!.publishStatus).toBe('发布成功');
  expect(videoActions(studio.value,videoRows(studio.value,p.id,false)[0]!,false).find(a=>a.id==='publish')?.label).toBe('再次发布');
  Object.assign(draft,{status:'发布失败',submittedAt:'2026-11-02T00:00:00Z'});
  expect(latestSubmittedTask(studio.value.tasks)?.id).toBe(draft.id);
  expect(videoRows(studio.value,p.id,false)[0]!.publishStatus).toBe('发布失败');
  expect(videoActions(studio.value,videoRows(studio.value,p.id,false)[0]!,false).find(a=>a.id==='publish')?.label).toBe('重新配置');
  expect(ensurePublishTask(film,draft.id).id).toBe(draft.id);
});

test('状态操作矩阵：排队、失败、上传、缺失媒体、排期、归档及外部内容', () => {
  const {p,film,task} = setup();
  const row = () => videoRows(studio.value,p.id,false)[0]!;
  const actions = (published=false,missing=false) => videoActions(studio.value,row(),published,missing);
  expect(actions().map(a=>a.id)).toEqual(['publish','download','regenerate','modify','delete']);
  film.source='本地上传';
  expect(actions().some(a=>a.id==='modify'||a.id==='regenerate')).toBe(false);
  expect(actions().find(a=>a.id==='publish')?.reason).toContain('媒体');
  film.source='普通创作';
  expect(actions(false,true).find(a=>a.id==='download')?.reason).toContain('媒体');
  task.status='已排期';task.submittedAt=new Date().toISOString();
  expect(actions().filter(a=>a.primary).map(a=>a.id)).toEqual(['reschedule']);
  expect(actions().find(a=>a.id==='publish')?.reason).toContain('执行中');
  expect(actions(true).some(a=>a.id==='delete')).toBe(false);
  task.status='发布中';
  expect(actions().find(a=>a.id==='delete')?.reason).toContain('正在发布');
  p.archived=true;
  expect(actions().filter(a=>a.id!=='download').every(a=>!!a.reason)).toBe(true);
  p.archived=false;
  const job=startGeneration({...film});job.status='等待中';
  const queued=videoRows(studio.value,p.id,false).find(r=>r.job)!;
  expect(queued.generation).toBe('生成中');
  expect(videoActions(studio.value,queued,false).map(a=>a.id)).toEqual(['delete']);
  expect(videoActions(studio.value,queued,false)[0]!.reason).toContain('生成中');
  job.status='生成失败';
  const failed=videoRows(studio.value,p.id,false).find(r=>r.job)!;
  expect(videoActions(studio.value,failed,false).map(a=>a.id)).toEqual(['retry','modify','delete']);
  const c=external(p.id);studio.value.content.push(c);
  const ext=videoRows(studio.value,p.id,false).find(r=>r.content?.id===c.id)!;
  expect(workPublishStatus(ext)).toBe('发布成功');
  expect(videoActions(studio.value,ext,true).find(a=>a.id==='publish')?.reason).toBeTruthy();
  expect(videoActions(studio.value,ext,true).find(a=>a.id==='analytics')?.reason).toBe('');
});

test('默认示例覆盖所有状态、保持稳定且删除后不补回，普通用户不注入', async () => {
  studio.value.projects=[{id:'P1',name:'演示',desc:'',color:'#000',accountIds:[],archived:false}];
  authorize('@demo_examples','ungrouped','成功');
  studio.value.videoExamplesVersion=undefined;
  await ensureDemoProjectContent('P1');
  const works=videoRows(studio.value,'P1',false);
  expect(new Set(works.map(r=>r.generation))).toEqual(new Set(['生成成功','生成中','生成失败']));
  expect(new Set(works.map(workPublishStatus))).toEqual(new Set(['未发布','待发布','定时发布','发布中','发布成功','发布失败','已取消']));
  const statuses=studio.value.tasks.map(t=>t.status);
  await tickStudio(Date.now()+864000000);
  expect(studio.value.tasks.map(t=>t.status)).toEqual(statuses);
  studio.value.films=studio.value.films.filter(f=>f.id!=='video-v2-0');
  await ensureDemoProjectContent('P1');
  expect(studio.value.films.some(f=>f.id==='video-v2-0')).toBe(false);
});


test('成功记录再次发布不复用其他失败历史；取消未提交草稿不进入发布记录', () => {
  const {p,film,task}=setup();
  Object.assign(task,{status:'发布成功',submittedAt:'2026-11-01T00:00:00Z',attempt:1});
  const failed=ensurePublishTask(film);
  Object.assign(failed,{status:'发布失败',submittedAt:'2026-11-02T00:00:00Z',attempt:1});
  const next=ensurePublishTask(film,'new');
  expect(next.id).not.toBe(failed.id);
  next.status='已取消';
  expect(latestSubmittedTask(studio.value.tasks)?.id).toBe(failed.id);
  expect(videoRows(studio.value,p.id,true).map(row=>row.task?.id)).not.toContain(next.id);
});

test('普通注册帐号不注入示例',async()=>{
  currentUser.value={id:'ordinary-user',name:'普通用户',identity:'user@example.com',method:'email',bindings:['email']};
  studio.value.projects=[{id:'P1',name:'普通项目',desc:'',color:'#000',accountIds:[],archived:false}];
  authorize('@ordinary_user','ungrouped','成功');
  await ensureDemoProjectContent('P1');
  expect(studio.value.films).toHaveLength(0);
  expect(studio.value.tasks).toHaveLength(0);
  expect(studio.value.videoExamplesVersion).toBeUndefined();
});
