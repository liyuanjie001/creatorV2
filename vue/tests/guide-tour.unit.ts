import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createTourController, guideTour, tourKey } from '@/services/guideTour';
import { currentUser } from '@/services/identity';
import { blankAttributes, createProject, studio } from '@/services/studio';
import { createAppRouter } from '@/router';
import { ACCESS_STORAGE_KEY } from '@/lib/access';

let wrapper: VueWrapper | undefined;
beforeEach(() => {
  localStorage.clear();
  currentUser.value = null;
  guideTour.activate(null);
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
});
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

test('仅新用户自动引导，进度及项目按用户保存，刷新续接并支持重看', () => {
  const tour = createTourController(localStorage);
  tour.activate('old-user');
  expect(tour.progress.value).toBeNull();
  tour.enroll('demo');
  tour.activate('demo');
  expect(tour.progress.value).toBeNull();
  tour.enroll('new-user');
  tour.activate('new-user');
  expect(tour.progress.value?.status).toBe('pending');
  tour.selectProject('P-test');
  tour.move(2);
  const restored = createTourController(localStorage);
  restored.activate('new-user');
  expect(restored.progress.value).toEqual({ version: 1, step: 2, status: 'in-progress', projectId: 'P-test' });
  restored.end('completed');
  restored.activate('old-user');
  expect(restored.progress.value).toBeNull();
  restored.activate('new-user');
  expect(restored.progress.value?.status).toBe('completed');
  restored.start('new-user');
  expect(restored.progress.value?.step).toBe(0);
  restored.end('skipped');
  restored.activate('new-user');
  expect(restored.progress.value?.status).toBe('skipped');
});

test('损坏存储不自动弹出，存储失败时会话保留进度', () => {
  localStorage.setItem(tourKey('bad'), '{');
  const tour = createTourController(localStorage);
  tour.activate('bad');
  expect(tour.progress.value).toBeNull();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  tour.enroll('new');
  tour.activate('new');
  tour.move(3);
  tour.end('skipped');
  tour.activate('other');
  tour.activate('new');
  expect(tour.progress.value).toEqual({ version: 1, step: 3, status: 'skipped' });
});

function login(id = 'fresh') {
  currentUser.value = { id, name: '新用户', identity: `${id}@example.com`, method: 'email', bindings: ['email'] };
}
async function settle() {
  for (let i = 0; i < 12; i++) await flushPromises();
  await vi.waitFor(() => {
    expect(document.querySelector('.tour-bubble')?.getAttribute('aria-busy')).not.toBe('true');
  }, { timeout: 10000 });
}
async function open(path = '/') {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, { attachTo: document.body, global: { plugins: [router] } });
  await settle();
  return router;
}
function button(text: string) {
  const found = Array.from(document.querySelectorAll<HTMLButtonElement>('.tour-bubble button')).find(b => b.textContent?.trim() === text);
  if (!found) throw new Error(`Tour button not found: ${text}`);
  return found;
}
async function click(text: string) { button(text).click(); await settle(); }

test('新用户五步跳转实际页面，空作品仍可绑定账号并切换数据入口', async () => {
  login();
  guideTour.enroll('fresh');
  const router = await open('/accounts');
  expect(router.currentRoute.value.path).toBe('/');
  expect(wrapper!.find('[data-tour="project-list"]').exists()).toBe(true);
  expect(document.querySelector('[aria-label="引导演示工作区"]')).toBeNull();
  const name = document.querySelector<HTMLInputElement>('[aria-label="引导项目名称"]')!;
  name.value = '我的品牌项目';
  name.dispatchEvent(new Event('input', { bubbles: true }));
  await click('下一步');
  const id = studio.value.projects[0]!.id;
  expect(studio.value.projects).toHaveLength(1);
  expect(studio.value.projects[0]!.name).toBe('我的品牌项目');
  expect(router.currentRoute.value.fullPath).toBe(`/projects/${id}?section=gen&mode=normal`);
  expect(wrapper!.find('[data-tour="create-console"] textarea').exists()).toBe(true);
  await click('下一步');
  expect(router.currentRoute.value.query).toEqual({ section: 'publish', tab: 'creations' });
  expect(wrapper!.find('[aria-label="我的作品内容"]').exists()).toBe(true);
  expect(wrapper!.find('[data-tour="works-upload"]').text()).toContain('上传本地作品');
  expect(document.querySelector('.publish-animation')).not.toBeNull();
  await click('下一步');
  expect(router.currentRoute.value.query).toEqual({ section: 'publish', tab: 'configure' });
  expect(wrapper!.find('[aria-label="发布配置页面"]').exists()).toBe(true);
  expect(wrapper!.text()).toContain('请先选择要发布的作品');
  await wrapper!.find('[data-tour="bind-account"]').trigger('click');
  await settle();
  expect(document.body.textContent).toContain('连接 TikTok 帐号');
  expect(document.body.textContent).toContain('前往 TikTok 授权');
  // Close the real authorization dialog before moving on.
  document.querySelector<HTMLButtonElement>('[aria-label="关闭"]')!.click();
  await settle();
  await click('下一步');
  expect(router.currentRoute.value.query).toEqual({ section: 'analytics', report: 'content' });
  expect(wrapper!.find('[data-tour="video-data"]').exists()).toBe(true);
  expect(wrapper!.text()).toContain('暂无符合条件的内容');
  expect(document.querySelector('.tour-bubble')?.textContent).toContain('尚未发布或采集');
  await click('账号数据 ↗');
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(wrapper!.find('[data-tour="account-data"]').exists()).toBe(true);
  await click('视频数据 ↗');
  expect(router.currentRoute.value.query.section).toBe('analytics');
  await click('开始使用');
  expect(document.querySelector('.tour-bubble')).toBeNull();
  expect(guideTour.progress.value?.status).toBe('completed');
  expect(studio.value.films).toHaveLength(0);
  expect(studio.value.tasks).toHaveLength(0);
  expect(studio.value.accounts).toHaveLength(0);
  await wrapper!.find('[aria-label="新手引导"]').trigger('click');
  await settle();
  expect(router.currentRoute.value.path).toBe('/');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('项目');
});

