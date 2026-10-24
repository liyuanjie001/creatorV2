import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { createWindowManager, useWindowManager, WINDOW_STORAGE_KEY } from '@/composables/useWindowManager';
import { metricTrend, sumMetrics } from '@/lib/windowMetrics';
import type { PublishedVideo } from '@/types/windows';

const manager = useWindowManager();
let wrapper: VueWrapper | undefined;
let warnings: string[] = [];
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  manager.reload();
  warnings = [];
  vi.useFakeTimers();
});
afterEach(async () => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  await flushPromises();
  vi.restoreAllMocks();
  vi.useRealTimers();
  expect(warnings).toEqual([]);
});
async function open(path = '/accounts') {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [router], config: { warnHandler: (message) => warnings.push(message) } },
  });
  await flushPromises();
  return { app: wrapper, router };
}
function btn(name: string, scope: ParentNode = document) {
  const result = Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
    (item) =>
      (item.getAttribute('aria-label') ?? item.textContent)?.replace(/\s/g, '') === name.replace(/\s/g, ''),
  );
  if (!result) throw new Error(`Missing button: ${name}`);
  return result;
}
async function click(name: string, scope: ParentNode = document) {
  btn(name, scope).click();
  await flushPromises();
}
function dialog() {
  const el = document.querySelector('[role="dialog"]');
  if (!el) throw new Error('Dialog missing');
  return el;
}
function projectCheck(name: string) {
  const el = dialog().querySelector<HTMLInputElement>(`input[aria-label="${name}"]`);
  if (!el) throw new Error('Project checkbox missing');
  el.click();
}
async function setSelect(label: string, value: string) {
  if (!wrapper) throw new Error('App missing');
  await wrapper.find(`select[aria-label="${label}"]`).setValue(value);
  await flushPromises();
}

test('首次绑定校验、项目数量、同步结果与刷新恢复，不存 Key', async () => {
  const { app } = await open();
  expect(app.text()).toContain('一个窗口，');
  expect(manager.windows.value).toHaveLength(0);
  await click('开始绑定与同步');
  dialog()
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await flushPromises();
  expect(dialog().textContent).toContain('请输入 API Key');
  await click('一键填入演示 Key');
  dialog()
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await flushPromises();
  await click('开始同步');
  expect(dialog().textContent).toContain('至少选择一个项目');
  projectCheck('GlowUp 美妆出海');
  await flushPromises();
  expect(dialog().textContent).toContain('1 个项目 · 3 个窗口');
  await click('开始同步');
  await vi.advanceTimersByTimeAsync(700);
  expect(dialog().textContent).toContain('正在同步窗口');
  expect(manager.bound.value).toBe(false);
  await vi.advanceTimersByTimeAsync(1600);
  await flushPromises();
  expect(dialog().textContent).toContain('同步完成');
  expect(manager.windows.value).toHaveLength(3);
  expect(manager.accounts.value).toHaveLength(5);
  expect(manager.windowAccounts('W-P1-3')).toHaveLength(0);
  expect(new Set(manager.accounts.value.map((a) => `${a.platformAccountId}-${a.platform}`)).size).toBe(5);
  expect(localStorage.getItem(WINDOW_STORAGE_KEY)).not.toContain('roxy-demo-local-key');
  await click('进入窗口管理');
  const restored = createWindowManager();
  expect(restored.windows.value.map((w) => w.id)).toEqual(manager.windows.value.map((w) => w.id));
  expect(app.find('table').text()).toContain('暂无登录账号');
});

test('取消同步不覆盖现有数据，关闭或离开页面后不会完成同步', async () => {
  manager.synchronize(['roxy-P1']);
  const snapshot = localStorage.getItem(WINDOW_STORAGE_KEY);
  const { router } = await open();
  await click('同步数据');
  await click('全选项目');
  await click('开始同步');
  await vi.advanceTimersByTimeAsync(500);
  await click('取消同步');
  await vi.advanceTimersByTimeAsync(3000);
  expect(localStorage.getItem(WINDOW_STORAGE_KEY)).toBe(snapshot);
  await click('同步数据');
  await click('全选项目');
  await click('开始同步');
  await router.push('/tasks');
  await flushPromises();
  await vi.advanceTimersByTimeAsync(3000);
  expect(localStorage.getItem(WINDOW_STORAGE_KEY)).toBe(snapshot);
});

