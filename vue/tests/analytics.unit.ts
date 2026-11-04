import { identityService } from '@/services/identity';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { useWindowManager, WINDOW_STORAGE_KEY, createWindowManager } from '@/composables/useWindowManager';
import { useAnalyticsStages, STAGES_STORAGE_KEY } from '@/composables/useAnalyticsStages';
import { available, growthMetric, summarizeVideos, videoAvailability } from '@/lib/analytics';
import { sumMetrics, formatCount } from '@/lib/windowMetrics';
import MetricValue from '@/components/analytics/MetricValue.vue';
import type { PublishedVideo } from '@/types/windows';
const manager = useWindowManager();
const stages = useAnalyticsStages();
let wrapper: VueWrapper | undefined;
let warnings: string[] = [];
beforeEach(() => {
  identityService.demo();
  localStorage.clear();
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  manager.reload();
  stages.reload();
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
async function open(path = '/analytics') {
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
function button(name: string, root: ParentNode = document) {
  const el = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) =>
      (item.getAttribute('aria-label') ?? item.textContent)?.replace(/\s/g, '') === name.replace(/\s/g, ''),
  );
  if (!el) throw new Error(`Missing button ${name}`);
  return el;
}
async function click(name: string, root?: ParentNode) {
  button(name, root).click();
  await flushPromises();
}
function dialog() {
  const el = document.querySelector('[role="dialog"]');
  if (!el) throw new Error('Missing dialog');
  return el;
}
async function select(label: string, value: string) {
  if (!wrapper) throw new Error('Missing app');
  await wrapper.find(`select[aria-label="${label}"]`).setValue(value);
  await flushPromises();
}
const fixture = (id: string): PublishedVideo => ({
  id,
  accountId: 'test',
  title: id,
  publishedAt: '2026-10-01',
  duration: '00:30',
  collection: { kind: 'ready', since: '2026-07-25', collectedAt: '2026-10-22T10:00:00Z' },
  daily: [{ date: '2026-10-22', views: 10, likes: 2, comments: 0 }],
});

test('未绑定时展示同步入口，窗口页不再内嵌内容报表', async () => {
  const { app, router } = await open();
  expect(app.text()).toContain('先同步窗口');
  await click('去同步窗口');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy'));
  manager.synchronize(['roxy-P1']);
  await flushPromises();
  expect(app.text()).not.toContain('数据概览');
  expect(app.text()).not.toContain('播放量');
});

test('窗口查看数据跳转保留项目窗口和平台，返回后绑定不变', async () => {
  manager.synchronize(['roxy-P1']);
  const { app, router } = await open('/roxy?window=W-P1-1');
  await click('查看此窗口数据');
  expect(router.currentRoute.value.path).toBe('/analytics');
  expect(router.currentRoute.value.query).toMatchObject({
    tab: 'compare',
    project: 'P1',
    window: 'W-P1-1',
    platform: 'TikTok',
  });
  expect(app.find<HTMLSelectElement>('select[aria-label="分析窗口"]').element.value).toBe('W-P1-1');
  expect(app.text()).toContain('TikTok · 按窗口对比');
  await click('管理窗口');
  expect(manager.selectedProjectIds.value).toEqual(['roxy-P1']);
});

test('总览使用同一份去重数据，部分覆盖明确标注，移除未验证判断和转化模块', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2', 'roxy-P3', 'roxy-P5']);
  const { app } = await open();
  const summary = summarizeVideos(manager.videos.value, 7);
  expect(app.text()).toContain(`已覆盖 ${summary.included}/${summary.total}`);
  const views = summary.metrics.views;
  if (views.kind !== 'available') throw new Error('Expected partial data');
  expect(app.text()).toContain(formatCount(views.value));
  expect(app.text()).toContain('部分数据');
  for (const word of ['流量池', '5A', 'ROAS', '成交订单', '点击次数', '号损率', '停止推流'])
    expect(app.text()).not.toContain(word);
  expect(app.find('svg').exists()).toBe(true);
});

