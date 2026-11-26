import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';

const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript((accessToken) => {
    localStorage.setItem('chuhai-access-token', accessToken);
    if (!localStorage.getItem('chuhai-studio-session'))
      localStorage.setItem(
        'chuhai-studio-session',
        JSON.stringify({
          id: 'rewards-inviter',
          name: '邀请人',
          identity: 'inviter@example.com',
          method: 'email',
          bindings: ['email'],
        }),
      );
    if (!localStorage.getItem('chuhai-guide-tour-v1:rewards-inviter'))
      localStorage.setItem(
        'chuhai-guide-tour-v1:rewards-inviter',
        JSON.stringify({
          version: 1,
          step: 0,
          status: 'skipped',
          welcomeGift: { amount: 50, noticeShown: true },
        }),
      );
  }, token);
});

test('普通账号直接签到，功能重置保留余额并允许再次领取', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const balance = page.locator('header').getByLabel('积分余额', { exact: true });
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '签到领好礼' });
  const reset = dialog.getByRole('button', { name: '功能重置', exact: true });
  await expect(reset).toBeDisabled();
  await dialog.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(page.locator('[data-credit-claim-flight]')).toBeVisible();
  await reset.click();
  await expect(page.locator('[data-credit-claim-flight]')).toHaveCount(0);
  await expect(page.locator('[data-credit-balance-feedback]')).toHaveCount(0);
  await expect(balance).toHaveText('60');
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(dialog.getByRole('button', { name: '立即签到 · 领取10积分' })).toBeEnabled();
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText('签到功能已重置');
  await page.reload();
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  await expect(balance).toHaveText('60');
  await expect(reset).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toHaveCSS('width', '358px');
  await reset.scrollIntoViewIfNeeded();
  expect(
    await dialog.evaluate((el) => ({
      width: el.clientWidth,
      scrollWidth: el.scrollWidth,
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right,
    })),
  ).toEqual(expect.objectContaining({ left: 16, right: 374 }));
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('check-in-reset-mobile.png') });
  await dialog.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(balance).toHaveText('70');
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
});

test('签到金币先飞到右上角，再递增余额，实际钱包先到账', async ({ page }, info) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
      const animation = animate.apply(this, args);
      if (this.hasAttribute('data-credit-claim-flight')) animation.pause();
      return animation;
    };
  });
  await page.goto('/#/purchase');
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  await page.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  const flight = page.locator('[data-credit-claim-flight]');
  const balance = page.locator('header').getByLabel('积分余额', { exact: true });
  await expect(flight).toBeVisible();
  await expect(balance).toHaveText('50');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-credits-v1:rewards-inviter')!).balance),
  ).toBe(60);
  const frames = await flight.evaluate((element) =>
    (element.getAnimations()[0]!.effect as KeyframeEffect).getKeyframes(),
  );
  expect(frames).toHaveLength(41);
  expect(frames[20]!.transform).not.toBe(frames[0]!.transform);
  await flight.evaluate((element) => {
    element.getAnimations()[0]!.currentTime = 425;
  });
  await page.screenshot({ path: info.outputPath('check-in-coin-flight.png') });
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    const timer = setInterval(
      () =>
        values.push(
          Number(document.querySelector('[aria-label="积分余额"]')?.textContent?.replaceAll(',', '')),
        ),
      16,
    );
    document.querySelector('[data-credit-claim-flight]')!.getAnimations()[0]!.finish();
    await new Promise((resolve) => setTimeout(resolve, 900));
    clearInterval(timer);
    return values;
  });
  expect(samples.some((value) => value > 50 && value < 60)).toBe(true);
  await expect(balance).toHaveText('60');
  await expect(flight).toHaveCount(0);
  await expect(page.locator('[data-credit-balance-feedback]')).toHaveCount(0);
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
    '签到成功，10积分已到账',
  );
});

