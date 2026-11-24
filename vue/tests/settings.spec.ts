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
          id: 'demo',
          name: '林悦',
          identity: 'demo@chuhai.studio',
          method: 'email',
          bindings: ['email'],
        }),
      );
  }, token);
});
test('profile avatar opens shortcuts above on hover and keyboard focus', async ({ page }, info) => {
  await page.goto('/#/purchase');
  const avatar = page.getByRole('button', { name: '个人中心', exact: true });
  const menu = page.getByRole('navigation', { name: '个人中心快捷入口', exact: true });
  await expect(menu).toBeHidden();
  await avatar.hover();
  await expect(avatar).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('link')).toHaveText(['我的权益', '账号中心', '帮助与反馈', '消息中心']);
  await expect(page).toHaveURL(/#\/purchase$/);
  const avatarBox = (await avatar.boundingBox())!;
  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.x).toBe(avatarBox.x);
  expect(menuBox.y + menuBox.height).toBeLessThan(avatarBox.y);
  await menu.getByRole('link', { name: '账号中心', exact: true }).hover();
  await expect(menu).toBeVisible();
  await page.screenshot({ path: info.outputPath('profile-hover-desktop.png') });
  await page.getByRole('heading', { name: '套餐购买', exact: true }).hover();
  await expect(menu).toBeHidden();

  for (const [section, label] of [
    ['benefits', '我的权益'],
    ['account', '账号中心'],
    ['help', '帮助与反馈'],
    ['messages', '消息中心'],
  ]) {
    await avatar.hover();
    await menu.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`section=${section}$`));
    await expect(menu).toBeHidden();
  }

  await avatar.focus();
  await expect(menu.getByRole('link', { name: '消息中心', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.keyboard.press('ArrowRight');
  await expect(menu.getByRole('link', { name: '我的权益', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: '账号中心', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(avatar).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/section=benefits$/);
  await expect(menu).toBeHidden();
  await avatar.hover();
  await page.getByRole('heading', { name: '个人中心', exact: true }).click();
  await expect(menu).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await avatar.hover();
  await expect(menu).toBeInViewport();
  await expect(menu.getByRole('link', { name: '消息中心', exact: true })).toBeInViewport();
  const mobileAvatarBox = (await avatar.boundingBox())!;
  const mobileMenuBox = (await menu.boundingBox())!;
  expect(mobileMenuBox.y + mobileMenuBox.height).toBeLessThan(mobileAvatarBox.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('profile-hover-mobile.png') });
  await menu.getByRole('link', { name: '帮助与反馈', exact: true }).click();
  await expect(page).toHaveURL(/section=help$/);
  await expect(menu).toBeHidden();
  await avatar.click();
  await expect(page).toHaveURL(/#\/me$/);
});

test('settings navigation, history, keyboard and all four mobile pages', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/me');
  const nav = page.getByRole('navigation', { name: '设置', exact: true });
  await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(nav.getByRole('link', { name: '我的权益', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('link', { name: '账号中心', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/section=account$/);
  await nav.getByRole('link', { name: '帮助与反馈', exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/section=account$/);
  await page.goForward();
  await expect(page).toHaveURL(/section=help$/);
  await page.reload();
  await expect(page.getByRole('tab', { name: '用户反馈', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const support = page.getByLabel('联系客服', { exact: true });
  const qr = support.getByRole('img', { name: '联系客服企业微信二维码', exact: true });
  await expect(qr).toHaveAttribute('src', /\/wecom-qr\.png$/);
  await expect
    .poll(() => qr.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  const formBox = (await page.locator('form').boundingBox())!;
  const supportBox = (await support.boundingBox())!;
  expect(supportBox.x).toBeGreaterThan(formBox.x + formBox.width);
  await expect(support).toContainText('本地反馈不会自动发送给客服');
  await page.screenshot({ path: info.outputPath('settings-desktop-help.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [key, label] of [
    ['benefits', '我的权益'],
    ['account', '账号中心'],
    ['help', '帮助与反馈'],
    ['messages', '消息中心'],
  ]) {
    await nav.getByRole('link', { name: new RegExp(`^${label}`) }).click();
    await expect(page).toHaveURL(new RegExp(`section=${key}$`));
    await expect(
      page.getByRole('heading', { name: key === 'help' ? '提交反馈' : label, exact: true }),
    ).toBeVisible();
    if (key === 'help') {
      const mobileForm = (await page.locator('form').boundingBox())!;
      const mobileSupport = (await support.boundingBox())!;
      expect(mobileSupport.y).toBeGreaterThan(mobileForm.y + mobileForm.height);
      await expect(qr).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`settings-mobile-${key}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
test('demo nickname saves, refreshes and survives logout and reentry', async ({ page }) => {
  await page.goto('/#/me?section=account');
  await expect(page.getByText('演示账号可直接体验', { exact: false })).toBeVisible();
  await page.getByLabel('昵称', { exact: true }).fill('  新的创作者  ');
  await page.getByRole('button', { name: '保存昵称', exact: true }).click();
  await expect(page.getByLabel('昵称', { exact: true })).toHaveValue('新的创作者');
  await page.reload();
  await expect(page.getByLabel('昵称', { exact: true })).toHaveValue('新的创作者');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await expect(page).toHaveURL(/#\/auth$/);
  await page.getByRole('button', { name: /进入演示帐号/ }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: '账号中心', exact: true }).click();
  await expect(page.getByLabel('昵称', { exact: true })).toHaveValue('新的创作者');
});
test('help tabs preserve drafts, support keyboard, search and local feedback', async ({ page }, info) => {
  await page.goto('/#/me?section=help');
  const tabs = page.getByRole('tablist', { name: '帮助与反馈', exact: true });
  const feedbackTab = tabs.getByRole('tab', { name: '用户反馈', exact: true });
  const helpTab = tabs.getByRole('tab', { name: '帮助中心', exact: true });
  await expect(tabs.getByRole('tab')).toHaveCount(2);
  await expect(feedbackTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByLabel('搜索常见问题')).toBeHidden();
  const draft = '建议增加更多账号管理与批量发布的详细操作示例。';
  await page.getByLabel('问题描述', { exact: true }).fill(draft);
  await page.getByLabel('联系方式（选填）', { exact: true }).fill('creator@example.com');
  await feedbackTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(helpTab).toBeFocused();
  await expect(helpTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('问题描述', { exact: true })).toBeHidden();
  await page.getByLabel('搜索常见问题').fill('账号同步失败');
  await page.getByText('账号同步失败需要重新购买吗？', { exact: true }).click();
  await expect(page.getByText('不需要。支付账本已保存', { exact: false })).toBeVisible();
  await page.getByLabel('搜索常见问题').fill('不存在的问题abc');
  await expect(page.getByRole('status').filter({ hasText: '未找到相关问题' })).toBeVisible();
  await page.getByLabel('搜索常见问题').fill('');
  await page.getByRole('button', { name: '账号安全', exact: true }).click();
  await expect(page.locator('details')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('help-center-desktop.png'), fullPage: true });
  await helpTab.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(feedbackTab).toBeFocused();
  await expect(page.getByLabel('问题描述', { exact: true })).toHaveValue(draft);
  await expect(page.getByLabel('联系方式（选填）', { exact: true })).toHaveValue('creator@example.com');
  await helpTab.click();
  await expect(page.getByRole('button', { name: '账号安全', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('搜索常见问题').fill('密码');
  await feedbackTab.click();
  await helpTab.click();
  await expect(page.getByLabel('搜索常见问题')).toHaveValue('密码');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(helpTab).toBeInViewport();
  await expect(feedbackTab).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('help-center-mobile.png'), fullPage: true });
  await feedbackTab.click();
  await page.screenshot({ path: info.outputPath('user-feedback-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '保存反馈', exact: true }).click();
  const records = page.getByLabel('本地反馈记录', { exact: true });
  await expect(records.getByRole('button')).toHaveCount(1);
  await page.reload();
  await expect(records.getByRole('button')).toHaveCount(1);
  await records.getByRole('button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('尚未发送客服');
  await expect(dialog).toContainText('creator@example.com');
  await page.keyboard.press('Escape');
  await page.getByLabel('问题描述', { exact: true }).fill('建议增加更多账号管理与批量发布的详细操作示例。');
  await page.getByLabel('联系方式（选填）', { exact: true }).fill('creator@example.com');
  await page.getByRole('button', { name: '保存反馈', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('相同反馈');
  await expect(records.getByRole('button')).toHaveCount(1);
});
test('feedback images validate, preview, survive tabs and restore after saving', async ({ page }, info) => {
  await page.goto('/#/me?section=help');
  const input = page.getByLabel('选择反馈图片', { exact: true });
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 600;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#e0f2fe';
    context.fillRect(0, 0, 1000, 600);
    context.fillStyle = '#0284c7';
    context.font = '42px sans-serif';
    context.fillText('Feedback screenshot', 40, 100);
    return canvas.toDataURL('image/png');
  });
  const png = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  const file = { name: '问题截图.png', mimeType: 'image/png', buffer: png };
  const images = page.getByRole('group', { name: '图片附件（选填）' });
  await input.setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('text') });
  await expect(page.getByRole('alert')).toContainText('JPG、PNG 或 WebP');
  await input.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('alert')).toContainText('不能超过 5 MB');
  await input.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('图片无法读取');
  await expect(images.getByRole('img')).toHaveCount(0);
  await input.setInputFiles([file, file, file, file]);
  await expect(page.getByRole('alert')).toContainText('最多添加 3 张');
  await expect(images.getByRole('img')).toHaveCount(0);
  await input.setInputFiles(file);
  await expect(images.getByRole('img')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await images.getByRole('button', { name: /^预览图片/ }).click();
  await expect(page.getByRole('dialog', { name: '图片预览' })).toBeVisible();
  await page.getByRole('button', { name: '关闭预览', exact: true }).click();
  await images.getByRole('button', { name: '删除图片 1', exact: true }).click();
  await expect(images.getByRole('img')).toHaveCount(0);
  await input.setInputFiles([file, { ...file, name: '截图2.png' }, { ...file, name: '截图3.png' }]);
  await expect(images.getByRole('img')).toHaveCount(3);
  await expect(page.getByRole('button', { name: '上传图片', exact: true })).toBeHidden();
  await page.getByRole('tab', { name: '帮助中心', exact: true }).click();
  await page.getByRole('tab', { name: '用户反馈', exact: true }).click();
  await expect(images.getByRole('img')).toHaveCount(3);
  await page.getByLabel('问题描述', { exact: true }).fill('账号管理页面出现的问题已附截图，请查看。');
  await page.screenshot({ path: info.outputPath('feedback-images-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('feedback-images-mobile.png'), fullPage: true });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'chuhai-feedback-v1:demo' && !failed) {
        failed = true;
        throw new Error('test quota exceeded');
      }
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '保存反馈', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('本地保存失败');
  await expect(images.getByRole('img')).toHaveCount(3);
  await expect(page.getByLabel('问题描述', { exact: true })).toHaveValue(
    '账号管理页面出现的问题已附截图，请查看。',
  );
  await page.getByRole('button', { name: '保存反馈', exact: true }).click();
  await expect(images.getByRole('img')).toHaveCount(0);
  const records = page.getByLabel('本地反馈记录', { exact: true });
  await expect(records).toContainText('3 张图片附件');
  await page.reload();
  await records.getByRole('button').click();
  const detail = page.getByRole('dialog', { name: '反馈详情', exact: true });
  await expect(detail.getByLabel('反馈图片附件').locator('img')).toHaveCount(3);
  await detail.getByRole('button', { name: /^预览附件 1/ }).click();
  const preview = page.getByRole('dialog', { name: '图片预览', exact: true });
  await expect(preview.locator('img')).toBeVisible();
  await expect(preview).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(preview).toBeHidden();
  await expect(detail).toBeVisible();
});

test('purchase messages are real, read state persists and details navigate', async ({ page }, info) => {
  await page.goto('/#/purchase');
  await page
    .getByLabel('基础版套餐', { exact: true })
    .getByRole('button', { name: /订阅套餐|续购套餐/, exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: /^消息中心/ }).click();
  await expect(page.getByRole('article', { name: '支付成功', exact: true })).toHaveCount(1);
  await expect(page.getByRole('article', { name: '账号已到账', exact: true })).toContainText(
    '2 个美国 TikTok 账号使用权',
  );
  await page.getByRole('button', { name: '购买', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('settings-desktop-messages.png'), fullPage: true });
  await page.getByRole('article', { name: '账号已到账', exact: true }).getByRole('button').first().click();
  await expect(dialog.getByRole('heading')).toHaveText('账号已到账');
  await dialog.getByRole('button', { name: '查看账号', exact: true }).click();
  await expect(page).toHaveURL(/#\/accounts$/);
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: /^消息中心/ }).click();
  await page.getByRole('button', { name: '全部已读', exact: true }).click();
  await page.getByLabel('只看未读').check();
  await expect(page.getByText('暂无未读消息', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '全部已读', exact: true })).toBeDisabled();
  await expect(page.getByRole('article', { name: '支付成功', exact: true })).toHaveCount(1);
});
test('registered account nickname and verified password change survive login', async ({ page }) => {
  await page.goto('/#/me?section=account');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('button', { name: '立即注册', exact: true }).click();
  const email = `settings-${Date.now()}@example.com`;
  await page.locator('#auth-identity').fill(email);
  await page.getByRole('button', { name: '发送验证码', exact: true }).click();
  await page.locator('#auth-code').fill('123456');
  await page.locator('#auth-password').fill('Original123');
  await page.getByRole('button', { name: '注册并进入', exact: true }).click();
  await page.getByRole('button', { name: '关闭新手引导', exact: true }).click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: '账号中心', exact: true }).click();
  await page.getByLabel('昵称', { exact: true }).fill('独立创作者');
  await page.getByRole('button', { name: '保存昵称', exact: true }).click();
  await page.clock.install();
  await page.getByRole('button', { name: '发送验证码', exact: true }).click();
  await expect(page.getByRole('button', { name: /秒后重发/ })).toBeDisabled();
  await page.clock.fastForward(61000);
  await expect(page.getByRole('button', { name: '发送验证码', exact: true })).toBeEnabled();
  await page.getByLabel('验证码', { exact: true }).fill('123456');
  await page.getByLabel('新密码', { exact: true }).fill('Updated123');
  await page.getByLabel('确认新密码', { exact: true }).fill('Mismatch123');
  await page.getByRole('button', { name: '显示密码', exact: true }).click();
  await expect(page.getByLabel('新密码', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: '确认修改密码', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('不一致');
  await page.getByLabel('确认新密码', { exact: true }).fill('Updated123');
  await page.getByRole('button', { name: '确认修改密码', exact: true }).click();
  await expect(page.getByLabel('新密码', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('button', { name: '密码登录', exact: true }).click();
  await page.locator('#auth-identity').fill(email);
  await page.locator('#auth-password').fill('Updated123');
  await page.getByRole('button', { name: '登录', exact: true }).last().click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: '账号中心', exact: true }).click();
  await expect(page.getByLabel('昵称', { exact: true })).toHaveValue('独立创作者');
});
test('corrupt local records show errors without overwriting data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('chuhai-feedback-v1:demo', '{');
    localStorage.setItem('chuhai-notifications-v1:demo', '{}');
  });
  await page.goto('/#/me?section=help');
  await expect(page.getByRole('alert')).toContainText('读取失败');
  await expect(page.getByRole('button', { name: '保存反馈', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: /^消息中心/ }).click();
  await expect(page.getByRole('alert')).toContainText('读取失败');
  await expect(page.getByText('暂无消息', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chuhai-notifications-v1:demo'))).toBe('{}');
});

test('sync failure messages recover without duplicate payment or delivery', async ({ page }) => {
  await page.goto('/#/purchase');
  await page
    .getByLabel('基础版套餐', { exact: true })
    .getByRole('button', { name: /订阅套餐|续购套餐/, exact: true })
    .click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (
        !failed &&
        key === 'chuhai-studio-v1:demo' &&
        JSON.parse(value).accounts.some((account: { orderId?: string }) => account.orderId)
      ) {
        failed = true;
        throw new Error('test sync failure');
      }
      return original.call(this, key, value);
    };
  });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '模拟支付成功', exact: true }).click();
  await expect(dialog).toContainText('支付已完成，账号同步失败');
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chuhai-notifications-v1:demo') ?? '[]').map(
      (item: { title: string }) => item.title,
    ),
  );
  expect(events).toContain('支付成功');
  expect(events).toContain('账号同步失败');
  expect(events).not.toContain('账号已到账');
  await dialog.getByRole('button', { name: '重试账号同步', exact: true }).click();
  await expect(dialog).toContainText('已到账 2 个账号');
  await dialog.getByRole('button', { name: '关闭', exact: true }).first().click();
  await page.getByRole('button', { name: '个人中心', exact: true }).click();
  await page.getByRole('link', { name: /^消息中心/ }).click();
  await page.getByRole('button', { name: '购买', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(page.getByRole('article', { name: '账号同步已恢复', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '购买', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(page.getByLabel('积分余额', { exact: true })).toHaveText('1,061');
});