test('重复同步不重复生成，项目取消后数据移除，工作台项目隔离', () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const counts = [manager.windows.value.length, manager.accounts.value.length, manager.videos.value.length];
  manager.synchronize(['roxy-P1', 'roxy-P1', 'roxy-P2']);
  expect([manager.windows.value.length, manager.accounts.value.length, manager.videos.value.length]).toEqual(
    counts,
  );
  expect(manager.windowsForProject('P1').every((w) => w.roxyProjectId === 'roxy-P1')).toBe(true);
  expect(manager.windowsForProject('P3')).toEqual([]);
  manager.synchronize(['roxy-P2']);
  expect(manager.windowsForProject('P1')).toEqual([]);
  expect(manager.videos.value.every((v) => manager.accounts.value.some((a) => a.id === v.accountId))).toBe(
    true,
  );
});

test('窗口搜索、状态筛选、空状态与清除筛选可操作', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const { app } = await open();
  await app.find('input[aria-label="搜索窗口"]').setValue('不存在的窗口');
  expect(app.find('table').text()).toContain('没有符合条件的窗口');
  await click('清除筛选');
  await setSelect('窗口登录状态', 'expired');
  expect(app.find('tbody').text()).toContain('TechNova');
  expect(app.find('tbody').text()).not.toContain('GlowUp');
  await setSelect('窗口登录状态', 'empty');
  expect(app.find('tbody').text()).toContain('备用窗口');
  await setSelect('窗口平台', 'YouTube');
  expect(app.find('tbody').text()).toContain('没有符合条件的窗口');
});

test('窗口详情识别未登录平台，失效账号恢复并同步后状态持久化', async () => {
  manager.synchronize(['roxy-P2']);
  await open('/accounts?window=W-P2-2');
  expect(dialog().textContent).toContain('未登录');
  expect(dialog().textContent).toContain('登录失效');
  await click('模拟恢复登录并同步');
  expect(btn('正在恢复并同步…').disabled).toBe(true);
  await vi.advanceTimersByTimeAsync(1300);
  await flushPromises();
  expect(dialog().textContent).not.toContain('登录失效');
  expect(createWindowManager().accounts.value.find((a) => a.id === 'A-P2-2-YouTube')?.status).toBe('正常');
  expect(document.body.textContent).not.toContain('正在恢复并同步');
});

test('每日趋势、单视频、窗口和平台汇总在相同范围下相符', () => {
  manager.synchronize(['roxy-P1']);
  for (const days of [7, 30, 90] satisfies (7 | 30 | 90)[]) {
    const totals = sumMetrics(manager.videos.value, days);
    expect(totals.views).toBeGreaterThan(0);
    for (const metric of ['views', 'likes', 'comments'] satisfies ('views' | 'likes' | 'comments')[]) {
      const trend = metricTrend([{ name: 'total', videos: manager.videos.value }], days, metric);
      expect(trend.reduce((sum, row) => sum + Number(row.total), 0)).toBe(totals[metric]);
      const accountIds = new Set(
        manager.windows.value.flatMap((w) => manager.windowAccounts(w.id).map((a) => a.id)),
      );
      const byWindow = sumMetrics(
        manager.videos.value.filter((v) => accountIds.has(v.accountId)),
        days,
      )[metric];
      expect(byWindow).toBe(totals[metric]);
    }
  }
  const fixture: PublishedVideo = {
    id: 'test',
    accountId: 'test',
    title: 'test',
    duration: '00:30',
    publishedAt: '2026-10-01',
    collection: { kind: 'ready', since: '2026-07-25', collectedAt: '2026-10-22T10:00:00Z' },
    daily: [
      { date: '2026-10-15', views: 100, likes: 10, comments: 1 },
      { date: '2026-10-16', views: 200, likes: 20, comments: 2 },
      { date: '2026-10-22', views: 300, likes: 30, comments: 3 },
    ],
  };
  expect(sumMetrics([fixture], 7)).toEqual({ views: 500, likes: 50, comments: 5 });
  expect(sumMetrics([fixture], 30)).toEqual({ views: 600, likes: 60, comments: 6 });
});

