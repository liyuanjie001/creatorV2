import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
test.use({ actionTimeout: 15000 });
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');

const accountHelp = ['美国 TikTok 账号，付款后自动到账', '可直接通过本平台发布视频、图文等作品'];
const bundleExpectations = [
  {
    price: '¥500',
    name: '基础版',
    description: '轻量运营',
    amount: 500,
    credits: 933,
    videos: 84,
    accounts: 2,
    maintenance: 50,
    members: 0,
  },
  {
    price: '¥1,000',
    name: '专业版',
    description: '个人运营',
    amount: 1000,
    credits: 1895,
    videos: 172,
    accounts: 5,
    maintenance: 120,
    members: 10,
  },
  {
    price: '¥2,000',
    name: '商业版',
    description: '多账号运营',
    amount: 2000,
    credits: 3945,
    videos: 358,
    accounts: 10,
    maintenance: 260,
    members: 20,
  },
  {
    price: '¥5,000',
    name: '企业版',
    description: '团队矩阵运营',
    amount: 5000,
    credits: 10095,
    videos: 917,
    accounts: 30,
    maintenance: 700,
    members: 50,
  },
];
const commonBenefits = [
  '视频一键发布',
  '快速创作',
  '智能创作（Agent 多任务并行）',
  '账号数据通解',
  '发布结果统计',
  '项目管理（不限项目数）',
  '产品卡创建',
  '素材库管理',
];
const standardBenefits = ['图文一键发布', '视频／图文 BGM', '定时发布', '爆款视频复刻', '团队权限管理'];
const advancedBenefits = ['批量发布', '批量内容生成', '内容数据分析'];
const creditsOnlyExpectations = [
  {
    amount: 500,
    price: '¥500',
    included: 933,
    count: 2,
    credits: 1041,
    videos: 94,
    originalVideos: 84,
    key: 'p500',
    creditKey: 'credit500',
  },
  {
    amount: 1000,
    price: '¥1,000',
    included: 1895,
    count: 5,
    credits: 2173,
    videos: 197,
    originalVideos: 172,
    key: 'p1000',
    creditKey: 'credit1000',
  },
  {
    amount: 2000,
    price: '¥2,000',
    included: 3945,
    count: 10,
    credits: 4545,
    videos: 413,
    originalVideos: 358,
    key: 'p2000',
    creditKey: 'credit2000',
  },
  {
    amount: 5000,
    price: '¥5,000',
    included: 10095,
    count: 30,
    credits: 11904,
    videos: 1082,
    originalVideos: 917,
    key: 'p5000',
    creditKey: 'credit5000',
  },
];

