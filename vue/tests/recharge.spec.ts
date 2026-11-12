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
test('充值扫码演示、余额同步与刷新恢复', async ({ page }, info) => {
  await page.goto('/#/me');
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¥2000');
  await expect(dialog).toContainText('到账 9,200 积分');
  await expect(dialog).toContainText('演示支付，不会实际扣款');
  await expect(dialog.getByRole('button', { name: '支付宝', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(dialog.getByRole('img', { name: /演示支付二维码/ })).toHaveAttribute(
    'src',
    '/demo-alipay-qr.svg',
  );
  await dialog.getByRole('button', { name: '微信支付', exact: true }).click();
  await expect(dialog.getByRole('img', { name: /演示支付二维码/ })).toHaveAttribute(
    'src',
    '/demo-wechat-qr.svg',
  );
  expect(
    await dialog
      .getByRole('img', { name: /演示支付二维码/ })
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('recharge.png') });
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog.getByRole('heading')).toHaveText('支付成功');
  await expect(dialog).toContainText('最新余额：9,300 积分');
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('9,300');
  await dialog.getByRole('button', { name: '稍后领取', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('9,300');
  await expect(page.getByText('9,300 / 9,300', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '支付宝', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('9,300');
  await page.getByRole('button', { name: '联系商务', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText('添加企业微信联系商务经理');
});
