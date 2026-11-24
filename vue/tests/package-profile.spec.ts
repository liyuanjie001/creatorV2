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
    .getByLabel('商业版套餐', { exact: true })
    .getByRole('button', { name: /订阅套餐|续购套餐/, exact: true })
    .click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await expect(page.getByLabel('商业版套餐', { exact: true })).toContainText('当前版本');
  await expect(page.getByLabel('商业版套餐', { exact: true })).not.toContainText('热门推荐');
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page).toHaveURL(/#\/me$/);
  await expect(page.getByLabel('当前套餐')).toHaveText('商业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('5,100');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('profile-entitlements.png'), fullPage: true });

  await page.getByRole('button', { name: '权益详情' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '商业版权益', exact: true })).toBeVisible();
  await expect(dialog).toContainText('批量发布');
  await expect(dialog).toContainText('内容数据分析');
  await expect(dialog.getByRole('listitem').filter({ hasText: '可绑定发布账号的个数' })).toHaveText(/可绑定发布账号的个数（10个）/);
  await page.screenshot({ path: info.outputPath('package-benefit-details.png') });
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();

  await page.getByRole('button', { name: '升级套餐', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByLabel('商业版套餐', { exact: true })).toContainText('当前版本');
  await page.screenshot({ path: info.outputPath('purchase-current-version.png'), fullPage: true });
  const enterprise = page.getByLabel('企业版套餐', { exact: true });
  for (let count = 0; count < 30; count++) await enterprise.getByRole('button', { name: '减少账号使用权', exact: true }).click();
  await page
    .getByLabel('企业版套餐', { exact: true })
    .getByRole('button', { name: /订阅套餐|续购套餐/, exact: true })
    .click();
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await page.getByRole('button', { name: '积分充值', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase\?tab=credits$/);
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: '积分充值', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('heading', { name: '积分充值', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: '积分充值', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page
    .getByLabel('¥500 积分充值', { exact: true })
    .getByRole('button', { name: '立即充值', exact: true })
    .click();
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('18,961');
  await page.reload();
  await expect(page.getByLabel('当前套餐')).toHaveText('企业版');
  await expect(page.getByLabel('当前剩余积分')).toHaveText('18,961');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('profile-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '权益详情' }).click();
  await expect(dialog.getByRole('heading', { name: '企业版权益', exact: true })).toBeVisible();
  await expect(dialog).not.toContainText('团队协作成员');
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThan(390);
  expect(box!.height).toBeLessThan(844);
  await page.screenshot({ path: info.outputPath('benefit-details-mobile.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '套餐购买', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchase$/);
  await expect(page.getByLabel('企业版套餐', { exact: true })).toContainText('当前版本');
  await expect(page.getByLabel('商业版套餐', { exact: true })).toContainText('热门推荐');
  await page.reload();
  await expect(page.getByText('当前版本', { exact: true })).toHaveCount(1);
  await expect(page.getByLabel('企业版套餐', { exact: true })).toContainText('当前版本');
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

test('权益按分类平铺，个人版和团队版对应参考表，窄屏无横向溢出', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto('/#/purchase');
  const names = ['基础版', '专业版', '商业版', '企业版'];
  for (const edition of ['个人版', '团队版']) {
    await page.getByText(edition, { exact: true }).click();
    await expect(page.getByRole('radio', { name: edition, exact: true })).toBeChecked();
    for (let i = 0; i < names.length; i++) {
      const card = page.getByRole('article', { name: `${names[i]}套餐` });
      const benefits = card.getByLabel('平台功能权益', { exact: true });
      await expect(benefits.getByRole('heading')).toHaveText(edition === '个人版'
        ? ['AI 创作', '账号与发布', '数据分析'] : ['团队协作', 'AI 创作', '账号与发布', '数据分析']);
      await expect(benefits.getByRole('listitem')).toHaveCount(edition === '个人版' ? 18 : 23);
      await expect(benefits.getByText(`可绑定发布账号的个数（${[2, 5, 10, 30][i]}个）`, { exact: true })).toBeVisible();
      await expect(benefits.getByText('可发布平台（全部平台）', { exact: true })).toBeVisible();
      await expect(benefits.getByText(`多任务并行（${['10个', '20个', '无限并行任务', '高级加速通道'][i]}）`, { exact: true })).toBeVisible();
      await expect(benefits.locator('[data-supported="false"]')).toHaveCount([7, 3, 0, 0][i]!);
      const team = benefits.getByRole('region', { name: '团队协作', exact: true });
      if (edition === '团队版') {
        await expect(team.getByRole('listitem')).toHaveCount(5);
        await expect(team.locator('[data-supported="true"]')).toHaveCount(5);
      } else await expect(team).toHaveCount(0);
    }
    const compare = page.getByRole('table', { name: '套餐权益对比', exact: true });
    await expect(compare.getByRole('row', { name: /^多任务并行/ }).getByRole('cell'))
      .toHaveText(['10个', '20个', '无限并行任务', '高级加速通道']);
    await expect(compare.getByRole('row', { name: /^可绑定发布账号的个数/ }).getByRole('cell'))
      .toHaveText(['2', '5', '10', '30']);
    await page.screenshot({ path: info.outputPath(`benefits-${edition}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`benefits-${edition}-mobile.png`), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const plan = page.getByRole('article', { name: '基础版套餐' });
  await plan.getByRole('button', { name: '订阅套餐' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await page.goto('/#/me');
  await page.getByRole('button', { name: '权益详情' }).click();
  await expect(dialog.getByRole('region', { name: '团队协作', exact: true }).getByRole('listitem')).toHaveCount(5);
  await page.screenshot({ path: info.outputPath('benefits-team-profile.png') });
});

test('个人与团队套餐隐藏折扣，原价随数量和周期实时更新', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const cards = page.getByRole('article', { name: /版套餐$/ });
  const table = page.getByRole('table', { name: '套餐权益对比', exact: true });
  for (const edition of ['个人版', '团队版']) {
    await page.getByText(edition, { exact: true }).click();
    await cards.first().getByRole('button', { name: '积分有效期说明', exact: true }).hover();
    await expect(page.getByRole('tooltip')).toContainText('积分有效期为一年。');
    await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
    for (const period of ['按季订阅', '按年订阅']) {
      await page.getByText(period, { exact: true }).click();
      await expect(cards.getByLabel('套餐折扣', { exact: true })).toHaveCount(0);
      await expect(cards.first().getByLabel('套餐原价', { exact: true })).toHaveCount(0);
      const multiplier = period === '按季订阅' ? 1 : 4;
      for (let i = 1; i < 4; i++) {
        const reference = [961, 2272, 5000, 12820][i]! * multiplier * 500 / 961
          + [2, 5, 10, 30][i]! * 42 + (edition === '团队版' ? 120 * multiplier : 0);
        const original = cards.nth(i).getByLabel('套餐原价', { exact: true });
        await expect(original).toHaveText(`¥${(Math.round(reference * 100) / 100).toLocaleString('zh-CN')}`);
        expect(await original.evaluate(element => getComputedStyle(element).textDecorationLine)).toBe('line-through');
      }
      await expect(table.getByRole('row', { name: /^相对基础版/ })).toHaveCount(0);
    }
    await page.getByText('按季订阅', { exact: true }).click();
    const professional = cards.filter({ has: page.getByRole('heading', { name: '专业版', exact: true }) });
    for (let i = 0; i < 5; i++) await professional.getByRole('button', { name: '减少账号使用权', exact: true }).click();
    const original = 2272 * 500 / 961 + (edition === '团队版' ? 120 : 0);
    await expect(professional.getByLabel('套餐原价', { exact: true }))
      .toHaveText(`¥${(Math.round(original * 100) / 100).toLocaleString('zh-CN')}`);
    // Restore this edition's selection before the screenshot.
    for (let i = 0; i < 5; i++) await professional.getByRole('button', { name: '增加账号使用权', exact: true }).click();
  }
  await expect(cards.getByRole('button', { name: '折扣计算说明', exact: true })).toHaveCount(0);
  await expect(cards.filter({ hasText: /较基础版同配置|基准价/ })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('subscription-discounts-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('subscription-discounts-mobile.png'), fullPage: true });
  await page.getByRole('tab', { name: '积分充值', exact: true }).click();
  await page.getByRole('button', { name: '积分有效期说明', exact: true }).first().hover();
  await expect(page.getByRole('tooltip')).toContainText('积分有效期为一年。');
});

test('四档团队席位按档位和周期收费，数量变化同步到确认订单', async ({ page }) => {
  await page.goto('/#/purchase');
  await page.getByText('团队版', { exact: true }).click();
  const tiers = [
    { name: '基础版', base: 500, accounts: 2, accountPrice: 42, seatPrice: 60 },
    { name: '专业版', base: 1000, accounts: 5, accountPrice: 40, seatPrice: 50 },
    { name: '商业版', base: 2000, accounts: 10, accountPrice: 36, seatPrice: 45 },
    { name: '企业版', base: 5000, accounts: 30, accountPrice: 30, seatPrice: 40 },
  ];
  const money = (value: number) => `¥${value.toLocaleString('zh-CN')}`;
  for (const multiplier of [1, 4]) {
    await page.getByText(multiplier === 1 ? '按季订阅' : '按年订阅', { exact: true }).click();
    for (const tier of tiers) {
      const card = page.getByRole('article', { name: `${tier.name}套餐` });
      const price = tier.seatPrice * multiplier;
      await expect(card.getByText(`${money(price)}/席/${multiplier === 1 ? '季' : '年'}`, { exact: true })).toBeVisible();
      const initialSeats = multiplier === 1 ? 2 : 3;
      const total = tier.base * multiplier + tier.accounts * tier.accountPrice + initialSeats * price;
      await expect(card.getByLabel('应付总价')).toHaveText(money(total));
      await card.getByRole('button', { name: '增加团队席位' }).click();
      await expect(card.getByLabel('应付总价')).toHaveText(money(total + price));
      await card.getByRole('button', { name: '订阅套餐' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText(money(total + price));
      await expect(dialog).toContainText(`团队席位 ${initialSeats + 1} 席`);
      await dialog.getByRole('button', { name: '返回修改' }).click();
    }
  }
});

test('版本和周期切换保留配置，团队年付按订单快照结算', async ({ page }) => {
  await page.goto('/#/purchase');
  const plan = page.getByRole('article', { name: '基础版套餐' });
  const orderTotal = plan.getByLabel('应付总价');
  const decrease = plan.getByRole('button', { name: '减少账号使用权' });
  const table = page.getByRole('table', { name: '套餐权益对比' });
  await expect(page.getByRole('radio', { name: '个人版' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '按季订阅' })).toBeChecked();
  await expect(orderTotal).toHaveText('¥584');
  await expect(plan).toContainText('约可生成 87 个视频');
  await expect(plan.getByRole('button', { name: '增加团队席位' })).toHaveCount(0);
  await expect(table.getByRole('row', { name: /团队协作成员/ })).toHaveCount(0);
  await decrease.click();
  await decrease.click();
  await expect(decrease).toBeDisabled();
  await expect(orderTotal).toHaveText('¥500');

  await page.getByText('团队版', { exact: true }).click();
  await expect(page.getByRole('article', { name: /版套餐$/ })).toHaveCount(4);
  await expect(orderTotal).toHaveText('¥704');
  await expect(plan.getByRole('button', { name: '减少团队席位' })).toBeDisabled();
  await page.getByText('按年订阅', { exact: true }).click();
  await expect(orderTotal).toHaveText('¥2,564');
  await expect(plan).toContainText('约可生成 349 个视频');
  await page.getByText('按季订阅', { exact: true }).click();
  await plan.getByRole('button', { name: '减少账号使用权' }).click();
  await expect(orderTotal).toHaveText('¥662');
  await page.getByText('按年订阅', { exact: true }).click();
  await expect(orderTotal).toHaveText('¥2,522');
  await expect(table.getByRole('row', { name: /整期积分/ })).toContainText('3,844');
  await expect(table.getByRole('row', { name: /基础价/ })).toContainText('¥20,000');
  await expect(table.getByRole('row', { name: /项目权限管理/ }).getByRole('cell'))
    .toHaveText(['支持', '支持', '支持', '支持']);
  await plan.getByRole('button', { name: '增加团队席位' }).click();
  await page.getByText('个人版', { exact: true }).click();
  await expect(orderTotal).toHaveText('¥2,000');
  await page.getByText('团队版', { exact: true }).click();
  await expect(orderTotal).toHaveText('¥2,762');

  await page.getByRole('tab', { name: '积分充值', exact: true }).click();
  await expect(page.getByRole('tab', { name: '积分充值' })).toBeFocused();
  await page.getByRole('tab', { name: '积分充值' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: '套餐', exact: true })).toBeFocused();
  await expect(page.getByRole('radio', { name: '团队版' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '按年订阅' })).toBeChecked();
  await expect(orderTotal).toHaveText('¥2,762');

  await plan.getByRole('button', { name: '订阅套餐' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¥2,762');
  await expect(dialog).toContainText('团队席位 3 席（另计本人）');
  await dialog.getByRole('button', { name: '返回修改' }).click();
  await decrease.click();
  await plan.getByRole('button', { name: '订阅套餐' }).click();
  await expect(dialog).toContainText('¥2,720');
  await expect(dialog).toContainText('账号使用权 0 个');
  await dialog.getByRole('button', { name: '模拟支付成功' }).click();
  await expect(dialog).toContainText('已到账 3,844 积分');
  await expect(dialog.getByRole('button', { name: '查看账号' })).toHaveCount(0);
  await dialog.getByRole('button', { name: '完成' }).click();
  const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-credits-v1:demo')!));
  expect(ledger.orders).toMatchObject([
    { amount: 2762, accountCount: 1, status: 'pending' },
    { amount: 2720, credits: 3844, accountCount: 0, status: 'completed', subscription: { edition: 'team', period: 'year', seats: 3 } },
  ]);
  expect(ledger.claims).toHaveLength(0);
  await page.goto('/#/me');
  await expect(page.getByLabel('订阅权益')).toContainText('团队版 · 按年订阅 · 生效中');
  await expect(page.getByLabel('订阅权益')).toContainText('3 席');
  await page.reload();
  await expect(page.getByLabel('当前剩余积分')).toHaveText('3,944');
  await page.getByRole('button', { name: '手动续购' }).click();
  await expect(page.getByRole('radio', { name: '团队版' })).toBeChecked();
  await expect(page.getByRole('radio', { name: '按年订阅' })).toBeChecked();
});

test('桌面及 390px 下的区块顺序、键盘展开与表格局部横向滚动', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const plans = page.getByRole('region', { name: '订阅套餐' });
  const custom = page.getByRole('region', { name: '定制化服务' });
  const compare = page.getByRole('region', { name: '套餐权益对比', exact: true });
  const faq = page.getByRole('region', { name: '常见问题' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const versions = (await page.getByRole('group', { name: '套餐版本', exact: true }).boundingBox())!;
    const periods = (await page.getByRole('group', { name: '订阅周期', exact: true }).boundingBox())!;
    const tabs = (await page.getByRole('tablist', { name: '购买类型' }).boundingBox())!;
    const bounds = (await plans.boundingBox())!;
    expect(tabs.y + tabs.height).toBeLessThan(versions.y);
    expect(Math.abs(versions.x - bounds.x)).toBeLessThan(2);
    if (width >= 640) {
      expect(versions.x + versions.width).toBeLessThan(periods.x);
      expect(Math.abs(periods.x + periods.width - (bounds.x + bounds.width))).toBeLessThan(2);
      expect(Math.abs(versions.y + versions.height / 2 - (periods.y + periods.height / 2))).toBeLessThan(2);
    } else {
      expect(versions.y + versions.height).toBeLessThan(periods.y);
    }
    await page.getByRole('group', { name: '套餐版本', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`purchase-controls-${width}.png`) });
    const boxes = await Promise.all([plans, custom, compare, faq].map((section) => section.boundingBox()));
    for (let i = 0; i < boxes.length - 1; i++) {
      expect(boxes[i + 1]!.y).toBeGreaterThan(boxes[i]!.y + boxes[i]!.height);
    }
    const question = faq.getByText('订阅到期后会自动续费吗？', { exact: true });
    await question.press('Enter');
    await expect(faq.getByText(/不会自动续费。/)).toBeVisible();
    await question.press('Space');
    await expect(faq.getByText(/不会自动续费。/)).toBeHidden();
  }
  const first = (await plans.getByRole('article').nth(0).boundingBox())!;
  const second = (await plans.getByRole('article').nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThan(first.y + first.height);
  const scroller = compare.getByRole('region', { name: /可横向滚动/ });
  expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await scroller.press('ArrowRight');
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await compare.screenshot({ path: info.outputPath('subscription-comparison-mobile.png') });
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