test('已有项目和作品使用实际发布草稿与账号选择，上一步及刷新保持项目', async () => {
  login();
  const project = createProject('实际项目');
  const film = { id: 'actual-film', projectId: project.id, title: '已完成的作品', type: '视频' as const, source: '本地上传' as const, createdAt: new Date().toISOString(), duration: '15', ratio: '9:16', quality: '1080P', brief: '', productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: blankAttributes() };
  studio.value.films.push(film);
  studio.value.accounts.push({ id: 'actual-account', name: '实际账号', handle: '@actual', groupId: 'ungrouped', region: '美国', note: '', status: '已授权', authorizedAt: new Date().toISOString() });
  project.accountIds.push('actual-account');
  guideTour.start('fresh');
  const router = await open(`/projects/${project.id}`);
  await click('下一步');
  await click('下一步');
  expect(wrapper!.find('[aria-label="我的作品内容"]').exists()).toBe(true);
  expect(studio.value.films[0]!.title).toBe('已完成的作品');
  expect(document.querySelector('.publish-animation')).toBeNull();
  await click('下一步');
  const task = studio.value.tasks[0]!;
  expect(router.currentRoute.value.query.task).toBe(task.id);
  expect(task.filmId).toBe(film.id);
  expect(task.status).toBe('待配置');
  expect(wrapper!.find('[data-tour="publish-accounts"]').exists()).toBe(true);
  const picker = wrapper!.find('[data-tour="publish-accounts"] [aria-label="选择发布帐号"]');
  await picker.trigger('click');
  await settle();
  const choose = document.querySelector<HTMLButtonElement>('[aria-label="选择 @actual"]')!;
  expect(choose).not.toBeNull();
  choose.click();
  await settle();
  expect(studio.value.tasks[0]!.accountId).toBe('actual-account');
  await click('上一步');
  expect(router.currentRoute.value.query.tab).toBe('creations');
  await click('下一步');
  expect(studio.value.tasks).toHaveLength(1);
  wrapper!.unmount(); wrapper = undefined;
  const restoredRouter = await open('/');
  expect(restoredRouter.currentRoute.value.path).toBe(`/projects/${project.id}`);
  expect(restoredRouter.currentRoute.value.query.task).toBe(task.id);
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('去发布');
  await click('下一步');
  await click('账号数据 ↗');
  expect(restoredRouter.currentRoute.value.path).toBe('/accounts/actual-account');
  expect(wrapper!.text()).toContain('@actual');
  expect(studio.value.tasks.every(t => t.status === '待配置')).toBe(true);
});

test('跳过不创建项目；Escape关闭且不锁定背景；用户切换隔离', async () => {
  login(); guideTour.enroll('fresh');
  await open();
  expect(document.querySelector<HTMLElement>('[data-tour-background]')!.inert ?? false).toBe(false);
  document.querySelector<HTMLButtonElement>('[aria-label="关闭新手引导"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await settle();
  expect(guideTour.progress.value?.status).toBe('skipped');
  expect(studio.value.projects).toHaveLength(0);
  guideTour.start('fresh'); await settle();
  login('existing'); await settle();
  expect(document.querySelector('.tour-bubble')).toBeNull();
  expect(studio.value.projects).toHaveLength(0);
});

test('登录后自动开始，刷新遇到删除的项目安全回到第一步', async () => {
  guideTour.enroll('fresh');
  const router = await open('/auth');
  expect(document.querySelector('.tour-bubble')).toBeNull();
  login(); await router.push('/'); await settle();
  await click('下一步');
  studio.value.projects = [];
  wrapper!.unmount(); wrapper = undefined;
  const restoredRouter = await open('/');
  expect(restoredRouter.currentRoute.value.path).toBe('/');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('项目');
  expect(wrapper!.text()).not.toContain('项目不存在');
});

test('路由守卫阻止跳转时可重试，快速重复点击不会创建多个项目或跳步', async () => {
  login(); guideTour.enroll('fresh');
  const router = await open();
  let blocked = true;
  router.beforeEach(to => to.query.section === 'gen' && blocked ? false : true);
  button('下一步').click();
  button('下一步').click();
  await settle();
  expect(studio.value.projects).toHaveLength(1);
  expect(guideTour.progress.value?.step).toBe(1);
  expect(router.currentRoute.value.path).toBe('/');
  expect(document.querySelector('.tour-error')?.textContent).toContain('页面跳转未完成');
  blocked = false;
  await click('重试');
  expect(router.currentRoute.value.query.section).toBe('gen');
  expect(wrapper!.find('[data-tour="create-console"]').exists()).toBe(true);
  expect(document.querySelector('.tour-error')).toBeNull();
});
