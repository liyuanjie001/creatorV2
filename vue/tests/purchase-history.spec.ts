import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript((accessToken) => {
    localStorage.setItem('chuhai-access-token', accessToken);
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
test('purchase history appears below benefits, follows payment and supports mobile details', async ({
  page,
}, info) => {
  await page.goto('/#/me');
  const history = page.getByLabel('购买记录', { exact: true });
  await expect(history).toContainText('暂无购买记录');
  const benefitBox = await page.getByLabel('我的套餐与积分', { exact: true }).boundingBox();
  const historyBox = await history.boundingBox();
  expect(historyBox!.y).toBeGreaterThan(benefitBox!.y + benefitBox!.height);
  await page.getByRole('link', { name: '套餐购买', exact: true }).click();
  await page
    .getByLabel('¥500 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '微信支付', exact: true }).click();
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  const table = page.getByRole('table', { name: '购买记录列表', exact: true });
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table).toContainText('¥500 / 933 积分');
  await expect(table).toContainText('微信支付');
  await expect(table).toContainText('账号使用权 2 个 · 已添加至账号管理');
  await table.getByRole('button', { name: /^查看订单/ }).click();
  await expect(dialog.getByRole('heading')).toHaveText('购买记录详情');
  await expect(dialog).toContainText('基础版套餐');
  await expect(dialog).toContainText('支付时间');
  await dialog.getByRole('button', { name: '查看账号', exact: true }).click();
  await expect(page).toHaveURL(/#\/accounts$/);
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('button', { name: '刷新订单', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(page.getByLabel('当前剩余积分')).toHaveText('1,033');
  await page.screenshot({ path: info.outputPath('purchase-history-desktop.png'), fullPage: true });
  await page.reload();
  await expect(table).toContainText('微信支付');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(table).toBeHidden();
  const record = history.getByRole('article');
  await expect(record).toHaveCount(1);
  await expect(record).toContainText('¥500 / 933 积分');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('purchase-history-mobile.png'), fullPage: true });
  await record.getByRole('button', { name: /^查看订单/ }).click();
  await expect(dialog).toContainText('基础版套餐');
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThan(390);
  await page.keyboard.press('Escape');
});
test('old snapshots, pending orders, delivery status, refresh and pagination', async ({ page }, info) => {
  await page.addInitScript(() => {
    const key = 'chuhai-credits-v1:demo';
    if (localStorage.getItem(key)) return;
    const base = { userId: 'demo', channel: 'alipay', status: 'completed' };
    const orders = [
      {
        ...base,
        id: 'legacy-490',
        pack: 'p490',
        amount: 490,
        credits: 1920,
        accountCount: 2,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        ...base,
        id: 'credits-500',
        pack: 'credit500',
        amount: 500,
        credits: 1041,
        accountCount: 0,
        channel: 'wechat',
        createdAt: '2026-11-16T00:00:00Z',
      },
      {
        ...base,
        id: 'pending-500',
        pack: 'p500',
        amount: 500,
        credits: 933,
        accountCount: 2,
        deliveryMode: 'automatic',
        status: 'pending',
        createdAt: '2026-11-17T00:00:00Z',
      },
      {
        ...base,
        id: 'sync-1000',
        pack: 'p1000',
        amount: 1000,
        credits: 1895,
        accountCount: 5,
        deliveryMode: 'automatic',
        createdAt: '2026-11-18T00:00:00Z',
      },
    ];
    localStorage.setItem(key, JSON.stringify({ balance: 3000, total: 3000, orders, claims: [] }));
  });
  await page.goto('/#/me');
  const history = page.getByLabel('购买记录', { exact: true });
  const table = page.getByRole('table', { name: '购买记录列表', exact: true });
  await expect(table).toContainText('¥490 / 1,920 积分');
  await expect(table).toContainText('历史待领取 2 个');
  await expect(table.getByRole('row').nth(1)).toContainText('sync-1000');
  await expect(table.getByRole('row').nth(1)).toContainText('待同步至账号管理');
  const pending = table.getByRole('row').filter({ hasText: 'pending-500' });
  await expect(pending).toContainText('待支付');
  await expect(pending).toContainText('尚未支付');
  await page.screenshot({ path: info.outputPath('purchase-history-mixed-desktop.png'), fullPage: true });
  await page.evaluate(() => {
    const key = 'chuhai-credits-v1:demo';
    const ledger = JSON.parse(localStorage.getItem(key)!);
    for (let index = 0; index < 8; index++)
      ledger.orders.push({
        ...ledger.orders[2],
        id: `extra-${index}`,
        createdAt: `2026-11-19T00:00:0${index}Z`,
      });
    localStorage.setItem(key, JSON.stringify(ledger));
  });
  await page.getByRole('button', { name: '刷新订单', exact: true }).click();
  await expect(history).toContainText('共 12 条记录');
  await expect(table.getByRole('row')).toHaveCount(11);
  await expect(page.getByLabel('当前剩余积分')).toHaveText('3,000');
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table).toContainText('legacy-490');
  await table.getByRole('button', { name: '查看订单 legacy-490', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1,920 积分');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: '前往历史领取', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => localStorage.setItem('chuhai-credits-v1:demo', '{'));
  await page.getByRole('button', { name: '刷新订单', exact: true }).click();
  await expect(history.getByRole('alert')).toContainText('订单读取失败');
  await expect(history).toContainText('共 12 条记录');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('3,000');
});