for (const interruption of ['关闭弹窗', '调整窗口'] as const)
  test(`签到动画${interruption}后清理，余额保持到账`, async ({ page }) => {
    await page.goto('/#/purchase');
    await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
    await page.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
    await expect(page.locator('[data-credit-claim-flight]')).toBeVisible();
    if (interruption === '关闭弹窗') await page.keyboard.press('Escape');
    else await page.setViewportSize({ width: 320, height: 480 });
    await expect(page.locator('[data-credit-claim-flight]')).toHaveCount(0);
    await expect(page.locator('[data-credit-balance-feedback]')).toHaveCount(0);
    await expect(page.locator('header').getByLabel('积分余额', { exact: true })).toHaveText('60');
    await page.reload();
    await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
    await expect(page.getByRole('button', { name: '今日已签到，明天再来' })).toBeDisabled();
  });

test('签到减少动态效果时直接到账，演示账号刷新后不能重复领', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/purchase');
  await page.evaluate(() => {
    localStorage.setItem(
      'chuhai-studio-session',
      JSON.stringify({
        id: 'demo',
        name: '演示用户',
        identity: 'demo@chuhai.studio',
        method: 'email',
        bindings: ['email'],
      }),
    );
  });
  await page.reload();
  const balance = page.locator('header').getByLabel('积分余额', { exact: true });
  const before = Number((await balance.textContent())!.replaceAll(',', ''));
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  await page.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(balance).toHaveText(String(before + 10));
  await expect(page.locator('[data-credit-claim-flight]')).toHaveCount(0);
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
    '签到成功，10积分已到账',
  );
  await page.reload();
  await expect(balance).toHaveText(String(before + 10));
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  await expect(page.getByRole('button', { name: '今日已签到，明天再来' })).toBeDisabled();
});