for (const pack of creditsOnlyExpectations) {
  for (const mode of ['套餐兑换', '积分充值'] as const) {
    test(`${pack.price} ${mode} 按确认额度到账且不新增账号`, async ({ page }, info) => {
      await page.goto(mode === '积分充值' ? '/#/purchase?tab=credits' : '/#/purchase');
      const card = page.getByLabel(`${pack.price} ${mode === '套餐兑换' ? '套餐' : '积分充值'}`, {
        exact: true,
      });
      if (mode === '套餐兑换') {
        const checkbox = card.getByRole('checkbox', { name: `包含 ${pack.count} 个账号使用权`, exact: true });
        await expect(checkbox).toBeChecked();
        await expect(card).toContainText(`${pack.included.toLocaleString()} 个积分`);
        await checkbox.uncheck();
        await expect(card.getByRole('status')).toHaveText('账号已兑换为积分');
        await expect(card.getByRole('button', { name: '账号购买说明' })).toHaveCount(0);
        await expect(card).not.toContainText('付款后自动到账');
        await expect(card.getByLabel('平台功能权益')).toContainText(`可绑定发布账号数 ${pack.count} 个`);
        await checkbox.check();
        await expect(card).toContainText(`${pack.included.toLocaleString()} 个积分`);
        await expect(card).toContainText(`约可生成视频 ${pack.originalVideos} 个`);
        await checkbox.uncheck();
        await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(3);
      }
      await expect(card).toContainText(`${pack.credits.toLocaleString()} 个积分`);
      await expect(card).toContainText(`约可生成视频 ${pack.videos.toLocaleString()} 个`);
      await expect(card).not.toContainText(/所有权|配套 IP|养护|单价|／积分/);
      if (pack.amount === 2000 && mode === '套餐兑换') {
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
          true,
        );
        await page.screenshot({ path: info.outputPath('credits-conversion-mobile.png'), fullPage: true });
      }
      await card
        .getByRole('button', { name: mode === '套餐兑换' ? '购买套餐' : '立即充值', exact: true })
        .click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText(`¥${pack.amount}`);
      await expect(dialog).toContainText(`到账 ${pack.credits.toLocaleString()} 积分`);
      await expect(dialog).not.toContainText(/单价|／积分/);
      if (mode === '套餐兑换') {
        const checkbox = dialog.getByRole('checkbox', {
          name: `包含 ${pack.count} 个账号使用权`,
          exact: true,
        });
        await expect(checkbox).not.toBeChecked();
        await checkbox.check();
        await expect(dialog).toContainText(`到账 ${pack.included.toLocaleString()} 积分`);
        await expect(dialog).toContainText('美国 TikTok 账号，付款后自动到账');
        await expect(card.getByRole('checkbox', { includeHidden: true })).toBeChecked();
        await checkbox.uncheck();
        await expect(dialog).toContainText(`到账 ${pack.credits.toLocaleString()} 积分`);
        await expect(dialog.getByRole('status')).toHaveText('账号已兑换为积分');
        await expect(dialog).not.toContainText('付款后自动到账');
        await expect(card.getByRole('checkbox', { includeHidden: true })).not.toBeChecked();
        if (pack.amount === 2000) {
          await page.screenshot({ path: info.outputPath('payment-options-mobile.png') });
        }
      } else {
        await expect(dialog).not.toContainText(/账号|自动到账/);
        await expect(dialog.getByRole('checkbox')).toHaveCount(0);
      }
      expect(await purchasedAccounts(page)).toHaveLength(0);
      await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('100');
      await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
      await expect(dialog).toContainText(`已到账 ${pack.credits.toLocaleString()} 积分`);
      await expect(dialog.getByRole('button', { name: '查看账号', exact: true })).toHaveCount(0);
      await dialog.getByRole('button', { name: '完成', exact: true }).click();
      await page.reload();
      await expect(page.getByLabel('积分余额', { exact: true })).toHaveText(
        (100 + pack.credits).toLocaleString(),
      );
      expect(await purchasedAccounts(page)).toHaveLength(0);
      const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!));
      expect(ledger.claims).toHaveLength(0);
      expect(ledger.orders.find((order: { status: string }) => order.status === 'completed')).toMatchObject({
        pack: mode === '套餐兑换' ? pack.key : pack.creditKey,
        credits: pack.credits,
        accountCount: 0,
        status: 'completed',
      });
      expect(ledger.orders[0].deliveryMode).toBeUndefined();
      if (mode === '套餐兑换') {
        expect(ledger.orders[0].purchaseMode).toBe('creditsOnly');
        await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(4);
      }
    });
  }
}