test('范围、项目、平台筛选写入地址并更新内容，查询参数变化可恢复', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2']);
  const { app, router } = await open();
  await select('分析项目', 'P2');
  await select('分析平台', 'YouTube');
  await click('近 30 天');
  await click('内容明细');
  expect(router.currentRoute.value.query).toMatchObject({
    project: 'P2',
    platform: 'YouTube',
    days: '30',
    tab: 'content',
  });
  expect(app.find('tbody').text()).toContain('TechNova');
  expect(app.find('tbody').text()).not.toContain('GlowUp');
  await router.push('/analytics?tab=accounts&project=P1&platform=TikTok');
  await flushPromises();
  expect(app.text()).toContain('运营阶段为内部标签');
  expect(app.find('tbody').text()).not.toContain('TechNova');
});

test('内部运营阶段持久化，不改变登录或可发布账号状态', async () => {
  manager.synchronize(['roxy-P2']);
  const { app } = await open('/analytics?tab=accounts&platform=YouTube');
  await select('运营阶段 TechNova 日更号 YouTube', '放量期');
  expect(JSON.parse(localStorage.getItem(STAGES_STORAGE_KEY) ?? '{}')['A-P2-2-YouTube']).toBe('放量期');
  stages.reload();
  await flushPromises();
  expect(stages.stageFor('A-P2-2-YouTube')).toBe('放量期');
  expect(manager.accounts.value.find((a) => a.id === 'A-P2-2-YouTube')?.status).toBe('登录失效');
  await select('筛选运营阶段', '放量期');
  expect(app.findAll('tbody tr')).toHaveLength(1);
  expect(app.find('tbody').text()).toContain('日更号');
});

test('共用账号只统计一次，窗口对比合计按内容去重而非逐行相加', async () => {
  manager.synchronize(['roxy-P1']);
  expect(manager.accounts.value).toHaveLength(5);
  expect(manager.accountWindows('A-P1-1-YouTube')).toHaveLength(2);
  const { app } = await open('/analytics?tab=compare&project=P1&platform=YouTube');
  for (const box of app.findAll('tbody input[type="checkbox"]')) await box.setValue(true);
  await click('对比表现');
  expect(dialog().textContent).toContain('共用账号');
  const cells = dialog().querySelectorAll('tbody tr td:nth-child(2)');
  const sum = [...cells].reduce(
    (total, cell) => total + Number(cell.textContent?.trim().replaceAll(',', '')),
    0,
  );
  const unique = Number(
    dialog().querySelector('tfoot td:nth-child(2)')?.textContent?.trim().replaceAll(',', ''),
  );
  expect(unique).toBeLessThan(sum);
  const expected = summarizeVideos(manager.accountVideos('A-P1-1-YouTube'), 7).metrics.views;
  expect(expected.kind === 'available' ? expected.value : -1).toBe(unique);
});

test('对比上限、同平台限制和条件切换清理', async () => {
  manager.synchronize(['roxy-P1', 'roxy-P2', 'roxy-P5']);
  const { app } = await open('/analytics?tab=compare');
  const boxes = app
    .findAll('tbody input[type="checkbox"]')
    .filter((box) => box.attributes('disabled') === undefined);
  for (const box of boxes.slice(0, 5)) await box.setValue(true);
  expect(app.text()).toContain('最多选择 4 项');
  expect(app.text()).toContain('已选 4 / 4');
  await select('对比平台', 'YouTube');
  expect(app.text()).toContain('已选 0 / 4');
  expect(button('对比表现').disabled).toBe(true);
  await click('按视频');
  for (const box of app.findAll('tbody input[type="checkbox"]').slice(0, 2)) await box.setValue(true);
  await click('对比表现');
  expect(dialog().textContent).toContain('YouTube · 视频表现对比');
  await click('关闭', dialog());
  await select('分析项目', 'P1');
  expect(app.text()).toContain('已选 0 / 4');
});

