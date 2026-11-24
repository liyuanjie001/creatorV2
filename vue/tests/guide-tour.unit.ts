import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createTourController, guideTour, tourKey } from '@/services/guideTour';
import { currentUser } from '@/services/identity';
import { creditsBalance, spendCredits } from '@/services/credits';
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
  expect(restored.progress.value).toEqual({ version: 1, step: 2, status: 'in-progress', projectId: 'P-test', welcomeGift: { amount: 50, noticeShown: false } });
  restored.end('completed');
  restored.acknowledgeWelcomeGift();
  restored.activate('old-user');
  expect(restored.progress.value).toBeNull();
  restored.activate('new-user');
  expect(restored.progress.value?.status).toBe('completed');
  restored.start('new-user');
  expect(restored.progress.value?.step).toBe(0);
  expect(restored.progress.value?.welcomeGift?.noticeShown).toBe(true);
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
  expect(tour.progress.value).toEqual({ version: 1, step: 3, status: 'skipped', welcomeGift: { amount: 50, noticeShown: false } });
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
function gift() { return document.querySelector<HTMLElement>('[data-testid="welcome-gift"]'); }
async function dismissGift() {
  Array.from(gift()!.querySelectorAll('button')).find(b => b.textContent?.trim() === '我知道了')!.click();
  await settle();
}

test('新用户四步跳转实际页面，我的作品后直接展示账号管理并完成引导', async () => {
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
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('账号管理');
  expect(document.querySelector('.step-number')?.textContent?.replace(/\s/g, '')).toBe('04/04');
  expect(document.querySelectorAll('.step-dots span')).toHaveLength(4);
  expect(wrapper!.find('[aria-label="账号管理页面"]').exists()).toBe(true);
  expect(wrapper!.find('[data-tour="accounts-nav"]').exists()).toBe(true);
  expect(wrapper!.find('[data-tour="account-data"]').exists()).toBe(true);
  expect(wrapper!.find('[data-tour="accounts-bind"]').text()).toContain('绑定账号');
  expect(document.querySelector('.data-links')).toBeNull();
  await click('上一步');
  expect(router.currentRoute.value.query.tab).toBe('creations');
  await click('下一步');
  expect(router.currentRoute.value.path).toBe('/accounts');
  await click('开始使用');
  expect(document.querySelector('.tour-bubble')).toBeNull();
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(guideTour.progress.value?.status).toBe('completed');
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  expect(gift()?.textContent).toContain('+50');
  expect(creditsBalance.value).toBe(50);
  await dismissGift();
  expect(studio.value.films).toHaveLength(0);
  expect(studio.value.tasks).toHaveLength(0);
  expect(studio.value.accounts).toHaveLength(0);
  await wrapper!.find('[aria-label="新手引导"]').trigger('click');
  await settle();
  expect(router.currentRoute.value.path).toBe('/');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('项目');
  await click('跳过');
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(50);
});

test('已有作品后直接进入账号管理，上一步及刷新保持项目，不自动创建发布草稿', async () => {
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
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(studio.value.tasks).toHaveLength(0);
  await click('上一步');
  expect(router.currentRoute.value.path).toBe(`/projects/${project.id}`);
  expect(router.currentRoute.value.query.tab).toBe('creations');
  await click('下一步');
  expect(studio.value.tasks).toHaveLength(0);
  wrapper!.unmount(); wrapper = undefined;
  const restoredRouter = await open('/');
  expect(restoredRouter.currentRoute.value.path).toBe('/accounts');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('账号管理');
  expect(wrapper!.text()).toContain('@actual');
  expect(studio.value.tasks).toHaveLength(0);
  await click('上一步');
  expect(restoredRouter.currentRoute.value.path).toBe(`/projects/${project.id}`);
  expect(restoredRouter.currentRoute.value.query.tab).toBe('creations');
});

test.each([3, 4])('旧进度索引 %s 刷新直接打开第四步账号管理，不依赖项目或账号数据', async (oldStep) => {
  localStorage.setItem(tourKey('fresh'), JSON.stringify({ version: 1, step: oldStep, status: 'in-progress' }));
  login();
  const router = await open('/');
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(document.querySelector('#guide-tour-title')?.textContent).toBe('账号管理');
  expect(guideTour.progress.value?.step).toBe(3);
  expect(document.querySelector('.step-number')?.textContent?.replace(/\s/g, '')).toBe('04/04');
  expect(wrapper!.find('[aria-label="账号管理页面"]').exists()).toBe(true);
  expect(studio.value.projects).toHaveLength(0);
  expect(studio.value.accounts).toHaveLength(0);
});