test('签到保存失败用toast提示且不飞金币，恢复后可重试', async ({ page }) => {
  await page.goto('/#/purchase');
  await page.getByRole('button', { name: '签到领好礼', exact: true }).click();
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Object.assign(window, {
      restoreRewardStorage: () => {
        Storage.prototype.setItem = setItem;
      },
    });
    Storage.prototype.setItem = function (key, value) {
      if (key === 'chuhai-credits-v1:rewards-inviter') throw new Error('quota');
      setItem.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText('本地保存失败');
  await expect(page.locator('[data-credit-claim-flight]')).toHaveCount(0);
  await expect(page.locator('header').getByLabel('积分余额', { exact: true })).toHaveText('50');
  await page.evaluate(() =>
    (window as unknown as { restoreRewardStorage: () => void }).restoreRewardStorage(),
  );
  await page.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(page.locator('header').getByLabel('积分余额', { exact: true })).toHaveText('60');
});

test('签到和推广入口在桌面及手机可用，签到持久化且复制可用', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/purchase');
  const header = page.locator('header[aria-label="全局快捷操作"]');
  const checkIn = header.getByRole('button', { name: '签到领好礼', exact: true });
  const demo = page
    .getByRole('complementary', { name: '一级导航' })
    .getByRole('button', { name: '演示', exact: true });
  await expect(header.getByRole('button', { name: '演示', exact: true })).toHaveCount(0);
  const checkInBounds = (await checkIn.boundingBox())!;
  expect(checkInBounds.x).toBeGreaterThan(page.viewportSize()!.width / 2);
  await demo.click();
  await expect(page.getByRole('dialog', { name: '选择演示内容' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('demo-bottom-left-desktop.png') });
  await page.keyboard.press('Escape');
  await expect(demo).toBeFocused();
  const promote = page.getByRole('navigation').getByRole('link', { name: '推广计划', exact: true });
  await expect(header.getByText('推广计划', { exact: true })).toHaveCount(0);
  await checkIn.click();
  const dialog = page.getByRole('dialog', { name: '签到领好礼' });
  await expect(dialog).toContainText('每日');
  await dialog.getByRole('button', { name: '立即签到 · 领取10积分' }).click();
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(
    '签到成功，10积分已到账',
  );
  await expect(header.getByLabel('积分余额', { exact: true })).toHaveText('60');
  await expect(dialog.getByRole('button', { name: '今日已签到，明天再来' })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('check-in-desktop.png') });
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  await page.reload();
  await checkIn.click();
  await expect(page.getByRole('button', { name: '今日已签到，明天再来' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await promote.click();
  const promotion = page.getByLabel('推广计划页面', { exact: true });
  await expect(page).toHaveURL(/#\/promotion$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(promotion.getByText('注册邀请码', { exact: true })).toBeVisible();
  await promotion.getByRole('button', { name: '注册邀请链接', exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('#/auth?mode=register&invite=RX');
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText('注册邀请链接已复制');
  await expect(promotion.getByRole('status')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('promotion-desktop.png') });
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
  );
  await promotion.getByRole('button', { name: '复制注册邀请码', exact: true }).click();
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(
    '复制失败，请长按或选中下方内容手动复制',
  );
  await expect(promotion.getByRole('alert')).toHaveCount(0);
  for (const width of [1024, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const demoBounds = (await demo.boundingBox())!;
    expect(demoBounds.x).toBeLessThan(92);
    expect(demoBounds.y).toBeGreaterThan(744);
    await demo.click();
    const demoPanel = page.getByRole('dialog', { name: '选择演示内容' });
    const panelBounds = (await demoPanel.boundingBox())!;
    expect(panelBounds.x).toBeGreaterThanOrEqual(92);
    expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(width);
    expect(panelBounds.y).toBeGreaterThanOrEqual(0);
    expect(panelBounds.y + panelBounds.height).toBeLessThanOrEqual(844);
    if (width === 390) await page.screenshot({ path: info.outputPath('demo-bottom-left-mobile.png') });
    await page.keyboard.press('Escape');
    await expect(demo).toBeFocused();
    await demo.click();
    await header.click({ position: { x: 8, y: 32 } });
    await expect(demoPanel).toHaveCount(0);
    const boxes = await header.locator(':scope > button, :scope > div, :scope > a').evaluateAll((elements) =>
      elements.map((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.x, right: b.right, width: b.width };
      }),
    );
    expect(boxes.every((b) => b.x >= 104 && b.right <= width - 12)).toBe(true);
    for (let i = 1; i < boxes.length; i++)
      expect(boxes[i]!.x).toBeGreaterThanOrEqual(boxes[i - 1]!.right - 0.5);
    await checkIn.click();
    let bounds = (await page.getByRole('dialog').boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    if (width === 390) await page.screenshot({ path: info.outputPath('check-in-mobile.png') });
    await page.keyboard.press('Escape');
    bounds = (await promotion.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(104);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: info.outputPath('promotion-mobile.png') });
  }
  await page.setViewportSize({ width: 320, height: 480 });
  await demo.click();
  const shortPanel = (await page.getByRole('dialog', { name: '选择演示内容' }).boundingBox())!;
  expect(shortPanel.y).toBeGreaterThanOrEqual(12);
  expect(shortPanel.y + shortPanel.height).toBeLessThanOrEqual(468);
  await expect(
    page.getByRole('dialog', { name: '选择演示内容' }).getByRole('button', { name: /Roxy 官网/ }),
  ).toBeInViewport();
});

test('邀请链接注册、真实页面首购返奖，续购不重复奖励', async ({ page }, info) => {
  await page.goto('/#/purchase');
  await page.getByRole('link', { name: '推广计划', exact: true }).click();
  const link = (await page.getByLabel('注册邀请链接', { exact: true }).textContent())!.trim();
  await page.goto(link);
  await expect(page.getByRole('heading', { name: '创建帐号', exact: true })).toBeVisible();
  await expect(page.getByLabel('邀请码', { exact: true })).toHaveValue(/RX/);
  const email = `rewards-${crypto.randomUUID()}@example.com`;
  await page.getByLabel('手机号 / 邮箱', { exact: true }).fill(email);
  await page.getByRole('button', { name: '发送验证码', exact: true }).click();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.getByLabel('设置新密码', { exact: true }).fill('test-password123');
  await page.getByRole('button', { name: '注册并进入', exact: true }).click();
  await expect(page.getByRole('button', { name: '签到领好礼', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('chuhai-studio-session')!);
    const key = `chuhai-guide-tour-v1:${session.id}`;
    const tour = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(
      key,
      JSON.stringify({ ...tour, status: 'skipped', welcomeGift: { amount: 50, noticeShown: true } }),
    );
  });
  await page.goto('/#/purchase');
  await page.reload();
  for (let purchase = 0; purchase < 2; purchase++) {
    await page
      .getByLabel('基础版套餐', { exact: true })
      .getByRole('button', { name: /购买套餐|续购套餐/, exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
    await expect(dialog.getByRole('heading')).toHaveText('支付成功');
    await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  }
  const reward = await page.evaluate(() => {
    const inviter = JSON.parse(localStorage.getItem('chuhai-credits-v1:rewards-inviter')!);
    const session = JSON.parse(localStorage.getItem('chuhai-studio-session')!);
    localStorage.setItem(
      'chuhai-studio-session',
      JSON.stringify({
        id: 'rewards-inviter',
        name: '邀请人',
        identity: 'inviter@example.com',
        method: 'email',
        bindings: ['email'],
        checkInCampaign: 1,
      }),
    );
    return { inviter, session };
  });
  expect(reward.session.referrerId).toBe('rewards-inviter');
  expect(reward.inviter.referralRewards).toHaveLength(1);
  expect(reward.inviter.referralRewards[0].credits).toBe(96);
  await page.reload();
  await page.getByRole('link', { name: '推广计划', exact: true }).click();
  await expect(page.getByLabel('推广计划页面')).toContainText('+96积分');
  await page.screenshot({ path: info.outputPath('promotion-first-purchase.png') });
});

test('推广独立页面可切换有数据和无数据演示，不污染真实记录', async ({ page }, info) => {
  await page.goto('/#/promotion');
  const promotion = page.getByLabel('推广计划页面', { exact: true });
  const before = await page.evaluate(() => ({ ...localStorage }));
  await promotion.getByRole('button', { name: '有数据演示', exact: true }).click();
  await expect(promotion.getByRole('status')).toContainText('有数据演示');
  await expect(promotion.getByLabel('已邀请好友', { exact: true })).toContainText('8');
  await expect(promotion.getByLabel('已完成首购', { exact: true })).toContainText('3');
  await expect(promotion.getByLabel('累计奖励积分', { exact: true })).toContainText('823');
  await expect(promotion.getByRole('list', { name: '邀请与奖励记录' }).getByRole('listitem')).toHaveCount(8);
  await expect(promotion.getByRole('button', { name: '演示状态不可邀请' })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('promotion-populated.png'), fullPage: true });
  await promotion.getByRole('button', { name: /奖励明细/ }).click();
  await expect(promotion.getByRole('list', { name: '邀请与奖励记录' }).getByRole('listitem')).toHaveCount(3);
  await promotion.getByRole('button', { name: '无数据演示', exact: true }).click();
  await expect(promotion).toContainText('还没有奖励记录');
  await expect(promotion.getByLabel('累计奖励积分', { exact: true })).toContainText('0');
  await promotion.getByRole('button', { name: /邀请记录/ }).click();
  await expect(promotion).toContainText('还没有邀请记录');
  await page.screenshot({ path: info.outputPath('promotion-empty.png'), fullPage: true });
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await promotion.getByRole('button', { name: '有数据演示', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390)
      await page.screenshot({ path: info.outputPath('promotion-populated-mobile.png'), fullPage: true });
  }
  await promotion.getByRole('button', { name: '真实数据', exact: true }).click();
  await expect(promotion).toContainText('还没有邀请记录');
  await page.reload();
  await expect(promotion.getByRole('button', { name: '真实数据', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