test('不完整历史禁止加入对比，完整平台仍支持跨平台比较', async () => {
  manager.synchronize(['roxy-P1']);
  const { app } = await open('/analytics?tab=compare&platform=Instagram');
  expect(app.findAll('tbody input[disabled]').length).toBeGreaterThan(0);
  expect(app.find('tbody').text()).toContain('历史不足');
  await select('分析平台', 'all');
  await click('按平台');
  const enabled = app
    .findAll('tbody input[type="checkbox"]')
    .filter((el) => el.attributes('disabled') === undefined);
  for (const box of enabled.slice(0, 2)) await box.setValue(true);
  await click('对比表现');
  expect(dialog().textContent).toContain('跨平台整体表现对比');
});

test('单视频高级指标保持平台差异，不从当前播放倒推首小时数据', async () => {
  manager.synchronize(['roxy-P2']);
  const { app } = await open('/analytics?tab=content&platform=YouTube');
  await click('查看详情');
  expect(dialog().textContent).toContain('采集能力未验证');
  expect(dialog().textContent).toContain('未记录发布后 1 小时时点快照');
  expect(dialog().textContent).not.toContain('流量池');
  expect(dialog().querySelector('svg')).not.toBeNull();
  await click('关闭', dialog());
  await select('分析平台', 'TikTok');
  expect(app.find('tbody').text()).not.toContain('YouTube');
});

test('账号详情可进入视频详情，只有一个模态窗口', async () => {
  manager.synchronize(['roxy-P1']);
  await open('/analytics?tab=accounts&account=A-P1-1-TikTok');
  expect(dialog().textContent).toContain('账号详情');
  const video = manager.accountVideos('A-P1-1-TikTok')[0];
  const el = [...dialog().querySelectorAll<HTMLButtonElement>('button')].find((b) =>
    b.textContent?.includes(video.title),
  );
  if (!el) throw new Error('Missing account video');
  el.click();
  await flushPromises();
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(dialog().textContent).toContain(video.title);
  expect(dialog().textContent).toContain('前 3 秒留存');
});

test('首次采集不伪造历史，采集失败与登录失效分开处理', async () => {
  manager.synchronize(['roxy-P5']);
  await open('/analytics?tab=accounts&account=A-P5-2-TikTok');
  expect(dialog().textContent).toContain('未采集');
  await click('重新采集（演示）');
  expect(button('正在采集…').disabled).toBe(true);
  await vi.advanceTimersByTimeAsync(1200);
  await flushPromises();
  expect(
    manager
      .accountVideos('A-P5-2-TikTok')
      .every((v) => v.collection.kind === 'ready' && v.collection.since === '2026-10-22'),
  ).toBe(true);
  expect(dialog().textContent).toContain('历史不足');
  expect(createWindowManager().accountVideos('A-P5-2-TikTok')[0].collection.kind).toBe('ready');
});

test('窗口重置同时清理运营标签，保留访问验证', () => {
  manager.synchronize(['roxy-P1']);
  stages.setStage('A-P1-1-TikTok', '放量期');
  manager.reset();
  expect(stages.stageFor('A-P1-1-TikTok')).toBe('未分阶段');
  expect(localStorage.getItem(STAGES_STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(ACCESS_STORAGE_KEY)).toBe(__ACCESS_PASSWORD_HASH__);
});

test('旧版本绑定可读取，账号标识及恢复记录兼容', () => {
  localStorage.setItem(
    WINDOW_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      kind: 'ready',
      projectIds: ['roxy-P2'],
      recoveredAccountIds: ['A-P2-2-YouTube'],
      syncedAt: '2026-10-22T10:00:00Z',
    }),
  );
  const restored = createWindowManager();
  expect(restored.bound.value).toBe(true);
  expect(restored.accounts.value.find((a) => a.id === 'A-P2-2-YouTube')?.status).toBe('正常');
});

