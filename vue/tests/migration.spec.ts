import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';

const configuredPassword = loadEnv('production', process.cwd(), 'password').password ?? '';
const accessToken = createHash('sha256').update(configuredPassword).digest('hex');

const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]')) errors.push(message.text());
  });
  runtimeErrors.set(page, errors);
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.addInitScript((token) => localStorage.setItem('chuhai-access-token', token), accessToken);
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

const routes = [
  ['/', '工作台'],
  ['/inspiration', '创意中心'],
  ['/notes', '妙记'],
  ['/create', '让你的品牌故事鲜活起来'],
  ['/accounts', '窗口管理'],
  ['/analytics', '数据分析'],
  ['/tasks', '任务管理'],
  ['/tasks/new', '新建任务'],
  ['/projects', '全部项目'],
  ['/projects/new', '品牌'],
  ['/projects/P1', 'GlowUp 美妆出海'],
  ['/assets', '素材'],
  ['/settings', '设置中心'],
  ['/trash', '回收站'],
  ['/me', '我的'],
] as const;

for (const [route, text] of routes)
  test(`页面 ${route}`, async ({ page }) => {
    await page.goto(`/#${route}`);
    await expect(page.locator('#app')).toContainText(text);
    await expect(page.locator('#app')).not.toContainText('Failed to resolve');
    if (route === '/' || route === '/analytics') await expect(page.locator('svg').first()).toBeVisible();
    await test
      .info()
      .attach('page', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });

test('创意中心和设置查询参数、历史导航与重定向', async ({ page }) => {
  await page.goto('/#/trends');
  await expect(page).toHaveURL(/inspiration\?tab=trends/);
  await expect(page.getByText('全球 · 实时热搜榜')).toBeVisible();
  await page.getByRole('button', { name: '妙记', exact: true }).click();
  await expect(page).toHaveURL(/tab=notes/);
  await page.reload();
  await expect(page.getByText('便携咖啡机 · 露营场景宣发')).toBeVisible();
  await page.goto('/#/settings?tab=security');
  await expect(page.getByRole('heading', { name: '账号安全' })).toBeVisible();
});

test('项目详情全部栏目可以切换', async ({ page }) => {
  await page.goto('/#/projects/P1');
  const navigation = page.locator('aside').first();
  for (const name of [
    '项目简报',
    '商品',
    '灵感库',
    '元素',
    'Canvas',
    'AI 聊天',
    'AI 导演',
    '窗口管理',
    '发布管理',
    '数据归因',
    '任务调度',
    '回收站',
    '全部生成',
  ]) {
    await navigation.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('#app')).toContainText(name);
  }
});
