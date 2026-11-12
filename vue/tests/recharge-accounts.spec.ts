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
test('套餐数据、TikTok 分批领取、帐号凭据、跨项目直接发布与刷新恢复', async ({ page, context }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/me');
  const cards = page.getByRole('tabpanel', { name: '套餐', exact: true });
  for (const text of ['¥490', '¥1,000', '¥2,000', '¥5,000', '1,920', '4,100', '9,200', '24,245', '1,865'])
    await expect(cards).toContainText(text);
  await expect(cards.getByLabel('套餐社媒帐号权益').last()).toContainText('20');
  await expect(cards.getByLabel('套餐社媒帐号权益').first()).toContainText('TikTok');
  await expect(cards.getByLabel('套餐社媒帐号权益').first()).toContainText('帐号所有权归用户');
  await expect(cards.getByLabel('套餐社媒帐号权益').first()).toContainText('登录信息在帐号管理中查看');
  await expect(cards).not.toContainText('Facebook / Instagram');
  await page.screenshot({ path: info.outputPath('recharge-packages.png'), fullPage: true });
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('TikTok 帐号 × 10');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 10 个社媒帐号名额');
  await dialog.getByRole('button', { name: '领取帐号', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: '确认领取' })).toBeDisabled();
  await expect(dialog.getByLabel('Facebook (FB) 领取数量')).toHaveCount(0);
  await expect(dialog.getByLabel('Instagram (Ins) 领取数量')).toHaveCount(0);
  await dialog.getByLabel('TikTok (TK) 领取数量').fill('3');
  await page.screenshot({ path: info.outputPath('claim-dialog.png'), fullPage: true });
  await dialog.getByRole('button', { name: '确认领取' }).click();
  await expect(dialog).toContainText('已领取 3 个帐号');
  await dialog.getByRole('button', { name: '查看帐号管理' }).click();
  await expect(page.getByLabel('待领取帐号提示')).toContainText('7 个');
  const purchased = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).accounts.filter(
      (a: { source?: string }) => a.source === 'recharge',
    ),
  );
  expect(purchased).toHaveLength(3);
  expect(purchased.every((account: { platform: string }) => account.platform === 'tiktok')).toBe(true);
  for (const account of purchased) {
    await page.goto('/#/accounts/' + account.id);
    const credentials = page.getByLabel('帐号登录信息');
    await expect(credentials).toContainText('帐号所有权归用户');
    await expect(credentials).toContainText(account.loginInfo.username);
    await expect(credentials).not.toContainText(account.loginInfo.password);
    await credentials.getByRole('button', { name: '查看密码' }).click();
    await expect(credentials).toContainText(account.loginInfo.password);
    await credentials.getByRole('button', { name: '复制密码' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(account.loginInfo.password);
    await expect(credentials).toContainText(account.loginInfo.ip);
    await expect(credentials).toContainText('建议使用该帐号所属地区的 IP 登录');
    await page.reload();
    await expect(page.getByLabel('帐号登录信息')).not.toContainText(account.loginInfo.password);
  }
  await page.screenshot({ path: info.outputPath('account-credentials.png'), fullPage: true });
  // A different existing project has no manual association with any purchased account.
  await page.goto('/#/projects/P1?section=publish');
  const work = page
    .getByRole('row')
    .filter({ has: page.getByRole('textbox', { name: '修改视频名称 晨间护肤故事（演示）', exact: true }) });
  await work.getByRole('button', { name: '去发布', exact: true }).click();
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).click();
  const tiktok = purchased[0];
  await page.getByRole('button', { name: '选择 ' + tiktok.handle, exact: true }).click();
  await page.getByLabel('发布文案', { exact: true }).fill('套餐帐号直接发布验证');
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          (id: string) =>
            JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).tasks.find(
              (t: { accountId: string; status: string }) => t.accountId === id,
            )?.status,
          tiktok.id,
        ),
      { timeout: 20000 },
    )
    .toBe('发布成功');
  await page.goto('/#/me');
  await expect(page.getByLabel('社媒帐号权益', { exact: true })).toContainText('7');
  await page.getByRole('button', { name: '领取帐号', exact: true }).click();
  await page.getByLabel('TikTok (TK) 领取数量').fill('2');
  await page.getByRole('button', { name: '确认领取' }).click();
  await expect(page.getByRole('dialog')).toContainText('已领取 2 个帐号');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('9,300');
  await expect(page.getByLabel('社媒帐号权益', { exact: true })).toContainText('待领取');
  expect(errors).toEqual([]);
});
test('购买页签、十一项权益、独立积分充值与帐号购买分别到账', async ({ page }, info) => {
  await page.goto('/#/me');
  await page.getByRole('button', { name: '我购买的账号说明', exact: true }).hover();
  const accountTip = page.getByRole('tooltip');
  await expect(accountTip).toContainText('可直接通过本平台发布至 TikTok');
  await expect(accountTip).toContainText('帐号所有权归用户');
  await expect(accountTip).toContainText('登录信息在帐号管理中查看');
  await page.getByRole('heading', { name: '个人中心', exact: true }).hover();
  await expect(accountTip).toBeHidden();
  const tabs = page.getByRole('tablist', { name: '购买类型' });
  await expect(tabs.getByRole('tab')).toHaveCount(3);
  const bundle = tabs.getByRole('tab', { name: '套餐', exact: true });
  await expect(bundle).toHaveAttribute('aria-selected', 'true');
  const benefits = page.getByRole('tabpanel', { name: '套餐', exact: true }).getByLabel('平台功能权益');
  await expect(benefits).toHaveCount(4);
  for (const list of await benefits.all()) await expect(list.getByRole('listitem')).toHaveCount(11);
  await bundle.focus();
  await bundle.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: '积分充值' })).toHaveAttribute('aria-selected', 'true');
  const creditsPanel = page.getByRole('tabpanel', { name: '积分充值' });
  await expect(creditsPanel.getByLabel('套餐社媒帐号权益')).toHaveCount(0);
  await creditsPanel.getByRole('button', { name: '立即充值', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¥100');
  await expect(dialog).toContainText('到账 400 积分');
  await expect(dialog).not.toContainText('TikTok 帐号 ×');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 400 积分');
  await expect(dialog.getByRole('button', { name: '领取帐号' })).toHaveCount(0);
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('500');
  await tabs.getByRole('tab', { name: '购买账号' }).click();
  const accountPanel = page.getByRole('tabpanel', { name: '购买账号' });
  await page.screenshot({ path: info.outputPath('account-purchase-tab.png'), fullPage: true });
  await accountPanel.getByRole('button', { name: '购买账号', exact: true }).first().click();
  await expect(dialog).toContainText('¥99');
  await expect(dialog).toContainText('TikTok 帐号 × 1');
  await expect(dialog).not.toContainText('到账 0 积分');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 1 个社媒帐号名额');
  await dialog.getByRole('button', { name: '领取帐号' }).click();
  await dialog.getByLabel('TikTok (TK) 领取数量').fill('1');
  await dialog.getByRole('button', { name: '确认领取' }).click();
  await expect(dialog).toContainText('已领取 1 个帐号');
  await dialog.getByRole('button', { name: '查看帐号管理' }).click();
  await expect(page.getByLabel('待领取帐号提示')).toContainText('0 个');
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('500');
  await page.goto('/#/me');
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('500');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ['套餐', '积分充值', '购买账号']) {
    await tabs.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('purchase-tabs-mobile.png'), fullPage: true });
});

test('窄屏套餐和领取表单没有横向溢出', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/me');
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  await page.getByRole('button', { name: '模拟支付成功' }).click();
  await page.getByRole('button', { name: '领取帐号', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('claim-mobile.png'), fullPage: true });
});