test('两千元套餐和弹窗双向同步账号选择，旧待支付订单保留快照', async ({ page }) => {
  await page.goto('/#/purchase');
  const card = page.getByLabel('¥2,000 套餐', { exact: true });
  const checkbox = card.getByRole('checkbox', { name: '包含 10 个账号使用权', exact: true });
  await checkbox.uncheck();
  await page
    .getByLabel('¥2,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('到账 4,545 积分');
  await expect(dialog.getByRole('checkbox')).not.toBeChecked();
  await expect(dialog).not.toContainText('付款后自动到账');
  await page.keyboard.press('Escape');
  await checkbox.check();
  await page
    .getByLabel('¥2,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  await expect(dialog).toContainText('到账 3,945 积分');
  await expect(dialog).toContainText('10 个账号');
  const orders = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!).orders,
  );
  expect(orders[0]).toMatchObject({
    credits: 4545,
    accountCount: 0,
    purchaseMode: 'creditsOnly',
    status: 'pending',
  });
  expect(orders[1]).toMatchObject({
    credits: 3945,
    accountCount: 10,
    purchaseMode: 'withAccounts',
    status: 'pending',
  });
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('100');
  expect(await purchasedAccounts(page)).toHaveLength(0);
  const paymentCheckbox = dialog.getByRole('checkbox', { name: '包含 10 个账号使用权', exact: true });
  await paymentCheckbox.uncheck();
  await expect(dialog).toContainText('到账 4,545 积分');
  await expect(card.getByRole('checkbox', { includeHidden: true })).not.toBeChecked();
  await dialog.getByRole('button', { name: '微信支付', exact: true }).click();
  await paymentCheckbox.check();
  await expect(dialog).toContainText('到账 3,945 积分');
  await expect(card.getByRole('checkbox', { includeHidden: true })).toBeChecked();
  await expect(dialog.getByRole('button', { name: '微信支付', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await expect(dialog).toContainText('已到账 10 个账号');
  await expect(dialog.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('4,045');
  expect(await purchasedAccounts(page)).toHaveLength(10);
  await page.reload();
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('4,045');
  expect(await purchasedAccounts(page)).toHaveLength(10);
  const savedOrders = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!).orders,
  );
  expect(savedOrders.filter((order: { status: string }) => order.status === 'completed')).toHaveLength(1);
  expect(savedOrders.slice(0, 2)).toEqual(orders);
});

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
  await expect(page.getByLabel('待领取帐号提示')).toContainText(`历史待领取账号：${quantity} 个`);
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
test('套餐数据、自动到账、帐号凭据、跨项目发布与历史领取共存', async ({ page, context }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/purchase');
  const cards = page.getByLabel('购买与充值');
  for (const text of ['¥500', '¥1,000', '¥2,000', '¥5,000', '933', '1,895', '3,945', '10,095', '917'])
    await expect(cards).toContainText(text);
  await expect(cards.getByLabel('套餐社媒帐号权益').last()).toContainText('30 个账号');
  const accountBenefit = cards.getByLabel('套餐社媒帐号权益').first();
  await expect(accountBenefit).toContainText('2 个账号');
  await expect(accountBenefit).toContainText('美国 TikTok 账号，付款后自动到账');
  await expect(accountBenefit).toContainText('账号使用权');
  await expect(cards).toContainText('933 个积分');
  for (const pack of bundleExpectations) {
    const card = cards.getByLabel(`${pack.price} 套餐`, { exact: true });
    await expect(card.getByRole('heading', { name: pack.name, exact: true })).toBeVisible();
    await expect(card).toContainText(pack.description);
    await expect(card).toContainText(`${pack.credits.toLocaleString()} 个积分`);
    await expect(card).toContainText(`约可生成视频 ${pack.videos} 个`);
    await expect(card).not.toContainText(/单价|／积分/);
    const accountEntitlements = card.getByLabel('套餐社媒帐号权益');
    await expect(accountEntitlements).toContainText(`${pack.accounts} 个账号`);
    await expect(accountEntitlements).not.toContainText(/配套 IP|养护|所有权/);
    const list = card.getByLabel('平台功能权益');
    await expect(list.getByRole('listitem')).toHaveCount(
      pack.amount === 500 ? 10 : pack.amount === 1000 ? 16 : 19,
    );
    for (const label of commonBenefits) await expect(list.getByText(label, { exact: true })).toBeVisible();
    for (const label of standardBenefits)
      await expect(list.getByText(label, { exact: true })).toHaveCount(pack.amount >= 1000 ? 1 : 0);
    for (const label of advancedBenefits)
      await expect(list.getByText(label, { exact: true })).toHaveCount(pack.amount >= 2000 ? 1 : 0);
    await expect(list).toContainText(`可绑定发布账号数 ${pack.accounts} 个`);
    await expect(list).toContainText('可发布平台 全部平台');
    if (pack.members) await expect(list).toContainText(`团队协作成员 ${pack.members} 人`);
    else await expect(list).not.toContainText('团队协作成员');
    await expect(list).not.toContainText('不支持');
    await expect(list.getByRole('heading', { name: '管理与协作', exact: true })).toBeVisible();
  }
  await expect(cards).not.toContainText(/成本|利润率|限时优惠|Seedance|480P|¥490/);
  await expect(cards.locator('.line-through')).toHaveCount(0);
  await cards.getByRole('button', { name: '账号购买说明', exact: true }).first().hover();
  for (const text of accountHelp) await expect(page.getByRole('tooltip')).toContainText(text);
  await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
  await page.screenshot({ path: info.outputPath('recharge-packages.png'), fullPage: true });
  await page
    .getByLabel('¥2,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('10 个账号');
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
  await expect(page.getByLabel('待领取帐号提示')).toContainText('历史待领取账号：7 个');
  await page.getByRole('button', { name: '领取历史账号', exact: true }).click();
  await setClaimRow(page, 1, 'instagram', 'FR', '法国 FR', 2);
  await page.getByRole('button', { name: '确认领取' }).click();
  await expect(page.getByRole('dialog')).toContainText('已领取 2 个帐号');
  await page.keyboard.press('Escape');
  await page.reload();
  await page.goto('/#/purchase');
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('4,045');
  await expect(page.getByText('我购买的账号', { exact: true })).toHaveCount(0);
  await page.goto('/#/accounts');
  const deletableHandle = await page.evaluate(
    () =>
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

for (const pack of bundleExpectations) {
  test(`${pack.price} 套餐支付前不入账、支付后额度准确且刷新保留`, async ({ page }) => {
    await page.goto('/#/purchase');
    await page
      .getByLabel(`${pack.price} 套餐`, { exact: true })
      .getByRole('button', { name: '购买套餐', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(`¥${pack.amount}`);
    await expect(dialog).toContainText(`到账 ${pack.credits.toLocaleString()} 积分`);
    await expect(dialog).toContainText(`${pack.accounts} 个账号`);
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
test('隐藏充值页签，保留个人中心入口、说明内容及独立积分充值', async ({ page }, info) => {
  await page.goto('/#/purchase');
  await page.getByRole('button', { name: '账号购买说明', exact: true }).first().hover();
  const tip = page.getByRole('tooltip');
  for (const text of accountHelp) await expect(tip).toContainText(text);
  await expect(page.locator('ol:visible > li')).toHaveCount(2);
  await expect(tip).not.toContainText(/所有权|登录信息/);
  await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
  await expect(tip).toBeHidden();
  await expect(page.getByRole('tab')).toHaveCount(0);
  const benefits = page.getByLabel('平台功能权益');
  await expect(benefits).toHaveCount(4);
  for (let index = 0; index < 4; index++)
    await expect(benefits.nth(index).getByRole('listitem')).toHaveCount([10, 16, 19, 19][index]!);
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('button', { name: '积分充值', exact: true }).click();
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  const panel = page.getByLabel('购买与充值');
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '返回套餐', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByRole('heading', { name: '套餐购买', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('purchase-tabs-mobile.png'), fullPage: true });
});

test('窄屏套餐、自动到账和历史领取表单没有横向溢出', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/purchase');
  const infoButton = page
    .getByLabel('套餐社媒帐号权益')
    .first()
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
    .getByLabel('¥2,000 套餐', { exact: true })
    .getByRole('button', { name: '购买套餐', exact: true })
    .click();
  await page.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(page.getByRole('dialog')).toContainText('已到账 10 个账号');
  await page.screenshot({ path: info.outputPath('automatic-success-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '查看账号', exact: true }).click();
  await expect(page.getByLabel('待领取帐号提示')).toHaveCount(0);
  await seedHistorical(page, 10);
  await page.getByRole('button', { name: '领取历史账号', exact: true }).click();
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
  await page.goto('/#/accounts');
  await seedHistorical(page, 10);
  await page.getByRole('button', { name: '领取历史账号', exact: true }).click();
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
  await expect(page.getByLabel('待领取帐号提示')).toContainText('8 个');
});

for (const recovery of ['retry', 'reload'] as const) {
  test(`自动到账保存失败后通过 ${recovery} 恢复，支付只完成一次`, async ({ page }) => {
    await page.goto('/#/purchase');
    await page
      .getByLabel('¥2,000 套餐', { exact: true })
      .getByRole('button', { name: '购买套餐', exact: true })
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
    await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('4,045');
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
