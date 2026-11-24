import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
test.use({ actionTimeout: 15000 });
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');

const accountHelp = [
  '美国 TikTok 账号，付款后自动到账',
  '可直接通过本平台发布视频、图文等作品',
  '购买套餐时，可按需增减账号使用权数量',
];
const bundleExpectations = [
  {
    price: '¥500',
    name: '基础版',
    description: '轻量运营',
    amount: 500,
    credits: 961,
    accounts: 2,
    accountPrice: 42,
  },
  {
    price: '¥1,000',
    name: '专业版',
    description: '个人运营',
    amount: 1000,
    credits: 2272,
    accounts: 5,
    accountPrice: 40,
  },
  {
    price: '¥2,000',
    name: '商业版',
    description: '多账号运营',
    amount: 2000,
    credits: 5000,
    accounts: 10,
    accountPrice: 36,
  },
  {
    price: '¥5,000',
    name: '企业版',
    description: '团队矩阵运营',
    amount: 5000,
    credits: 12820,
    accounts: 30,
    accountPrice: 30,
  },
];
const commonBenefits = [
  '视频一键发布',
  '快速创作',
  '智能创作',
  '账号数据同步',
  '发布结果统计',
  '项目管理（不限制项目个数）',
  '产品卡创建',
  '素材库管理',
];
const standardBenefits = ['图文一键发布', '配置视频/图文 BGM', '定时发布', '爆款视频复刻'];
const advancedBenefits = ['批量发布视频', '批量生成视频', '内容数据分析'];
const creditsOnlyExpectations = [
  { price: '¥500', credits: 1041, videos: 94 },
  { price: '¥1,000', credits: 2173, videos: 197 },
  { price: '¥2,000', credits: 4545, videos: 413 },
  { price: '¥5,000', credits: 11904, videos: 1082 },
];
for (const pack of creditsOnlyExpectations) {
  test(`${pack.price} 独立积分充值按确认额度到账且不新增账号`, async ({ page }) => {
    await page.goto('/#/purchase?tab=credits');
    const card = page.getByLabel(`${pack.price} 积分充值`, { exact: true });
    await expect(card).toContainText(`${pack.credits.toLocaleString()} 个积分`);
    await expect(card).toContainText(`约可生成视频 ${pack.videos.toLocaleString()} 个`);
    await card.getByRole('button', { name: '立即充值' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(pack.price);
    await expect(dialog).toContainText(`到账 ${pack.credits.toLocaleString()} 积分`);
    await expect(dialog).not.toContainText(/单价|账号使用权/);
    await dialog.getByRole('button', { name: '模拟支付成功' }).click();
    await expect(dialog).toContainText(`已到账 ${pack.credits.toLocaleString()} 积分`);
    await dialog.getByRole('button', { name: '完成' }).click();
    await expect(page.getByLabel('积分余额', { exact: true })).toHaveText((100 + pack.credits).toLocaleString());
    expect(await purchasedAccounts(page)).toHaveLength(0);
  });
}

async function purchasedAccounts(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).accounts.filter(
      (a: { source?: string }) => a.source === 'recharge',
    ),
  );
}

