import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
test.use({ actionTimeout: 15000 });
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');

const accountHelp = [
  '购买后可选择Tiktok、Instagram、Facebook账号，覆盖100+国家地区',
  '可直接通过本平台发布视频、图文等作品',
  '帐号所有权归用户',
  '登录信息在帐号管理中查看',
];
async function setClaimRow(
  page: Page,
  index: number,
  platform: string,
  country: string,
  option: string,
  quantity: number,
) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(`第 ${index} 组平台`, { exact: true }).selectOption(platform);
  const input = dialog.getByRole('combobox', { name: `第 ${index} 组国家地区`, exact: true });
  await input.click();
  await input.fill(country);
  await page.getByRole('option', { name: option, exact: true }).click();
  await dialog.getByLabel(`第 ${index} 组领取数量`, { exact: true }).fill(String(quantity));
}

async function publishPurchasedAccounts(
  page: Page,
  accounts: { id: string; platform: string; handle: string }[],
  caption: string,
) {
  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index]!;
    if (index) await page.getByRole('button', { name: '添加发布帐号', exact: true }).last().click();
    await page.getByRole('button', { name: '选择发布帐号', exact: true }).nth(index).click();
    await page.getByLabel('筛选帐号平台').selectOption(account.platform);
    const suffix =
      account.platform === 'tiktok'
        ? ''
        : ' · ' + (account.platform === 'instagram' ? 'Instagram' : 'Facebook');
    await page.getByRole('button', { name: '选择 ' + account.handle + suffix, exact: true }).click();
    await page.getByLabel('发布文案', { exact: true }).nth(index).fill(caption);
  }
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ ids, caption }) =>
            JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).tasks.filter(
              (task: { accountId: string; caption: string; status: string }) =>
                ids.includes(task.accountId) && task.caption === caption && task.status === '发布成功',
            ).length,
          { ids: accounts.map((a) => a.id), caption },
        ),
      { timeout: 20000 },
    )
    .toBe(accounts.length);
}
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
test('套餐数据、三平台多地区分批领取、帐号凭据、跨项目直接发布与刷新恢复', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/me');
  const cards = page.getByRole('tabpanel', { name: '套餐', exact: true });
  for (const text of ['¥490', '¥1,000', '¥2,000', '¥5,000', '1,920', '4,100', '9,200', '24,245', '1,865'])
    await expect(cards).toContainText(text);
  await expect(cards.getByLabel('套餐社媒帐号权益').last()).toContainText('20');
  const accountBenefit = cards.getByLabel('套餐社媒帐号权益').first();
  await expect(accountBenefit).toContainText('2 个账号');
  await expect(accountBenefit).toContainText('可选择账号平台和国家地区');
  await expect(accountBenefit).toContainText('账号所有权归用户所有');
  await expect(cards).toContainText('1,920 个积分');
  await cards.getByRole('button', { name: '账号购买说明', exact: true }).first().hover();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('heading', { name: '个人中心', exact: true }).hover();
  await page.screenshot({ path: info.outputPath('recharge-packages.png'), fullPage: true });
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('10 个账号');
  await expect(dialog).toContainText('购买后选择账号平台和国家地区');
  await dialog.getByRole('button', { name: '账号购买说明', exact: true }).hover();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 10 个社媒帐号名额');
  await dialog.getByRole('button', { name: '领取帐号', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: '确认领取' })).toBeDisabled();
  await expect(dialog.getByLabel('第 1 组平台', { exact: true })).toHaveValue('tiktok');
  await expect(dialog.getByRole('combobox', { name: '第 1 组国家地区', exact: true })).toHaveValue('美国');
  await setClaimRow(page, 1, 'tiktok', 'US', '美国 US', 1);
  await dialog.getByRole('button', { name: '添加组合', exact: true }).click();
  await setClaimRow(page, 2, 'instagram', 'Japan', '日本 JP', 1);
  await dialog.getByRole('button', { name: '添加组合', exact: true }).click();
  await setClaimRow(page, 3, 'facebook', '英国', '英国 GB', 1);
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
  expect(
    purchased.map((account: { platform: string; countryCode: string }) => [
      account.platform,
      account.countryCode,
    ]),
  ).toEqual([
    ['tiktok', 'US'],
    ['instagram', 'JP'],
    ['facebook', 'GB'],
  ]);
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
    await credentials.getByRole('button', { name: '复制用户名' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(account.loginInfo.username);
    await credentials.getByRole('button', { name: '复制 IP' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(account.loginInfo.ip);
    await expect(credentials).toContainText(account.loginInfo.ip);
    await expect(credentials).toContainText(account.region);
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
  await publishPurchasedAccounts(page, purchased, '套餐帐号三平台视频发布验证');
  await page.goto('/#/projects/new');
  await page.getByRole('button', { name: '手动创建品牌套件', exact: true }).click();
  await page.getByPlaceholder('你的品牌名称').fill('多地区账号验收项目');
  await page.getByRole('button', { name: '创建项目', exact: true }).click();
  await expect(page).toHaveURL(/projects\/(?!new)[^?]+$/);
  const newProjectUrl = page.url();
  await page.goto(newProjectUrl + '?section=publish');
  await page.getByRole('button', { name: '上传本地作品', exact: true }).click();
  await page
    .getByRole('menuitem', { name: '图集', exact: true })
    .locator('input')
    .setInputFiles({
      name: 'purchased-accounts-gallery.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDuoAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await expect(page).toHaveURL(/tab=configure/);
  await publishPurchasedAccounts(page, purchased, '新项目三平台图文发布验证');
  await page.goto(newProjectUrl + '?section=settings');
  await expect(page.getByText('所有项目可用', { exact: true })).toHaveCount(3);
  await page.goto('/#/me');
  await expect(page.getByLabel('社媒帐号权益', { exact: true })).toContainText('7');
  await page.getByRole('button', { name: '领取帐号', exact: true }).click();
  await setClaimRow(page, 1, 'instagram', 'FR', '法国 FR', 2);
  await page.getByRole('button', { name: '确认领取' }).click();
  await expect(page.getByRole('dialog')).toContainText('已领取 2 个帐号');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('9,300');
  await expect(page.getByLabel('社媒帐号权益', { exact: true })).toContainText('待领取');
  await page.goto('/#/accounts');
  const deletableHandle = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).accounts.find(
      (a: { source?: string; countryCode?: string }) => a.source === 'recharge' && a.countryCode === 'FR',
    ).handle as string,
  );
  const accountRow = page.getByRole('row').filter({ hasText: deletableHandle });
  await accountRow.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除帐号', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: deletableHandle })).toHaveCount(0);
  await expect(page.getByLabel('待领取帐号提示')).toContainText('5 个');
  expect(errors).toEqual([]);
});
test('购买页签、十一项权益、独立积分充值与帐号购买分别到账', async ({ page }, info) => {
  await page.goto('/#/me');
  await page.getByRole('button', { name: '我购买的账号说明', exact: true }).hover();
  const accountTip = page.getByRole('tooltip');
  for (const text of accountHelp) await expect(accountTip).toContainText(text);
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
  await expect(dialog).toContainText('1 个账号');
  await expect(dialog).not.toContainText('到账 0 积分');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 1 个社媒帐号名额');
  await dialog.getByRole('button', { name: '领取帐号' }).click();
  await setClaimRow(page, 1, 'facebook', 'CA', '加拿大 CA', 1);
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
  const infoButton = page
    .getByLabel('套餐社媒帐号权益')
    .first()
    .getByRole('button', { name: '账号购买说明', exact: true });
  await infoButton.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await infoButton.dispatchEvent('pointerup', { pointerType: 'touch' });
  await infoButton.dispatchEvent('click');
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('heading', { name: '个人中心', exact: true }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  await page.getByRole('button', { name: '模拟支付成功' }).click();
  await page.getByRole('button', { name: '领取帐号', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await setClaimRow(page, 1, 'instagram', 'JP', '日本 JP', 1);
  await dialog.getByRole('button', { name: '添加组合' }).click();
  await setClaimRow(page, 2, 'facebook', '英国', '英国 GB', 1);
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('claim-mobile.png'), fullPage: true });
});

test('领取组合增删、数量校验、重复组合合并与交付失败重试锁定', async ({ page }) => {
  await page.goto('/#/me');
  await page.getByRole('button', { name: '立即充值', exact: true }).click();
  await page.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '账号购买说明', exact: true }).focus();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('button', { name: '领取帐号', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('删除第 1 组', { exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '添加组合' }).click();
  await dialog.getByLabel('删除第 2 组', { exact: true }).click();
  await expect(dialog.getByLabel('第 2 组平台', { exact: true })).toHaveCount(0);
  for (const invalid of ['-1', '0.5', '11']) {
    await dialog.getByLabel('第 1 组领取数量', { exact: true }).fill(invalid);
    await expect(dialog.getByRole('button', { name: '确认领取', exact: true })).toBeDisabled();
  }
  await setClaimRow(page, 1, 'instagram', 'Japan', '日本 JP', 1);
  await dialog.getByRole('button', { name: '添加组合' }).click();
  await setClaimRow(page, 2, 'instagram', 'JP', '日本 JP', 1);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('chuhai-studio-v1:')) throw new Error('simulated storage quota');
      original.call(this, key, value);
    };
    Object.assign(window, {
      restoreClaimStorage: () => {
        Storage.prototype.setItem = original;
      },
    });
  });
  await dialog.getByRole('button', { name: '确认领取', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('领取记录已保存');
  await expect(dialog.getByLabel('第 1 组平台', { exact: true })).toBeDisabled();
  await expect(dialog.getByRole('combobox', { name: '第 1 组国家地区', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: '添加组合', exact: true })).toBeDisabled();
  await page.evaluate(() => (window as unknown as { restoreClaimStorage: () => void }).restoreClaimStorage());
  await dialog.getByRole('button', { name: '重试帐号交付', exact: true }).click();
  await expect(dialog).toContainText('已领取 2 个帐号');
  await expect(dialog.getByLabel('领取组合汇总')).toHaveText('Instagram · 日本 × 2');
  await page.reload();
  const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!));
  expect(ledger.claims).toHaveLength(1);
  expect(ledger.claims[0].accounts).toHaveLength(2);
  await expect(page.getByLabel('社媒帐号权益', { exact: true })).toContainText('8');
});
