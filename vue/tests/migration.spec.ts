import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';

const configuredPassword = loadEnv('production', process.cwd(), 'password').password ?? '';
const accessToken = createHash('sha256').update(configuredPassword).digest('hex');

const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]')) errors.push(message.text());
  });
  runtimeErrors.set(page, errors);
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.addInitScript(({ token, skipDemo }) => {
    localStorage.setItem('chuhai-access-token', token);
    if (!skipDemo) localStorage.setItem('chuhai-studio-session', JSON.stringify({ id: 'demo', name: '林悦', identity: 'demo@chuhai.studio', method: 'email', bindings: ['email'] }));
  }, { token: accessToken, skipDemo: testInfo.title.includes('登录注册') });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

const routes = [
  ['/', '爆款视频'],
  ['/inspiration', '爆款视频'],
  ['/notes', '妙记'],
  ['/create', '让你的品牌故事鲜活起来'],
  ['/accounts', '帐号管理'],
  ['/analytics', '数据分析'],
  ['/tasks', '任务管理'],
  ['/tasks/new', '新建任务'],
  ['/projects', '全部项目'],
  ['/projects/new', '品牌'],
  ['/projects/P1', 'GlowUp 美妆出海'],
  ['/assets', '素材'],
  ['/settings', '设置中心'],
  ['/trash', '回收站'],
  ['/me', '个人中心'],
  ['/roxy', '窗口管理'],
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

test('爆款视频和设置查询参数、历史导航与重定向', async ({ page }) => {
  await page.goto('/#/trends');
  await expect(page).toHaveURL(/\/trends/);
  await expect(page.getByText('全球 · 实时热搜榜')).toBeVisible();
  await page.goto('/#/notes');
  await expect(page).toHaveURL(/\/notes/);
  await expect(page.getByText('便携咖啡机 · 露营场景宣发')).toBeVisible();
  await page.goto('/#/settings?tab=security');
  await expect(page.getByRole('heading', { name: '账号安全' })).toBeVisible();
});

test('项目导航和创作模式可切换并恢复到地址', async ({ page }) => {
  await page.goto('/#/projects/P1');
  await expect(page.locator('aside[aria-label="一级导航"] nav a')).toHaveText(['项目', '素材库', '爆款视频', '帐号管理', '数据分析']);
  const navigation = page.locator('nav[aria-label="项目导航"]');
  for (const [label, section] of [
    ['自由创作', 'gen'],
    ['产品卡', 'product'],
    ['发布管理', 'publish'],
    ['数据采集', 'analytics'],
  ]) {
    await navigation.getByRole('button', { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(new RegExp(`section=${section}`));
  }
  await navigation.getByRole('button', { name: '自由创作' }).click();
  await navigation.getByRole('button', { name: '专家模式' }).click();
  await expect(navigation.getByRole('button', { name: '专家模式' })).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/section=gen.*mode=expert|mode=expert.*section=gen/);
  await page.reload();
  await expect(page.getByText('历史会话 · 当前项目')).toBeVisible();
  await page.screenshot({path: `/tmp/roxy-navigation-${test.info().project.name}.png`});
  await page.getByRole('button', { name: '项目设置', exact: true }).click();
  await expect(page).toHaveURL(/section=settings/);
});

test('项目下拉高亮当前项目并支持切换和新建', async ({ page }) => {
  await page.goto('/#/projects/P1');
  const trigger = page.getByRole('button', { name: '切换项目', exact: true });
  await trigger.click();
  const menu = page.getByRole('menu', { name: '切换项目' });
  await expect(menu.getByRole('menuitem', { name: 'GlowUp 美妆出海' })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  const target = menu.getByRole('menuitem').filter({ hasNotText: /GlowUp 美妆出海|新建项目/ }).first();
  const targetName = (await target.innerText()).trim();
  await target.click();
  await expect(trigger).toContainText(targetName);
  await trigger.click();
  await page.getByRole('menuitem', { name: '新建项目', exact: true }).click();
  await expect(page).toHaveURL(/#\/projects\/new$/);
});

test('登录注册流程提供验证码并返回原访问页面', async ({ page }) => {
  await page.goto('/#/auth?redirect=/');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await page.getByLabel('手机号 / 邮箱').fill(`user-${Date.now()}@example.com`);
  await page.getByRole('button', { name: '发送验证码' }).click();
  await page.getByLabel('验证码').fill('123456');
  await page.getByLabel('设置新密码').fill('strong-pass-2026');
  await page.getByRole('button', { name: '注册并进入' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByText('还没有项目')).toBeVisible();
});

test('登录注册统一表单支持手机、密码切换和 Google 直达登录', async ({ page }) => {
  await page.goto('/#/auth?redirect=/projects');
  await expect(page.getByLabel('验证码', { exact: true })).toBeVisible();
  await expect(page.getByLabel('登录密码')).toHaveCount(0);
  await page.screenshot({ path: `/tmp/chuhai-auth-${test.info().project.name}.png`, fullPage: true });
  await page.getByLabel('手机号 / 邮箱').fill('13800138000');
  await expect(page.getByLabel('国家区号')).toHaveValue('+86');
  await page.getByLabel('手机号 / 邮箱').fill('+14155552671');
  await expect(page.getByLabel('国家区号')).toHaveCount(0);
  await page.getByRole('button', { name: '密码登录', exact: true }).click();
  await expect(page.getByLabel('登录密码')).toBeVisible();
  await page.getByRole('button', { name: '忘记密码？' }).click();
  await expect(page.getByRole('heading', { name: '找回密码' })).toBeVisible();
  await page.getByRole('button', { name: '返回登录' }).click();
  await page.getByRole('button', { name: '使用 Google 登录' }).click();
  await expect(page).toHaveURL(/#\/projects$/);
});

test('登录注册手机验证、密码重置和验证码登录保持一致', async ({ page }) => {
  await page.goto('/#/auth?redirect=/');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await page.getByLabel('手机号 / 邮箱').fill('13900139000');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.getByLabel('设置新密码').fill('original-pass-2026');
  await page.getByRole('button', { name: '注册并进入' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.evaluate(() => localStorage.removeItem('chuhai-studio-session'));
  await page.reload();
  await page.goto('/#/auth?redirect=/');
  await page.getByRole('button', { name: '密码登录', exact: true }).click();
  await page.getByRole('button', { name: '忘记密码？' }).click();
  await page.getByLabel('手机号 / 邮箱').fill('+8613900139000');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.getByLabel('设置新密码').fill('updated-pass-2026');
  await page.getByRole('button', { name: '重置密码', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('密码已重置');
  await page.getByLabel('登录密码').fill('updated-pass-2026');
  await page.locator('form').getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.evaluate(() => localStorage.removeItem('chuhai-studio-session'));
  await page.reload();
  await page.goto('/#/auth?redirect=/');
  await page.getByLabel('手机号 / 邮箱').fill('13900139000');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.locator('form').getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
});

test('爆款视频支持从输入区上传视频并带入创作', async ({ page }) => {
  await page.goto('/#/inspiration');
  await page.getByLabel('爆款视频链接').waitFor();
  await page.locator('input[type="file"][accept="video/*"]').setInputFiles({
    name: 'reference-video.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('prototype-video'),
  });
  await expect(page.getByText('选择复刻到的项目')).toBeVisible();
  await page.getByRole('button', { name: 'GlowUp 美妆出海', exact: true }).click();
  await expect(page).toHaveURL(/section=gen.*reference=|reference=.*section=gen/);
  await expect(page.getByRole('heading', { name: '自由创作' })).toBeVisible();
  await expect(page.getByText('reference-video.mp4', { exact: true })).toBeVisible();
});

test('链接与推荐卡片复刻选择项目后直接进入 AI 输入框', async ({ page }) => {
  await page.goto('/#/inspiration');
  await page.getByLabel('爆款视频链接').fill('https://www.tiktok.com/@brand/video/123456');
  await page.getByRole('button', { name: '开始复刻' }).click();
  await page.getByRole('button', { name: 'GlowUp 美妆出海', exact: true }).click();
  await expect(page.getByText('爆款复刻参考 · TikTok', { exact: true })).toBeVisible();
  await expect(page.getByText('https://www.tiktok.com/@brand/video/123456', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('爆款复刻参考 · TikTok', { exact: true })).toBeVisible();
  await page.goto('/#/inspiration');
  await page.getByRole('button', { name: '一键翻拍', exact: true }).first().click();
  await page.getByRole('button', { name: '＋ 新建项目' }).click();
  await page.getByLabel('新项目名称').fill('爆款复刻新项目');
  await page.getByRole('button', { name: '创建并开始复刻' }).click();
  await expect(page).toHaveURL(/mode=normal.*reference=/);
  await expect(page.getByText('爆款复刻参考 · TikTok', { exact: true })).toBeVisible();
});

test('TK 帐号可走通模拟授权并保留 Roxy 入口', async ({ page }) => {
  await page.goto('/#/accounts');
  await page.getByRole('button', { name: '添加 TK 帐号' }).click();
  await page.getByRole('button', { name: '前往 TikTok 授权（演示）' }).click();
  await page.getByPlaceholder('@your.brand').fill('playwright.brand');
  await page.getByRole('button', { name: '完成授权' }).click();
  await expect(page.getByText('@playwright.brand')).toBeVisible();
  await page.getByRole('button', { name: '返回帐号列表' }).click();
  await page.getByRole('button', { name: '更多' }).click();
  await page.getByRole('button', { name: 'Roxy 窗口管理 ↗' }).click();
  await expect(page).toHaveURL(/#\/roxy$/);
  await expect(page.getByRole('heading', { name: '窗口管理' })).toBeVisible();
});

test('发布单条成片并在项目分析中区分尚未采集的数据', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  await page.getByRole('button', { name: '配置发布' }).first().click();
  await page.getByLabel(/发布帐号/).selectOption({ label: 'GlowUp Official · @glowup.official' });
  await page.getByLabel(/可见范围/).selectOption('PUBLIC_TO_EVERYONE');
  await page.getByRole('button', { name: '预览并确认发布' }).click();
  await page.getByLabel('我已确认以上帐号、内容、可见范围与披露设置').check();
  await page.getByRole('button', { name: '确认提交发布' }).click();
  await expect(page.locator('span.studio-badge').filter({hasText: /^发布中$/})).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('span.studio-badge').filter({hasText: /^发布成功$/})).toBeVisible({ timeout: 10_000 });
  const navigation = page.locator('nav[aria-label="项目导航"]');
  await navigation.getByRole('button', { name: '数据采集' }).click();
  await page.getByRole('button', { name: '内容明细', exact: true }).click();
  await expect(page.getByText('GlowUp · 晨间护肤短片')).toBeVisible();
  await expect(page.getByRole('cell', { name: '未采集', exact: true }).first()).toBeVisible();
});


test('自由创作输入框放大收起保留提示词', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  const input = page.getByRole('textbox', { name: '创作提示词' });
  await input.fill('为新品创作一条清晨护肤视频，保留这个创作想法。');
  const initial = await input.boundingBox();
  expect(initial?.height).toBe(120);
  await page.getByRole('button', { name: '放大输入框' }).click();
  await expect(page.getByRole('button', { name: '收起输入框' })).toHaveAttribute('aria-expanded', 'true');
  expect((await input.boundingBox())!.height).toBeGreaterThan(initial!.height);
  await expect(input).toHaveValue('为新品创作一条清晨护肤视频，保留这个创作想法。');
  await input.press('Escape');
  await expect(page.getByRole('button', { name: '放大输入框' })).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('为新品创作一条清晨护肤视频，保留这个创作想法。');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await test.info().attach('creation-input', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('爆款视频品类国家与关键词组合筛选', async ({ page }) => {
  await page.goto('/#/inspiration');
  const cards = page.getByRole('button', { name: '一键翻拍', exact: true });
  await expect(cards).toHaveCount(9);
  await page.getByRole('combobox', { name: '品类', exact: true }).selectOption('3C 数码');
  await expect(cards).toHaveCount(2);
  await page.getByRole('combobox', { name: '国家', exact: true }).selectOption('美国');
  await expect(cards).toHaveCount(1);
  await page.getByPlaceholder('搜索灵感关键词、话题、作者…').fill('SoundLab');
  await expect(cards).toHaveCount(1);
  await page.getByPlaceholder('搜索灵感关键词、话题、作者…').fill('不存在的关键词');
  await expect(cards).toHaveCount(0);
  await expect(page.getByText('没有匹配的视频，试试其他关键词、品类或国家')).toBeVisible();
  await page.getByPlaceholder('搜索灵感关键词、话题、作者…').fill('');
  await page.getByRole('combobox', { name: '品类', exact: true }).selectOption('');
  await page.getByRole('combobox', { name: '国家', exact: true }).selectOption('');
  await expect(cards).toHaveCount(9);
});

test('视频管理统一展示创作记录', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  await expect(page.getByRole('heading', { name: /创作记录/ })).toHaveCount(0);
  const expand = page.getByRole('button', { name: '放大输入框' });
  const input = page.getByRole('textbox', { name: '创作提示词' });
  const buttonBox = (await expand.boundingBox())!;
  const inputBox = (await input.boundingBox())!;
  expect(buttonBox.y).toBeGreaterThanOrEqual(inputBox.y);
  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(inputBox.x + inputBox.width);
  await page.getByRole('button', { name: '视频管理', exact: true }).click();
  await expect(page.getByRole('heading', { name: /创作记录/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '成片列表', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '列表视图', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '列表视图', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('生成任务沿轨迹加入视频管理并可查看记录', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  await page.getByRole('textbox', { name: '创作提示词' }).fill('动画回归：清晨护肤视频');
  await page.getByRole('button', { name: /生成.*消耗 20 积分/ }).click();
  await expect(page.locator('[data-task-transfer]')).toBeAttached();
  await expect(page.getByText('生成视频任务提交成功', { exact: true })).toBeVisible();
  await expect(page.locator('[data-task-transfer]')).toHaveCount(0);
  await page.getByRole('button', { name: '查看', exact: true }).click();
  await expect(page).toHaveURL(/section=publish&tab=creations/);
  await expect(page.getByRole('heading', { name: /创作记录/ })).toBeVisible();
});


test('创作提示词自动增高到220像素后滚动', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  const input = page.getByRole('textbox', { name: '创作提示词' });
  expect((await input.boundingBox())!.height).toBe(120);
  await input.fill(Array.from({ length: 30 }, (_, i) => `分镜 ${i}：清晨护肤场景`).join('\n'));
  await expect(input).toHaveCSS('height', '220px');
  await expect(input).toHaveCSS('overflow-y', 'auto');
  await page.getByRole('button', { name: '放大输入框' }).click();
  expect((await input.boundingBox())!.height).toBeGreaterThan(220);
  await input.press('Escape');
  await expect(input).toHaveCSS('height', '220px');
  await input.fill('简短描述');
  await expect(input).toHaveCSS('height', '120px');
});

test('创作页隐藏标题并展示爆款视频瀑布流', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  await expect(page.getByRole('heading', { name: '自由创作', exact: true })).toHaveCount(0);
  const recommendations = page.getByRole('region', { name: '爆款视频推荐' });
  await expect(recommendations.getByRole('button', { name: '一键翻拍', exact: true })).toHaveCount(9);
  await recommendations.getByRole('button', { name: '一键翻拍', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /GlowUp 美妆出海/ }).last()).toBeVisible();
  await page.goto('/#/projects/P1?section=gen&mode=expert');
  await expect(page.getByRole('heading', { name: '专家模式', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '爆款视频推荐' })).toHaveCount(0);
  await expect(page.getByText('历史会话 · 当前项目')).toBeVisible();
});


test('创作记录视图切换共用选择并直接配置发布', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  await expect(page.getByText('统一管理创作内容，预览下载、一键发布，随时追踪发布进度', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '列表视图', exact: true }).click();
  await expect(page.getByRole('table', { name: '创作记录列表' })).toBeVisible();
  const selection = page.getByRole('checkbox', { name: /选择 / }).first();
  await selection.check();
  await page.getByRole('button', { name: '缩略图视图', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /选择 / }).first()).toBeChecked();
  await page.getByRole('button', { name: '发布', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});


test('创作记录按选择展示批量操作与完整时间', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish&view=list');
  await expect(page.getByRole('button', { name: '发布', exact: true })).toHaveCount(0);
  const table = page.getByRole('table', { name: '创作记录列表' });
  await expect(table.getByRole('row').nth(1)).toContainText(/\d{2}:\d{2}:\d{2}/);
  await page.getByRole('checkbox', { name: /选择 / }).first().check();
  await expect(page.getByRole('button', { name: '发布', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '删除', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载', exact: true }).first().click();
  await download;
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('button', { name: '发布', exact: true })).toHaveCount(0);
  await expect(table.getByRole('row')).toHaveCount(1);
});

test('创作记录查看为左右分栏详情弹窗', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish&view=list');
  const table = page.getByRole('table', { name: '创作记录列表' });
  await expect(table.getByRole('button', { name: '预览', exact: true })).toHaveCount(0);
  await expect(table.getByRole('button', { name: '重新生成', exact: true })).toHaveCount(0);
  await table.getByRole('button', { name: /^预览 / }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('创作提示词', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '下载视频', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '重新生成', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '修改视频', exact: true })).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(1120);
  const media = (await dialog.getByLabel('媒体预览').boundingBox())!;
  const details = (await dialog.getByLabel('创作详情').boundingBox())!;
  expect(media.x + media.width).toBeLessThanOrEqual(details.x + 1);
  const prompt = await dialog.locator('.whitespace-pre-wrap').first().innerText();
  await dialog.getByRole('button', { name: '修改视频', exact: true }).click();
  await expect(page).toHaveURL(/editFilm=/);
  await expect(page.getByRole('textbox', { name: '创作提示词' })).toHaveValue(prompt);
});

test('创作记录展示排队生成成功和失败状态', async ({ page }) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  await page.getByRole('textbox', { name: '创作提示词' }).fill('状态回归视频');
  const generate = page.getByRole('button', { name: /生成.*消耗 20 积分/ });
  await generate.click();
  await generate.click();
  await page.getByRole('button', { name: '视频管理', exact: true }).click();
  await page.getByRole('button', { name: '列表视图', exact: true }).click();
  const table = page.getByRole('table', { name: '创作记录列表' });
  await expect(table.getByText('生成中', { exact: true })).toBeVisible();
  await expect(table.getByText('等待中', { exact: true })).toBeVisible();
  await table.getByRole('row').filter({ hasText: '等待中' }).getByRole('button', { name: '取消生成' }).click();
  await expect(table.getByText('失败', { exact: true })).toBeVisible();
  await expect(table.getByRole('button', { name: '重试生成' })).toBeVisible();
  await expect(table.getByText('成功', { exact: true })).toHaveCount(2, { timeout: 10000 });
});

test('去发布进入二级页面并恢复配置草稿', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish&view=list');
  await page.getByRole('button', { name: '去发布', exact: true }).first().click();
  await expect(page).toHaveURL(/tab=configure/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const config = page.getByRole('region', { name: '发布配置页面' });
  await expect(config).toBeVisible();
  await config.locator('textarea').fill('发布草稿恢复测试');
  await page.reload();
  await expect(page.getByRole('region', { name: '发布配置页面' }).locator('textarea')).toHaveValue('发布草稿恢复测试');
  await page.getByRole('button', { name: '预览并确认发布' }).click();
  await expect(page.getByRole('heading', { name: /发布前确认/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '返回创作记录' }).click();
  await expect(page.getByRole('table', { name: '创作记录列表' })).toBeVisible();
});