test('项目详情只展示所属窗口，无匹配项目不回退其他账号', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const { app, router } = await open('/projects/P1');
  await click('账号管理');
  expect(app.text()).toContain('GlowUp · 品牌主窗口');
  expect(app.text()).not.toContain('TechNova · 品牌主窗口');
  await router.push('/projects/P3');
  await flushPromises();
  await click('账号管理');
  expect(app.text()).toContain('当前项目尚未同步窗口');
  expect(app.text()).not.toContain('@glowup');
});

test('任务按项目和平台选择有效账号，切换条件清理旧选择', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const { app, router } = await open('/tasks/new');
  expect(app.text()).not.toContain('TechNova · 品牌主窗口');
  await click('创建任务');
  expect(router.currentRoute.value.path).toBe('/tasks/new');
  const choice = app.find('button[aria-label="选择 GlowUp 官方 TikTok"]');
  await choice.trigger('click');
  expect(app.text()).toContain('已选择 1 个发布账号');
  await click('TechNova 北美', app.find('main').element);
  expect(app.text()).toContain('已选择 0 个发布账号');
  await click('YouTube', app.find('main').element);
  const expired = app.find('button[aria-label="选择 TechNova 日更号 YouTube"]');
  expect(expired.attributes('disabled')).toBeDefined();
  const normal = app.find('button[aria-label="选择 TechNova 官方 YouTube"]');
  await normal.trigger('click');
  await click('YouTube', app.find('main').element);
  expect(app.text()).toContain('已选择 0 个发布账号');
  await app.find('button[aria-label="选择 TechNova 官方 TikTok"]').trigger('click');
  await click('创建任务');
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/tasks');
});

test('从项目发布入口进入任务时保留项目与默认平台', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const { app, router } = await open('/projects/P2');
  await router.push({ path: '/tasks/new', query: { project: 'P2' } });
  await flushPromises();
  expect(router.currentRoute.value.query.project).toBe('P2');
  expect(app.text()).toContain('TechNova · 品牌主窗口');
  expect(app.text()).not.toContain('GlowUp · 品牌主窗口');
  expect(app.find('button[aria-label="选择 TechNova 官方 YouTube"]').exists()).toBe(true);
});

test('重置只清除窗口数据，保留访问锁和妙记', async () => {
  manager.synchronize(['roxy-P1']);
  localStorage.setItem('chuhai-idea-notes', 'keep');
  const { app } = await open();
  await click('重置演示');
  await click('确认重置');
  expect(app.text()).toContain('开始绑定与同步');
  expect(createWindowManager().bound.value).toBe(false);
  expect(localStorage.getItem(ACCESS_STORAGE_KEY)).toBe(__ACCESS_PASSWORD_HASH__);
  expect(localStorage.getItem('chuhai-idea-notes')).toBe('keep');
});

test.each([
  '{invalid',
  '{"version":3,"kind":"ready"}',
  '{"version":1,"kind":"ready","projectIds":["missing"],"recoveredAccountIds":[],"syncedAt":"2026-10-22T00:00:00Z"}',
])('存储损坏或失效时恢复初始引导：%s', (value) => {
  localStorage.setItem(WINDOW_STORAGE_KEY, value);
  const recovered = createWindowManager();
  expect(recovered.bound.value).toBe(false);
  expect(recovered.windows.value).toEqual([]);
});

test('存储不可用时本次操作仍生效并给出保存状态', () => {
  const store = createWindowManager();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  expect(store.synchronize(['roxy-P1'])).toBe(true);
  expect(store.bound.value).toBe(true);
  expect(store.storageUnavailable.value).toBe(true);
  expect(store.windows.value).toHaveLength(3);
});
