import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { identityService, currentUser } from '@/services/identity';
import {
  studio,
  createProject,
  authorize,
  ensurePublishTask,
  blankAttributes,
  submitPublish,
  tickStudio,
  reschedulePublishTask,
  cancelPublishTask,
} from '@/services/studio';
import { addPlatformExamples, migratePublishing, publishCaption, accountPlatform } from '@/services/accounts';
import {
  categorizedVideoRows,
  accountVideoRows,
  videoActions,
  workPublishStatus,
} from '@/services/videoManagement';
import { scheduleCandidates, localDateTime, formatSchedule, localTimeZone } from '@/services/timeZones';
import SchedulePicker from '@/components/studio/SchedulePicker.vue';
import type { Film, SocialPlatform, TKAccount } from '@/types/studio';

beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  Object.assign(studio.value, {
    projects: [],
    accounts: [],
    films: [],
    tasks: [],
    content: [],
    jobs: [],
    platformExamplesAdded: undefined,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});
function setup() {
  const project = createProject('跨平台测试');
  const accounts = (['tiktok', 'facebook', 'instagram'] as SocialPlatform[]).map((p) =>
    authorize('@same_brand', 'ungrouped', '成功', p),
  );
  project.accountIds = accounts.map((a) => a.id);
  const film: Film = {
    id: 'work',
    projectId: project.id,
    title: '独立作品标题',
    type: '视频',
    source: '普通创作',
    createdAt: new Date().toISOString(),
    duration: '15',
    ratio: '9:16',
    quality: '1080P',
    brief: '示例',
    productIds: [],
    version: 1,
    mediaIds: [],
    inPublishing: true,
    attributes: blankAttributes(),
  };
  studio.value.films.push(film);
  return { project, film, accounts };
}
function taskFor(film: Film, accountId: string) {
  const task = ensurePublishTask(film, undefined, true);
  task.accountId = accountId;
  return task;
}

