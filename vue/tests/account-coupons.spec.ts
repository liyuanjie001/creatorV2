import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';

const token = createHash('sha256').update(loadEnv('production', process.cwd(), 'password').password ?? '').digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(accessToken => {
    localStorage.setItem('chuhai-access-token', accessToken);
    localStorage.setItem('chuhai-studio-session', JSON.stringify({ id: 'demo', name: '林悦', identity: 'demo@chuhai.studio', method: 'email', bindings: ['email'] }));
  }, token);
});

test('个人四档和团队三档按周期计价，赠券数量不随席位变化', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const names = ['基础版', '标准版', '高级版', '旗舰版'];
  for (const edition of ['个人版', '团队版']) {
    await page.getByText(edition, { exact: true }).click();
    await expect(page.getByRole('radio', { name: edition, exact: true })).toBeChecked();
    for (const period of ['按季购买', '按年购买']) {
      await page.getByText(period, { exact: true }).click();
      await expect(page.getByRole('radio', { name: period, exact: true })).toBeChecked();
      const multiplier = period === '按季购买' ? 1 : 4;
      for (let i = 0; i < names.length; i++) {
        if (edition === '团队版' && i === 0) {
          await expect(page.getByRole('article', { name: '基础版套餐', exact: true })).toHaveCount(0);
          continue;
        }
        const card = page.getByRole('article', { name: `${names[i]}套餐`, exact: true });
        const accounts = [2, 5, 10, 30][i]!;
        const total = edition === '团队版' ? 2 * [0, 700, 1000, 2500][i]! * multiplier
          : [500, 1000, 2000, 5000][i]! * multiplier + [84, 200, 360, 900][i]!;
        await expect(card.getByLabel('应付总价')).toHaveText(`¥${total.toLocaleString('zh-CN')}`);
        await expect(card).not.toContainText('应付总价');
        await expect(card).not.toContainText('套餐基础价');
        await expect(card).not.toContainText('限本人使用');
        if (edition === '团队版') {
          await expect(card.getByLabel('单席位价格', { exact: true })).toHaveText(`¥${(total / 2).toLocaleString('zh-CN')}`);
          await expect(card.getByLabel('单席位积分', { exact: true })).toHaveText(([0, 1590, 2500, 6410][i]! * multiplier).toLocaleString('zh-CN'));
          await expect(card).toContainText(`积分 / 席位 / ${multiplier === 4 ? '年' : '季'}`);
        }
        await expect(card.getByRole('button', { name: /购买套餐|续购套餐/ })).toBeVisible();
        const coupon = card.getByRole('button', { name: `免费兑换${accounts}个账号使用权`, exact: true });
        await expect(coupon).toHaveText(`免费兑换${accounts}个账号使用权`);
        await expect(coupon.locator('svg.lucide-info')).toBeVisible();
        await expect(card).not.toContainText('购买后自动兑换');
        await expect(card).not.toContainText('账号将在 3 个工作日内到账');
        await expect(card.getByRole('button', { name: /[增减].*账号使用权/ })).toHaveCount(0);
        await expect(card).not.toContainText(/¥\d+\/个/);
      }
    }
  }
  const standard = page.getByRole('article', { name: '标准版套餐', exact: true });
  await standard.getByRole('button', { name: '增加团队席位' }).click();
  await expect(standard.getByLabel('应付总价')).toHaveText('¥8,400');
  await expect(standard.getByLabel('单席位积分')).toHaveText('6,360');
  const table = page.getByRole('table', { name: '套餐权益对比', exact: true });
  await expect(table.getByRole('row', { name: /^总积分/ }).getByRole('cell')).toHaveText(['19,080', '20,000', '51,280']);
  await page.screenshot({ path: info.outputPath('coupon-packages-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('coupon-packages-mobile.png'), fullPage: true });
});

test('优惠券支持悬停、键盘聚焦和手机点击查看说明', async ({ page, browser }, info) => {
  await page.goto('/#/purchase');
  const coupon = page.getByRole('article', { name: '基础版套餐', exact: true }).getByRole('button', { name: '免费兑换2个账号使用权', exact: true });
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveCount(0);
  await coupon.locator('svg.lucide-info').hover();
  await expect(tooltip).toContainText('购买后自动发放并兑换，无需手动操作。');
  await expect(tooltip).toContainText('美国 TikTok 账号将在 3 个中国法定工作日内到账。');
  await expect(tooltip).toContainText('可在账号管理查看到账进度，到账后通过本平台发布作品。');
  await page.screenshot({ path: info.outputPath('coupon-tooltip-desktop.png') });
  await page.mouse.move(0, 0);
  await expect(tooltip).toHaveCount(0);
  await coupon.focus();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  const mobileContext = await browser.newContext({
    storageState: await page.context().storageState(),
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const mobile = await mobileContext.newPage();
    await mobile.goto(page.url());
    const mobileCoupon = mobile.getByRole('article', { name: '基础版套餐', exact: true }).getByRole('button', { name: '免费兑换2个账号使用权', exact: true });
    await mobileCoupon.tap();
    await expect(mobile.getByRole('tooltip')).toBeVisible();
    expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mobile.screenshot({ path: info.outputPath('coupon-tooltip-mobile.png') });
    await mobileCoupon.tap();
    await expect(mobile.getByRole('tooltip')).toHaveCount(0);
  } finally {
    await mobileContext.close();
  }
});

test('付款自动兑换，刷新保留进度，模拟交付后才出现账号且不重复', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/purchase');
  await page.getByRole('article', { name: '基础版套餐', exact: true }).getByRole('button', { name: '购买套餐' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('赠送账号抵扣券 1 张（可兑换 2 个账号）');
  await expect(dialog).not.toContainText('账号使用权');
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await expect(dialog).toContainText('已到账 961 积分');
  await expect(dialog).toContainText('已自动兑换 2 个账号');
  await expect(dialog).not.toContainText('已到账 2 个账号');
  await dialog.getByRole('button', { name: '查看到账进度' }).click();
  const progress = page.getByRole('region', { name: '套餐账号到账进度' });
  await expect(progress).toContainText('待到账');
  const countAccounts = () => page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-studio-v1:demo') ?? '{"accounts":[]}').accounts.filter((a: { source?: string }) => a.source === 'recharge').length);
  expect(await countAccounts()).toBe(0);
  await page.reload();
  await expect(progress).toContainText('待到账');
  await page.goto('/#/me');
  const history = page.getByLabel('购买记录', { exact: true });
  await expect(history).toContainText('赠送账号抵扣券 1 张');
  await expect(history).toContainText('待到账');
  await page.goto('/#/accounts?tab=deliveries');
  await progress.getByRole('button', { name: '模拟账号到账', exact: true }).click();
  await expect(progress).toContainText('已添加至账号管理');
  await expect(progress.getByRole('button', { name: '模拟账号到账', exact: true })).toHaveCount(0);
  expect(await countAccounts()).toBe(2);
  await page.reload();
  expect(await countAccounts()).toBe(2);
  await page.screenshot({ path: info.outputPath('coupon-delivered-desktop.png'), fullPage: true });
  await page.goto('/#/me');
  await expect(history).toContainText('已添加至账号管理');
  await expect(history).not.toContainText('待到账');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(history).toContainText('赠送账号抵扣券 1 张');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
