import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
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

test('套餐独立页面、个人中心套餐状态、权益详情与积分充值入口', async ({ page }, info) => {
  await page.goto('/#/purchase');
  await expect(page.getByRole('heading', { name: '套餐购买', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '基础版', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '专业版', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '商业版', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '企业版', exact: true })).toBeVisible();
  await expect(page.getByText('我的积分', { exact: true })).toHaveCount(0);
  await expect(page.getByText('剩余积分', { exact: true })).toHaveCount(0);
  await expect(page.getByText('当前版本', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('定制化服务', { exact: true })).toContainText('规模化走向全球');

  await page
    .getByLabel('¥2,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await expect(page.getByLabel('¥2,000 套餐', { exact: true })).toContainText('当前版本');
  await expect(page.getByLabel('¥2,000 套餐', { exact: true })).not.toContainText('热门推荐');
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page).toHaveURL(/#\/me$/);
  await expect(page.getByLabel('当前套餐')).toHaveText('商业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('4,045');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('profile-entitlements.png'), fullPage: true });

  await page.getByRole('button', { name: '权益详情' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '商业版权益', exact: true })).toBeVisible();
  await expect(dialog).toContainText('批量发布');
  await expect(dialog).toContainText('内容数据分析');
  await expect(dialog).toContainText('10 个');
  await page.screenshot({ path: info.outputPath('package-benefit-details.png') });
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();

  await page.getByRole('button', { name: '升级套餐', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByLabel('¥2,000 套餐', { exact: true })).toContainText('当前版本');
  await page.screenshot({ path: info.outputPath('purchase-current-version.png'), fullPage: true });
  await page.getByLabel('¥5,000 套餐', { exact: true }).getByRole('checkbox').uncheck();
  await page
    .getByLabel('¥5,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await page.getByRole('button', { name: '积分充值', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase\?tab=credits$/);
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('tab', { name: '积分充值', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('tab', { name: '积分充值', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page
    .getByLabel('¥500 积分充值', { exact: true })
    .getByRole('button', { name: '立即充值', exact: true })
    .click();
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('16,990');
  await page.reload();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('16,990');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('profile-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '权益详情' }).click();
  await expect(dialog.getByRole('heading', { name: '企业版权益', exact: true })).toBeVisible();
  await expect(dialog).toContainText('50 人');
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThan(390);
  expect(box!.height).toBeLessThan(844);
  await page.screenshot({ path: info.outputPath('benefit-details-mobile.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '套餐购买', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByLabel('¥5,000 套餐', { exact: true })).toContainText('当前版本');
  await expect(page.getByLabel('¥2,000 套餐', { exact: true })).toContainText('热门推荐');
  await page.reload();
  await expect(page.getByText('当前版本', { exact: true })).toHaveCount(1);
  await expect(page.getByLabel('¥5,000 套餐', { exact: true })).toContainText('当前版本');
  await expect(page.getByText('我的积分', { exact: true })).toHaveCount(0);
  await expect(page.getByText('剩余积分', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('purchase-mobile.png'), fullPage: true });
  await expect(page.getByRole('link', { name: '套餐购买', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('未购买套餐时的权益卡片和详情引导', async ({ page }) => {
  await page.goto('/#/me');
  await expect(page.getByLabel('当前套餐')).toHaveText('未购买套餐');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('100');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.getByRole('button', { name: '权益详情' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('当前尚未购买套餐');
  await expect(dialog.getByLabel('平台功能权益')).toHaveCount(0);
  await dialog.getByRole('button', { name: '查看套餐', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
});

test('定制服务卡片随内容自适应，完整展示平台并支持联系销售', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const custom = page.getByRole('region', { name: '定制化服务', exact: true });
  await expect(custom.getByRole('heading', { name: /让品牌内容，\s*规模化走向全球/ })).toBeVisible();
  await expect(custom).toContainText('定制适合业务的增长工作流');
  const stats = custom.getByLabel('服务规模数据');
  await expect(stats).toContainText('服务品牌与团队');
  await expect(stats).toContainText('1,200+');
  await expect(stats).toContainText('已生成视频');
  await expect(stats).toContainText('240万+');
  await expect(stats.locator('dd')).toHaveText(['1,200+', '240万+']);
  await expect(custom).not.toContainText('示例');
  const platformItems = custom.getByRole('list', { name: '覆盖社媒平台', exact: true }).getByRole('listitem');
  await expect(platformItems).toHaveText(['TikTok', 'Instagram', 'YouTube', 'Facebook', 'X', 'LinkedIn']);
  for (const platform of await platformItems.all()) await expect(platform).toBeVisible();
  await custom.screenshot({ path: info.outputPath('enterprise-services-desktop.png') });
  await custom.getByRole('button', { name: '联系销售', exact: true }).click();
  const contact = page.getByRole('dialog');
  await expect(contact.getByRole('heading')).toHaveText('添加企业微信联系销售');
  const qr = contact.getByRole('img', { name: '企业微信二维码', exact: true });
  await expect(qr).toHaveAttribute('src', /\/wecom-qr\.png$/);
  await expect
    .poll(() => qr.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  await expect(contact).toContainText('定制化方案请扫码添加销售沟通需求');
  await expect(contact).not.toContainText('备注充值档位');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = (await custom.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(await custom.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  for (const platform of await platformItems.all()) await expect(platform).toBeVisible();
  await expect(custom.getByRole('button', { name: '联系销售', exact: true })).toBeVisible();
  await expect(stats).toBeVisible();
  await custom.screenshot({ path: info.outputPath('enterprise-services-mobile.png') });
  await custom.getByRole('button', { name: '联系销售', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(contact.getByRole('heading')).toHaveText('添加企业微信联系销售');
  expect(await page.evaluate(() => localStorage.getItem('chuhai-credits-v1:demo'))).toBeNull();
});