test('旧平台、文案和时区升级幂等，空文案不会恢复旧标签', () => {
  const { film, accounts } = setup(),
    task = taskFor(film, accounts[0]!.id);
  const legacy: TKAccount = accounts[0]!;
  delete legacy.platform;
  delete task.caption;
  delete task.timeZone;
  task.title = '旧正文';
  task.tags = '#旧标签';
  migratePublishing(studio.value);
  migratePublishing(studio.value);
  expect(accountPlatform(accounts[0])).toBe('tiktok');
  expect(task.caption).toBe('旧正文\n#旧标签');
  expect(task.timeZone).toBe('Asia/Shanghai');
  task.caption = '';
  migratePublishing(studio.value);
  expect(publishCaption(task)).toBe('');
});
test('平台内用户名去重，跨平台同名独立，重新授权不串帐号', () => {
  const { accounts } = setup();
  expect(new Set(accounts.map((a) => a.id)).size).toBe(3);
  const refreshed = authorize('@SAME_BRAND', 'ungrouped', '过期', 'facebook');
  expect(refreshed.id).toBe(accounts[1]!.id);
  expect(studio.value.accounts).toHaveLength(3);
  expect(studio.value.accounts.find((a) => a.id === accounts[0]!.id)?.status).toBe('已授权');
});
test('同作品三个帐号并行发布，内容及历史各自保留，全部仅展示一件作品', async () => {
  const { film, project, accounts } = setup();
  const tasks = accounts.map((a) => taskFor(film, a.id));
  tasks.forEach((t, i) => (t.caption = '正文 ' + i + ' #话题'));
  await submitPublish(tasks);
  expect(tasks.map((t) => t.status)).toEqual(['待发布', '待发布', '待发布']);
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 7000);
  expect(studio.value.content).toHaveLength(3);
  expect(studio.value.content.map((c) => c.title)).toEqual(
    expect.arrayContaining(['正文 0 #话题', '正文 1 #话题', '正文 2 #话题']),
  );
  expect(categorizedVideoRows(studio.value, project.id, 'all')).toHaveLength(1);
  expect(categorizedVideoRows(studio.value, project.id, 'published')).toHaveLength(3);
  for (const a of accounts) expect(accountVideoRows(studio.value, a.id)).toHaveLength(1);
  expect(film.title).toBe('独立作品标题');
});
test('同作品同帐号重复配置及执行中重复发布均拦截，其他帐号仍能配置', async () => {
  const { film, project, accounts } = setup();
  const first = taskFor(film, accounts[0]!.id),
    duplicate = taskFor(film, accounts[0]!.id);
  await expect(submitPublish([first, duplicate])).rejects.toThrow('执行中的发布任务');
  await submitPublish([first]);
  await expect(submitPublish([duplicate])).rejects.toThrow('执行中的发布任务');
  const row = categorizedVideoRows(studio.value, project.id, 'all')[0]!;
  expect(videoActions(studio.value, row, false).find((a) => a.id === 'publish')?.reason).toBe('');
  await submitPublish([taskFor(film, accounts[1]!.id)]);
  await expect(submitPublish([first])).rejects.toThrow('重复发布');
});
test('定时任务改期取消后分类正确，失败及草稿不进入已发布', async () => {
  const { film, project, accounts } = setup();
  const scheduled = taskFor(film, accounts[0]!.id);
  scheduled.timeZone = 'America/Los_Angeles';
  scheduled.scheduledAt = scheduleCandidates('2099-01-20T09:00', scheduled.timeZone)[0]!.utc;
  await submitPublish([scheduled]);
  expect(categorizedVideoRows(studio.value, project.id, 'scheduled')).toHaveLength(1);
  const utc = scheduleCandidates('2099-01-21T09:00', 'Asia/Kolkata')[0]!.utc;
  reschedulePublishTask(scheduled.id, utc, 'Asia/Kolkata');
  expect(scheduled.scheduledAt).toBe(utc);
  expect(scheduled.timeZone).toBe('Asia/Kolkata');
  cancelPublishTask(scheduled.id);
  expect(categorizedVideoRows(studio.value, project.id, 'scheduled')).toHaveLength(0);
  expect(categorizedVideoRows(studio.value, project.id, 'published')).toHaveLength(0);
  const draft = taskFor(film, accounts[1]!.id);
  draft.status = '发布失败';
  expect(workPublishStatus(categorizedVideoRows(studio.value, project.id, 'all')[0]!)).toBe('发布失败');
});
test('帐号详情包含跨项目和未关联的历史内容，不包含别的帐号或失败任务', () => {
  const { project, film, accounts } = setup();
  const task = taskFor(film, accounts[0]!.id);
  Object.assign(task, { status: '发布成功', publishedAt: '2026-11-01T10:00:00Z', platformId: 'content-one' });
  const base = {
    accountId: accounts[0]!.id,
    projectIds: [],
    type: '视频' as const,
    publishedAt: '2026-11-01T10:00:00Z',
    attributes: blankAttributes(),
    snapshots: [],
    collection: '未采集' as const,
  };
  studio.value.content.push(
    { ...base, id: 'content-one', filmId: film.id, title: '已关联' },
    { ...base, id: 'unlinked', title: '没有项目' },
    { ...base, id: 'other', accountId: accounts[1]!.id, title: '其他帐号' },
  );
  expect(accountVideoRows(studio.value, accounts[0]!.id).map((r) => r.id)).toEqual([task.id, 'unlinked']);
  expect(categorizedVideoRows(studio.value, project.id, 'published')).toHaveLength(1);
  studio.value.films = [];
  expect(accountVideoRows(studio.value, accounts[0]!.id)).toHaveLength(2);
});
test('演示平台升级只执行一次，删除后不补回，普通用户不添加', () => {
  const { project } = setup();
  project.id = 'P1';
  studio.value.accounts = [];
  studio.value.content = [];
  addPlatformExamples(studio.value, 'new-user');
  expect(studio.value.accounts).toHaveLength(0);
  addPlatformExamples(studio.value, 'demo');
  expect(studio.value.accounts).toHaveLength(2);
  studio.value.accounts.splice(0, 1);
  studio.value.content = [];
  addPlatformExamples(studio.value, 'demo');
  expect(studio.value.accounts).toHaveLength(1);
  expect(studio.value.content).toHaveLength(0);
});
test('发布、文案、时区刷新恢复并按用户隔离', async () => {
  const { project, film, accounts } = setup();
  const task = taskFor(film, accounts[2]!.id);
  task.caption = '新正文 #demo';
  task.timeZone = 'Europe/London';
  task.scheduledAt = '2099-07-01T08:00:00.000Z';
  await submitPublish([task]);
  const id = task.id;
  const user = currentUser.value!;
  currentUser.value = { ...user };
  expect(studio.value.tasks.find((t) => t.id === id)).toMatchObject({
    caption: '新正文 #demo',
    timeZone: 'Europe/London',
    status: '已排期',
  });
  currentUser.value = { ...user, id: 'other-user' };
  expect(studio.value.tasks).toHaveLength(0);
  expect(studio.value.projects.find((p) => p.id === project.id)).toBeUndefined();
  currentUser.value = { ...user };
  expect(studio.value.tasks.find((t) => t.id === id)).toBeDefined();
});
test('存储失败不提交、不改期，归档阻止新增与取消', async () => {
  const { film, project, accounts } = setup(),
    task = taskFor(film, accounts[0]!.id);
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  await expect(submitPublish([task])).rejects.toThrow('本地保存失败');
  expect(task.status).toBe('待配置');
  write.mockRestore();
  task.scheduledAt = '2099-01-01T00:00:00Z';
  await submitPublish([task]);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => reschedulePublishTask(task.id, '2099-02-01T00:00:00Z', 'UTC')).toThrow('保存失败');
  expect(task.scheduledAt).toBe('2099-01-01T00:00:00Z');
  vi.restoreAllMocks();
  project.archived = true;
  expect(() => ensurePublishTask(film, undefined, true)).toThrow('归档');
  expect(() => cancelPublishTask(task.id)).toThrow('归档');
});