test('跳过不创建项目；Escape关闭且不锁定背景；用户切换隔离', async () => {
  login(); guideTour.enroll('fresh');
  await open();
  expect(document.querySelector<HTMLElement>('[data-tour-background]')!.inert ?? false).toBe(false);
  document.querySelector<HTMLButtonElement>('[aria-label="关闭新手引导"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await settle();
  expect(guideTour.progress.value?.status).toBe('skipped');
  expect(studio.value.projects).toHaveLength(0);
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  await dismissGift();
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

test.each(['跳过', '跳过引导', '关闭', 'Escape'])('%s 结束首次引导后只提示一次，刷新及重新登录不重发', async (ending) => {
  guideTour.enroll('fresh'); login();
  await open();
  expect(creditsBalance.value).toBe(50);
  expect(gift()).toBeNull();
  if (ending === '跳过引导') await click('下一步');
  if (ending === '关闭') document.querySelector<HTMLButtonElement>('[aria-label="关闭新手引导"]')!.click();
  else if (ending === 'Escape') document.querySelector('[aria-label="关闭新手引导"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  else button(ending).click();
  await settle();
  expect(document.querySelector('.tour-bubble')).toBeNull();
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  expect(guideTour.progress.value?.welcomeGift?.noticeShown).toBe(true);
  spendCredits(10);
  // Closing and Escape use the shared dialog's normal dismissal behavior.
  if (ending === '关闭') gift()!.querySelector<HTMLButtonElement>('[aria-label="关闭"]')!.click();
  else if (ending === 'Escape') gift()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  else await dismissGift();
  await settle();
  expect(gift()).toBeNull();
  wrapper!.unmount(); wrapper = undefined;
  currentUser.value = null; login();
  await open();
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(40);
  guideTour.start('fresh'); await settle();
  await click('跳过');
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(40);
});

test('切换账号关闭到账弹窗，每个新用户独立提示，老用户及演示账号无赠送提示', async () => {
  guideTour.enroll('fresh'); login(); await open(); await click('跳过');
  expect(gift()).not.toBeNull();
  login('existing'); await settle();
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(100);
  guideTour.start('existing'); await settle(); await click('跳过');
  expect(gift()).toBeNull();
  guideTour.enroll('second'); login('second'); await settle(); await click('跳过');
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  expect(creditsBalance.value).toBe(50);
  login('demo'); await settle();
  guideTour.start('demo'); await settle(); await click('跳过');
  expect(gift()).toBeNull();
  login(); await settle();
  expect(gift()).toBeNull();
});

test('首次通知前刷新可恢复已结束的引导并显示到账提示，兼容旧引导记录', async () => {
  localStorage.setItem(tourKey('legacy'), JSON.stringify({ version: 1, step: 4, status: 'completed' }));
  login('legacy'); await open();
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(100);
  guideTour.start('legacy'); await settle(); await click('跳过');
  expect(gift()).toBeNull();
  wrapper!.unmount(); wrapper = undefined;
  guideTour.enroll('fresh'); login();
  guideTour.activate('fresh'); guideTour.end('completed');
  await open();
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  await dismissGift();
  wrapper!.unmount(); wrapper = undefined;
  await open();
  expect(gift()).toBeNull();
});

test('积分写入失败不提示到账，恢复后重试只发50积分', async () => {
  guideTour.enroll('fresh');
  const setItem = Storage.prototype.setItem;
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-credits-v1:fresh') throw new Error('quota');
    setItem.call(this, key, value);
  });
  login(); await open();
  expect(creditsBalance.value).toBe(0);
  await click('跳过');
  expect(gift()?.textContent).toContain('赠送积分暂未确认到账');
  expect(gift()?.textContent).not.toContain('新用户赠送50积分已到账');
  expect(guideTour.progress.value?.welcomeGift?.noticeShown).toBe(false);
  write.mockRestore();
  Array.from(gift()!.querySelectorAll('button')).find(b => b.textContent?.trim() === '重试')!.click();
  await settle();
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  expect(creditsBalance.value).toBe(50);
  await dismissGift();
  guideTour.start('fresh'); await settle(); await click('跳过');
  expect(gift()).toBeNull();
  expect(creditsBalance.value).toBe(50);
});

test('到账通知标记保存失败可重试，不会重复入账', async () => {
  guideTour.enroll('fresh'); login(); await open();
  const setItem = Storage.prototype.setItem;
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === tourKey('fresh') && JSON.parse(value).welcomeGift?.noticeShown) throw new Error('quota');
    setItem.call(this, key, value);
  });
  await click('跳过');
  expect(gift()?.textContent).toContain('赠送积分暂未确认到账');
  expect(creditsBalance.value).toBe(50);
  write.mockRestore();
  Array.from(gift()!.querySelectorAll('button')).find(b => b.textContent?.trim() === '重试')!.click();
  await settle();
  expect(gift()?.textContent).toContain('新用户赠送50积分已到账');
  expect(creditsBalance.value).toBe(50);
});