test('真实零值、未采集、历史不足和采集失败保持不同状态', () => {
  const zero = { ...fixture('zero'), daily: [{ date: '2026-10-22', views: 0, likes: 0, comments: 0 }] };
  expect(summarizeVideos([zero], 7).metrics.views).toMatchObject({ kind: 'available', value: 0 });
  const uncollected: PublishedVideo = { ...fixture('new'), collection: { kind: 'uncollected' } };
  const failed: PublishedVideo = {
    ...fixture('failed'),
    collection: { kind: 'failed', reason: '登录校验失败' },
  };
  const short: PublishedVideo = {
    ...fixture('short'),
    collection: { kind: 'ready', since: '2026-10-22', collectedAt: '2026-10-22T10:00:00Z' },
  };
  expect(videoAvailability(uncollected, 7)).toMatchObject({ kind: 'unavailable', reason: '未采集' });
  expect(videoAvailability(failed, 7)).toMatchObject({ kind: 'unavailable', reason: '采集失败' });
  expect(videoAvailability(short, 7)).toMatchObject({ kind: 'unavailable', reason: '历史不足' });
  const summary = summarizeVideos([fixture('same'), fixture('same'), uncollected, failed], 7);
  expect(summary.metrics.views).toMatchObject({ kind: 'available', value: 10, included: 1, total: 3 });
  expect(sumMetrics(summary.videos, 7).views).toBe(10);
});

test('真实的 0 在指标组件中显示，缺失值用文字和原因展示', () => {
  wrapper = mount(MetricValue, { props: { datum: available(0) } });
  expect(wrapper.text()).toBe('0');
  wrapper.unmount();
  wrapper = mount(MetricValue, {
    props: { datum: { kind: 'unavailable', reason: '历史不足', detail: '仅有今天的记录' } },
  });
  expect(wrapper.text()).toContain('历史不足');
  expect(wrapper.text()).not.toContain('0');
  expect(wrapper.attributes('title')).toBe('仅有今天的记录');
});

test('共用账号在任务中只选择一次，并能切换执行窗口', async () => {
  manager.synchronize(['roxy-P1']);
  const { app } = await open('/tasks/new?project=P1');
  await click('YouTube', app.find('main').element);
  const first = app.find('button[aria-label="选择 GlowUp 官方 YouTube · GlowUp · 品牌主窗口"]');
  const second = app.find('button[aria-label="选择 GlowUp 官方 YouTube · GlowUp · 内容增长窗口"]');
  await first.trigger('click');
  expect(first.attributes('aria-pressed')).toBe('true');
  expect(second.attributes('aria-pressed')).toBe('false');
  await second.trigger('click');
  expect(second.attributes('aria-pressed')).toBe('true');
  expect(first.attributes('aria-pressed')).toBe('false');
  expect(app.text()).toContain('已选择 1 个发布账号');
});

test('账号恢复登录后仍需单独采集，登录状态不冒充数据状态', () => {
  manager.synchronize(['roxy-P3']);
  const id = 'A-P3-1-X';
  expect(manager.retryCollection(id)).toBe(false);
  manager.synchronize(['roxy-P3'], [id]);
  expect(manager.accounts.value.find((a) => a.id === id)?.status).toBe('正常');
  expect(manager.accountVideos(id).every((video) => video.collection.kind === 'failed')).toBe(true);
  expect(manager.retryCollection(id)).toBe(true);
  expect(manager.accountVideos(id).every((video) => video.collection.kind === 'ready')).toBe(true);
});

test('周涨粉只由粉丝快照计算，包含负增长及历史不足', () => {
  manager.synchronize(['roxy-P1']);
  const account = manager.accounts.value[0];
  expect(
    growthMetric({
      ...account,
      followerHistory: [
        { date: '2026-10-22', count: 150 },
        { date: '2026-10-15', count: 200 },
      ],
    }),
  ).toMatchObject({ kind: 'available', value: -50 });
  expect(growthMetric({ ...account, followerHistory: [{ date: '2026-10-22', count: 150 }] })).toMatchObject({
    kind: 'unavailable',
    reason: '历史不足',
  });
});

test('带筛选的分析页跳转窗口详情后不会被查询参数监听拉回', async () => {
  manager.synchronize(['roxy-P1']);
  const { router } = await open('/analytics?tab=accounts&project=P1&platform=YouTube');
  await click('查看账号');
  await click('管理所属窗口');
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/roxy'));
  await flushPromises();
  await flushPromises();
  expect(router.currentRoute.value.fullPath).toBe('/roxy?window=W-P1-1');
  expect(dialog().textContent).toContain('GlowUp · 品牌主窗口');
});
