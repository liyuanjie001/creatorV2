import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { identityService } from '@/services/identity';

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

async function open(path: string) {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, { attachTo: document.body, global: { plugins: [router] } });
  await flushPromises();
  return { app: wrapper, router };
}

test('Roxy 浏览器演示独立全屏呈现，广告可打开官网演示，窗口管理仍保留', async () => {
  const { app, router } = await open('/roxy-browser-demo');

  expect(app.find('main.roxy-browser-demo').exists()).toBe(true);
  expect(app.find('.mac-menu-bar').exists()).toBe(true);
  expect(app.find('.mac-app-window').exists()).toBe(true);
  expect(app.find('.mac-dock').exists()).toBe(true);
  expect(app.find('aside.roxy-side-nav').exists()).toBe(true);
  expect(app.find('aside[aria-label="一级导航"]').exists()).toBe(false);
  expect(app.text()).toContain('内容生产与矩阵分发');
  expect(app.text()).toContain('联动全球账号与达人，让世界看见你的品牌。');
  expect(app.findAll('.roxy-window-table tbody tr')).toHaveLength(4);

  const ad = app.find('.roxy-ad-slot');
  const pushSpy = vi.spyOn(router, 'push');
  await ad.trigger('click', { button: 0 });
  expect(pushSpy).toHaveBeenCalledWith('/roxy-website-demo');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy-website-demo'));
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/roxy-website-demo');
  expect(app.find('main.roxy-website').exists()).toBe(true);

  await router.push('/roxy-browser-demo');
  await flushPromises();
  const windowManager = app.find('.roxy-side-nav button[aria-current="page"]');
  const managerPush = vi.spyOn(router, 'push');
  await windowManager.trigger('click');
  expect(managerPush).toHaveBeenCalledWith('/roxy');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy'));
  await flushPromises();
  expect(app.text()).toContain('窗口管理');
});

test('官网仿真页展示参考内容，免费试用和注册入口指向注册模式', async () => {
  const { app, router } = await open('/roxy-website-demo');

  expect(app.find('main.roxy-website').exists()).toBe(true);
  expect(app.find('.roxy-feature-section').attributes('hidden')).toBeDefined();
  expect(app.find('aside[aria-label="一级导航"]').exists()).toBe(false);
  expect(app.find('h1').text().replace(/\s+/g, '')).toBe('内容生产与矩阵分发');
  expect(app.text()).toContain('联动全球账号与达人，让世界看见你的品牌。');
  expect(app.text()).toContain('1800');
  expect(app.text()).toContain('五平台矩阵分发');

  const trial = app.findAll('a').find((link) => link.text().includes('免费试用'));
  const trialHref = trial?.attributes('href');
  expect(trialHref).toBe('/auth?mode=register');
  if (!trialHref) throw new Error('免费试用注册链接不存在');

  await router.push(trialHref);
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/auth');
  expect(router.currentRoute.value.query.mode).toBe('register');
  expect(app.text()).toContain('创建帐号');
  expect(app.text()).toContain('注册并进入');
});

test('推广计划由留白分隔线独立分组，并使用彩色图标', async () => {
  const { app } = await open('/');
  const separator = app.find('[role="separator"][aria-label="推广计划分隔线"]');
  const promotion = app.find('nav a[aria-label="推广计划"]');

  expect(separator.exists()).toBe(true);
  expect(separator.classes()).toContain('my-3');
  expect(separator.element.nextElementSibling).toBe(promotion.element);
  expect(promotion.find('svg').classes()).toContain('text-orange-500');
  expect(promotion.find('svg').classes()).toContain('fill-orange-100');
});

test('左下角演示面板的 Roxy 选项打开各自的应用内演示页', async () => {
  const { app, router } = await open('/');

  expect(app.find('aside[aria-label="一级导航"] button[aria-label="演示"]').exists()).toBe(true);
  expect(app.find('header button[aria-label="演示"]').exists()).toBe(false);
  expect(app.find('aside[aria-label="一级导航"] button[aria-label="新手引导"]').exists()).toBe(false);
  await app.find('button[aria-label="演示"]').trigger('click');
  expect(
    app
      .find('[role="dialog"]')
      .findAll('button')
      .some((item) => item.text().includes('新手引导')),
  ).toBe(true);
  const browserOption = app
    .find('[role="dialog"]')
    .findAll('button')
    .find((item) => item.text().includes('Roxy 浏览器'));
  expect(browserOption).toBeDefined();
  await browserOption!.trigger('click');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy-browser-demo'));
  await flushPromises();
  expect(app.find('main.roxy-browser-demo').exists()).toBe(true);

  await router.push('/');
  await flushPromises();
  await app.find('button[aria-label="演示"]').trigger('click');
  const websiteOption = app
    .find('[role="dialog"]')
    .findAll('button')
    .find((item) => item.text().includes('Roxy 官网'));
  expect(websiteOption).toBeDefined();
  await websiteOption!.trigger('click');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy-website-demo'));
  await flushPromises();
  expect(app.find('main.roxy-website').exists()).toBe(true);
});
