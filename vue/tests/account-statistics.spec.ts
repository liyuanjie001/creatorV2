import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.setItem('chuhai-access-token', token);
    localStorage.setItem(
      'chuhai-studio-session',
      JSON.stringify({
        id: 'demo',
        name: '林悦',
        identity: 'demo@chuhai.studio',
        method: 'email',
        bindings: ['email'],
      }),
    );
  }, token);
});

test('帐号统计、搜索独立、精简视频播放器及平台按钮', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/accounts/demo-facebook');
  await expect(page.getByRole('heading', { name: 'GlowUp Facebook', exact: true })).toBeVisible();
  const social = page.getByRole('definition');
  await expect(social.first()).toContainText('190');
  await expect(page.getByLabel('帐号社交数据')).toContainText('粉丝');
  await expect(page.getByRole('region', { name: '发布统计', exact: true })).toHaveCount(0);
  await expect(page.getByRole('table', { name: '每日播放数据' })).toHaveCount(1);
  const card = page.getByRole('region', { name: '帐号信息', exact: true });
  expect((await card.boundingBox())!.height).toBeLessThanOrEqual(180);
  const trend = page.getByRole('region', { name: '近七天播放趋势' });
  expect((await trend.boundingBox())!.height).toBeLessThanOrEqual(350);
  for (const metric of ['7天播放量', '主页浏览量', '点赞', '评论', '分享', '粉丝']) {
    await trend.getByRole('button', { name: metric, exact: true }).click();
    await expect(trend.getByRole('button', { name: metric, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(trend.getByRole('table', { name: metric === '7天播放量' ? '每日播放数据' : metric + '每日数据', exact: true })).toHaveCount(1);
  }
  await page.screenshot({ path: '/tmp/account-trend-' + info.project.name + '.png', fullPage: true });
  await expect(page.getByRole('columnheader', { name: '点赞', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '评论', exact: true })).toBeVisible();
  const before = await page.getByLabel('趋势指标').innerText();
  await page.getByLabel('搜索帐号已发布内容').fill('不匹配');
  await expect(page.getByRole('table', { name: '帐号已发布列表' })).toContainText('暂无符合条件');
  expect(await page.getByLabel('趋势指标').innerText()).toBe(before);
  await page.getByLabel('搜索帐号已发布内容').fill('');
  await page.getByRole('button', { name: /^查看 / }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('媒体预览')).toContainText('本机未保存');
  await expect(dialog.getByLabel('创作详情')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: '去 Facebook 查看' })).toBeVisible();
  await dialog.getByRole('button', { name: '去 Facebook 查看' }).click();
  await expect(page.getByText('平台查看暂未接入', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByLabel('帐号社交数据')).toContainText('190');
  await page.screenshot({ path: '/tmp/account-statistics-' + info.project.name + '.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('缺失统计、真实零值、图文预览与采集失败', async ({ page }) => {
  await page.goto('/#/accounts/demo-instagram');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    delete state.accounts.find((a: { id: string }) => a.id === 'demo-instagram').statistics;
    const c = state.content.find((c: { id: string }) => c.id === 'demo-instagram-content');
    c.collection = '可用';
    c.snapshots = [{ date: '2026-11-09', views: 0, likes: 0, comments: 0, shares: 0 }];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByLabel('帐号社交数据')).toContainText('—');
  await expect(page.getByLabel('近七天播放趋势')).toContainText('暂无近七天播放数据');
  await expect(page.getByRole('region', { name: '发布统计', exact: true })).toHaveCount(0);
  const row = page.getByRole('table', { name: '帐号已发布列表' }).locator('tbody tr').first();
  await expect(row.locator('td').nth(3)).toHaveText('0');
  await expect(row.locator('td').nth(4)).toHaveText('0');
  await expect(row.locator('td').nth(5)).toHaveText('0');
  await row.getByRole('button', { name: /^查看 / }).click();
  await expect(page.getByRole('dialog').getByLabel('创作详情')).toHaveCount(0);
  await expect(page.getByRole('dialog').getByLabel('平台查看入口')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.content.find((c: { id: string }) => c.id === 'demo-instagram-content').collection = '采集失败';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(
    page.getByRole('table', { name: '帐号已发布列表' }).locator('tbody tr').first().locator('td').nth(3),
  ).toHaveText('—');
});

test('三个平台播放入口及作品完整详情汇总', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=publish');
  await expect(page.getByRole('heading', { name: '我的作品', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    for (const id of ['demo-facebook-content', 'demo-instagram-content']) {
      const c = state.content.find((c: { id: string }) => c.id === id);
      c.type = '视频';
      c.filmId = 'film-example-free';
    }
    const tk = state.content.find((c: { accountId: string }) => c.accountId === 'tk-glow');
    tk.filmId = 'film-example-free';
    tk.type = '视频';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: '我的作品', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  for (const [id, platform] of [
    ['tk-glow', 'TikTok'],
    ['demo-facebook', 'Facebook'],
    ['demo-instagram', 'Instagram'],
  ]) {
    await page.goto('/#/accounts/' + id);
    await page.getByLabel('已发布内容类型').selectOption('视频');
    await page
      .getByRole('button', { name: /^查看 / })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: '去 ' + platform + ' 查看', exact: true })).toBeVisible();
    await expect(dialog.getByLabel('创作详情')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: '关闭', exact: true })).toBeVisible();
    if (platform === 'Facebook')
      await page.screenshot({ path: '/tmp/account-player-' + info.project.name + '.png' });
    await page.keyboard.press('Escape');
  }
  await page.goto('/#/projects/P1?section=publish');
  const search = page.getByRole('textbox', { name: '搜索视频', exact: true });
  await search.fill('晨间护肤故事');
  await search.press('Enter');
  await page
    .getByRole('button', { name: /^查看 / })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('创作详情')).toBeVisible();
  for (const platform of ['TikTok', 'Facebook', 'Instagram'])
    await expect(dialog.getByRole('button', { name: '去 ' + platform + ' 查看', exact: true })).toBeVisible();
});

test('帐号卡片整合资料与关联项目，移除发布统计板块', async ({ page }, info) => {
  await page.goto('/#/accounts/demo-facebook');
  await expect(page.getByRole('heading', { name: 'GlowUp Facebook', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    const account = state.accounts.find((a: { id: string }) => a.id === 'demo-facebook');
    account.name = '海外生活方式与护肤内容官方帐号'.repeat(4);
    account.note = '检查长备注自动换行与资料卡片布局。'.repeat(12);
    state.projects.push({
      id: 'layout-project',
      name: '关联项目布局测试',
      desc: '',
      color: '#11a3fd',
      accountIds: ['demo-facebook'],
      archived: false,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const card = page.getByRole('region', { name: '帐号信息', exact: true });
  for (const label of ['地区', '分组', '登录状态', '备注', '授权时间', '关联项目'])
    await expect(card).toContainText(label);
  await expect(card.getByText('用户名', { exact: true })).toHaveCount(0);
  await expect(card.getByText('播放平均数', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '发布统计', exact: true })).toHaveCount(0);
  expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/account-card-' + info.project.name + '.png', fullPage: true });
  await card.getByRole('button', { name: '关联项目布局测试', exact: true }).click();
  await expect(page).toHaveURL(/projects\/layout-project/);
});