test.each([
  ['Asia/Shanghai', '2099-01-01T09:00', '2099-01-01T01:00:00.000Z'],
  ['America/Los_Angeles', '2027-07-01T09:00', '2027-07-01T16:00:00.000Z'],
  ['America/New_York', '2027-01-01T09:00', '2027-01-01T14:00:00.000Z'],
  ['Europe/London', '2027-07-01T09:00', '2027-07-01T08:00:00.000Z'],
  ['Asia/Kolkata', '2099-01-01T09:00', '2099-01-01T03:30:00.000Z'],
  ['Asia/Kathmandu', '2099-01-01T09:00', '2099-01-01T03:15:00.000Z'],
])('城市时区 %s 转换与显示', (zone, local, utc) => {
  expect(scheduleCandidates(local, zone)[0]!.utc).toBe(utc);
  expect(localDateTime(utc, zone)).toBe(local);
  expect(formatSchedule(utc, zone)).toContain('GMT');
});
test.each([
  ['Asia/Shanghai', '2027-01-01T01:00:00Z', '2027-01-01 09:00 (GMT+8) 上海'],
  ['America/Los_Angeles', '2027-01-01T17:00:00Z', '2027-01-01 09:00 (GMT-8) 洛杉矶'],
  ['America/Los_Angeles', '2027-07-01T16:00:00Z', '2027-07-01 09:00 (GMT-7) 洛杉矶'],
  ['America/New_York', '2027-11-07T05:30:00Z', '2027-11-07 01:30 (GMT-4) 纽约'],
  ['America/New_York', '2027-11-07T06:30:00Z', '2027-11-07 01:30 (GMT-5) 纽约'],
  ['Asia/Kolkata', '2027-01-01T03:30:00Z', '2027-01-01 09:00 (GMT+5:30) 加尔各答'],
  ['Asia/Kathmandu', '2027-01-01T03:15:00Z', '2027-01-01 09:00 (GMT+5:45) 加德满都'],
  ['UTC', '2027-01-01T09:00:00Z', '2027-01-01 09:00 (GMT+0) 协调世界时'],
])('中文排期格式 %s %s', (zone, utc, expected) => {
  expect(formatSchedule(utc, zone)).toBe(expected);
});
test('夏令时缺失时间拒绝，重复时间给出两个 UTC 候选', () => {
  expect(scheduleCandidates('2027-03-14T02:30', 'America/New_York')).toEqual([]);
  const options = scheduleCandidates('2027-11-07T01:30', 'America/New_York');
  expect(options.map((o) => o.offset)).toEqual(['GMT-04:00', 'GMT-05:00']);
  expect(new Date(options[1]!.utc).getTime() - new Date(options[0]!.utc).getTime()).toBe(3600000);
  expect(scheduleCandidates('2099-01-01T09:00', 'Unknown/City')).toEqual([]);
});
const stubs = {
  PopoverRoot: { template: '<div><slot /></div>' },
  PopoverTrigger: { template: '<div><slot /></div>' },
  PopoverPortal: { template: '<div><slot /></div>' },
  PopoverContent: { template: '<div><slot /></div>' },
};
test('时区搜索支持中英文、国家及 IANA 标识，显示统一中文地点', async () => {
  const wrapper = mount(SchedulePicker, {
    props: { modelValue: '2099-07-01T16:00:00.000Z', timeZone: 'America/Los_Angeles' },
    global: { stubs },
  });
  for (const query of ['洛杉矶', 'Los Angeles', '美国', 'America/Los_Angeles']) {
    await wrapper.get('input[aria-label="搜索国家或城市时区"]').setValue(query);
    expect(wrapper.findAll('button').filter((b) => b.text() === '(GMT-7) 洛杉矶').length).toBeGreaterThan(0);
    expect(wrapper.text()).not.toContain('Los Angeles');
  }
  expect(wrapper.text()).toContain('2099-07-01 09:00 (GMT-7) 洛杉矶');
  wrapper.unmount();
});
test('时区切换保留填写时间，DST 冲突必须选择偏移才能通过', async () => {
  const wrapper = mount(SchedulePicker, {
    props: { modelValue: '2027-11-07T01:30:00.000Z', timeZone: 'UTC' },
    global: { stubs },
  });
  await wrapper.get('input[aria-label="搜索国家或城市时区"]').setValue('纽约');
  await wrapper
    .findAll('button')
    .find((b) => b.text().includes('纽约'))!
    .trigger('click');
  expect(wrapper.get<HTMLInputElement>('input[type=time]').element.value).toBe('01:30');
  expect(wrapper.emitted('validity')?.at(-1)).toEqual([false]);
  await wrapper.findAll('input[type=radio]')[1]!.setValue();
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2027-11-07T06:30:00.000Z']);
  expect(wrapper.emitted('validity')?.at(-1)).toEqual([true]);
  await wrapper.setProps({ modelValue: '2027-11-07T06:30:00.000Z', timeZone: 'America/New_York' });
  await flushPromises();
  expect(wrapper.get<HTMLInputElement>('input[type=time]').element.value).toBe('01:30');
  expect(wrapper.get('button[aria-label=发布时区]').text()).toContain('(GMT-5) 纽约');
  wrapper.unmount();
});
test('新任务使用本地时区，拆解不进入发布分类', () => {
  const { film, project } = setup();
  const task = ensurePublishTask(film);
  expect(task.timeZone).toBe(localTimeZone());
  film.resultKind = 'script-breakdown';
  expect(categorizedVideoRows(studio.value, project.id, 'published')).toHaveLength(0);
  expect(workPublishStatus(categorizedVideoRows(studio.value, project.id, 'all')[0]!)).toBe('—');
});

test('其他帐号执行中仍复用指定失败任务进行重试', async () => {
  const { film, accounts } = setup();
  const active = taskFor(film, accounts[0]!.id);
  await submitPublish([active]);
  const failed = taskFor(film, accounts[1]!.id);
  failed.status = '发布失败';
  expect(ensurePublishTask(film, failed.id).id).toBe(failed.id);
  await submitPublish([failed]);
  expect(failed.status).toBe('待发布');
});