async function seedHistorical(page: Page, quantity: number) {
  await page.evaluate((quantity) => {
    const key = 'chuhai-credits-v1:demo';
    const ledger = JSON.parse(
      localStorage.getItem(key) ?? '{"balance":100,"total":100,"orders":[],"claims":[]}',
    );
    ledger.orders.push({
      id: 'legacy-order',
      userId: 'demo',
      pack: 'p490',
      amount: 490,
      credits: 0,
      accountCount: quantity,
      status: 'completed',
      channel: 'alipay',
      createdAt: '2026-11-01',
    });
    localStorage.setItem(key, JSON.stringify(ledger));
  }, quantity);
  await page.goto('/#/accounts');
  await page.reload();
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '领取历史账号', exact: true })).toHaveCount(0);
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
test('套餐数据、自动到账、帐号凭据、跨项目发布与历史余额保留', async ({ page, context }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/purchase');
  const cards = page.getByLabel('购买与充值');
  await expect(page.getByRole('article', { name: /版套餐$/ })).toHaveCount(4);
  for (const pack of bundleExpectations) {
    const card = cards.getByLabel(`${pack.name}套餐`, { exact: true });
    await expect(card.getByRole('heading', { name: pack.name, exact: true })).toBeVisible();
    await expect(card).toContainText(pack.description);
    await expect(card.getByText(`¥${pack.accountPrice}/个`, { exact: true })).toBeVisible();
    await expect(card.getByText(pack.credits.toLocaleString(), { exact: true })).toBeVisible();
    await expect(card.getByText('积分 / 季', { exact: true })).toBeVisible();
    await expect(card.getByLabel('账号使用权数量', { exact: true })).toHaveText(`${pack.accounts} 个`);
    const list = card.getByLabel('平台功能权益');
    for (const label of commonBenefits) await expect(list.getByText(label, { exact: true })).toBeVisible();
    for (const label of standardBenefits)
      await expect(list.getByText(label, { exact: true }).locator('..')).toHaveAttribute('data-supported', String(pack.amount >= 1000));
    for (const label of advancedBenefits)
      await expect(list.getByText(label, { exact: true }).locator('..')).toHaveAttribute('data-supported', String(pack.amount >= 2000));
    await expect(list.getByRole('listitem').filter({ hasText: '可绑定发布账号的个数' })).toHaveText(`可绑定发布账号的个数（${pack.accounts}个）`);
    await expect(list.getByRole('listitem').filter({ hasText: '可发布平台' })).toHaveText('可发布平台（全部平台）');
    await expect(list).not.toContainText('团队协作成员');
    await expect(list.getByRole('heading')).toHaveText(['AI 创作', '账号与发布', '数据分析']);
  }
  await expect(cards).not.toContainText(/成本|利润率|限时优惠|Seedance|480P|¥490/);
  await expect(cards.getByLabel('套餐原价', { exact: true })).toHaveCount(3);
  await cards.getByRole('button', { name: '账号购买说明', exact: true }).first().hover();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
  await page.screenshot({ path: info.outputPath('recharge-packages.png'), fullPage: true });
  await page
    .getByLabel('商业版套餐', { exact: true })
    .getByRole('button', { name: '订阅套餐', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('账号使用权 10 个');
  await expect(dialog).toContainText('美国 TikTok 账号，付款后自动到账');
  await dialog.getByRole('button', { name: '账号购买说明', exact: true }).hover();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 10 个账号');
  await expect(dialog).toContainText('已添加至账号管理');
  await dialog.getByRole('button', { name: '查看账号', exact: true }).click();
  await expect(page).toHaveURL(/#\/accounts$/);
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  const delivered = await purchasedAccounts(page);
  expect(delivered).toHaveLength(10);
  expect(
    delivered.every(
      (a: { platform: string; countryCode: string }) => a.platform === 'tiktok' && a.countryCode === 'US',
    ),
  ).toBe(true);
  const purchased = delivered.slice(0, 3);
  for (const account of purchased) {
    await page.goto('/#/accounts/' + account.id);
    const credentials = page.getByLabel('帐号登录信息');
    await expect(credentials).toContainText('账号使用权');
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
  await expect(page.getByText('所有项目可用', { exact: true })).toHaveCount(10);
  await seedHistorical(page, 7);
  await page.goto('/#/accounts');
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  await page.reload();
  await page.goto('/#/purchase');
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('5,100');
  await expect(page.getByText('我购买的账号', { exact: true })).toHaveCount(0);
  await page.goto('/#/accounts');
  const deletableHandle = delivered.at(-1)!.handle;
  const accountRow = page.getByRole('row').filter({ hasText: deletableHandle });
  await accountRow.getByRole('button', { name: '更多操作', exact: false }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除帐号', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: deletableHandle })).toHaveCount(0);
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  const historicalOrder = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!).orders.find(
      (order: { id: string }) => order.id === 'legacy-order',
    ),
  );
  expect(historicalOrder.accountCount).toBe(7);
  expect(errors).toEqual([]);
});

for (const pack of bundleExpectations) {
  test(`${pack.price} 套餐支付前不入账、支付后额度准确且刷新保留`, async ({ page }) => {
    await page.goto('/#/purchase');
    await page
      .getByLabel(`${pack.name}套餐`, { exact: true })
      .getByRole('button', { name: '订阅套餐', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(`¥${(pack.amount + pack.accountPrice * pack.accounts).toLocaleString()}`);
    await expect(dialog).toContainText(`到账 ${pack.credits.toLocaleString()} 积分`);
    await expect(dialog).toContainText(`可绑定发布账号的个数（${pack.accounts}个）`);
    await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('100');
    await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
    await expect(dialog).toContainText(`已到账 ${pack.credits.toLocaleString()} 积分`);
    await expect(dialog).toContainText(`已到账 ${pack.accounts} 个账号`);
    await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
    await page.reload();
    await expect(page.getByLabel('积分余额', { exact: true })).toHaveText(
      (100 + pack.credits).toLocaleString(),
    );
    expect(await purchasedAccounts(page)).toHaveLength(pack.accounts);
    await expect(page.getByText('我购买的账号', { exact: true })).toHaveCount(0);
    await page.goto('/#/accounts');
    await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  });
}
test('展示积分充值和套餐页签，保留个人中心入口、说明内容及独立积分充值', async ({ page }, info) => {
  await page.goto('/#/purchase');
  await page.getByRole('button', { name: '账号购买说明', exact: true }).first().hover();
  const tip = page.getByRole('tooltip');
  for (const text of accountHelp) await expect(tip).toContainText(text);
  await expect(page.locator('ol:visible > li')).toHaveCount(3);
  await expect(tip).not.toContainText(/所有权|登录信息/);
  await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
  await expect(tip).toBeHidden();
  await expect(page.getByRole('tab')).toHaveCount(2);
  const bundleEntry = page.getByRole('tab', { name: '套餐', exact: true });
  const creditsEntry = page.getByRole('tab', { name: '积分充值', exact: true });
  await expect(page.getByRole('radio', { name: '个人版' })).toBeChecked();
  await creditsEntry.press('Enter');
  await expect(creditsEntry).toBeFocused();
  await expect(creditsEntry).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/#\/purchase\?tab=credits$/);
  await expect(page.getByRole('tabpanel', { name: '积分充值', exact: true })).toBeVisible();
  await creditsEntry.press('ArrowLeft');
  await expect(bundleEntry).toBeFocused();
  await expect(bundleEntry).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radio', { name: '个人版' })).toBeChecked();
  const benefits = page.getByLabel('平台功能权益');
  await expect(benefits).toHaveCount(4);
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('button', { name: '积分充值', exact: true }).click();
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(bundleEntry).toBeVisible();
  const panel = page.getByRole('tabpanel', { name: '积分充值', exact: true });
  await expect(panel.getByLabel('套餐社媒帐号权益')).toHaveCount(0);
  await expect(panel.getByLabel('平台功能权益')).toHaveCount(0);
  await panel.getByRole('button', { name: '立即充值', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¥500');
  await expect(dialog).toContainText('到账 1,041 积分');
  await expect(dialog).not.toContainText(/账号|自动到账/);
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 1,041 积分');
  await expect(dialog.getByRole('button', { name: '查看账号' })).toHaveCount(0);
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('1,141');
  expect(await purchasedAccounts(page)).toHaveLength(0);
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('1,141');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(bundleEntry).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await bundleEntry.click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByRole('heading', { name: '套餐购买', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('purchase-tabs-mobile.png'), fullPage: true });
});

test('窄屏套餐与自动到账没有横向溢出，历史余额不显示领取入口', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/purchase');
  const infoButton = page
    .getByRole('article', { name: '基础版套餐' })
    .getByRole('button', { name: '账号购买说明', exact: true });
  await infoButton.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await infoButton.dispatchEvent('pointerup', { pointerType: 'touch' });
  await infoButton.dispatchEvent('click');
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('heading', { name: '套餐购买', exact: true }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('购买与充值').screenshot({ path: info.outputPath('package-benefits-mobile.png') });
  await page
    .getByLabel('商业版套餐', { exact: true })
    .getByRole('button', { name: '订阅套餐', exact: true })
    .click();
  await page.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(page.getByRole('dialog')).toContainText('已到账 10 个账号');
  await page.screenshot({ path: info.outputPath('automatic-success-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '查看账号', exact: true }).click();
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  await seedHistorical(page, 10);
  await page.reload();
  await expect(page.getByRole('button', { name: '领取历史账号', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('accounts-mobile.png'), fullPage: true });
});

for (const recovery of ['retry', 'reload'] as const) {
  test(`自动到账保存失败后通过 ${recovery} 恢复，支付只完成一次`, async ({ page }) => {
    await page.goto('/#/purchase');
    await page
      .getByLabel('商业版套餐', { exact: true })
      .getByRole('button', { name: '订阅套餐', exact: true })
      .click();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('chuhai-studio-v1:')) throw new Error('simulated storage quota');
        original.call(this, key, value);
      };
      Object.assign(window, {
        restoreDeliveryStorage: () => {
          Storage.prototype.setItem = original;
        },
      });
    });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
    await expect(dialog.getByRole('heading')).toHaveText('支付已完成');
    await expect(dialog.getByRole('alert')).toContainText('支付已完成，账号同步失败');
    await expect(dialog.getByRole('button', { name: '查看账号', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('5,100');
    const snapshot = await page.evaluate(() => localStorage.getItem('chuhai-credits-v1:demo'));
    const ledger = JSON.parse(snapshot!);
    expect(ledger.claims).toHaveLength(1);
    expect(ledger.claims[0].accounts).toHaveLength(10);
    await dialog.getByRole('button', { name: '重试账号同步', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('账号同步失败');
    await page.evaluate(() =>
      (window as unknown as { restoreDeliveryStorage: () => void }).restoreDeliveryStorage(),
    );
    if (recovery === 'reload') {
      await page.reload();
      await page.goto('/#/accounts');
    } else {
      await dialog.getByRole('button', { name: '重试账号同步', exact: true }).click();
      await expect(dialog).toContainText('已到账 10 个账号');
      await dialog.getByRole('button', { name: '查看账号', exact: true }).click();
    }
    expect(await purchasedAccounts(page)).toEqual(ledger.claims[0].accounts);
    expect(await page.evaluate(() => localStorage.getItem('chuhai-credits-v1:demo'))).toBe(snapshot);
    await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  });
}
