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
test('帐号表头筛选、分组和备注编辑，刷新恢复', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/accounts');
  await expect(page.getByRole('table', { name: '帐号列表' })).toBeVisible();
  await expect(page.getByText('授权有效', { exact: true })).toHaveCount(1);
  const stats = await page.getByLabel('账号统计').innerText();
  await expect(page.getByRole('columnheader', { name: '关联项目', exact: true })).toHaveCount(0);
  await page.getByLabel('修改 GlowUp Official 的备注').click();
  await page.getByLabel('帐号备注', { exact: true }).fill('重点品牌帐号');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByLabel('修改 GlowUp Official 的分组').click();
  await page.getByLabel('帐号分组', { exact: true }).selectOption('ungrouped');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByLabel('帐号分组筛选').selectOption('ungrouped');
  await page.getByLabel('授权状态筛选').selectOption('已授权');
  await page.getByLabel('搜索帐号', { exact: true }).fill('重点');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByLabel('修改 GlowUp Official 的备注')).toHaveText('备注：重点品牌帐号');
  expect(await page.getByLabel('账号统计').innerText()).toBe(stats);
  await page.screenshot({ path: info.outputPath('accounts.png'), fullPage: true });
  expect(errors).toEqual([]);
});
test('分组列表、拖动和键盘排序、缩略图、查看及删除', async ({ page }, info) => {
  await page.goto('/#/accounts?tab=groups');
  await expect(page.getByRole('button', { name: '列表视图' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('分组名称', { exact: true }).fill('新分组');
  await page.getByRole('button', { name: '新建分组', exact: true }).click();
  const groups = page.locator('[data-group-id]');
  await expect(groups).toHaveCount(3);
  await page.getByRole('button', { name: '排序 未分组，方向键上下移动' }).press('ArrowDown');
  await expect(groups.first()).toContainText('品牌帐号');
  await page.getByRole('button', { name: '排序 品牌帐号，方向键上下移动' }).dragTo(groups.last());
  await expect(groups.last()).toContainText('品牌帐号');
  await page.reload();
  await expect(groups.last()).toContainText('品牌帐号');
  await page.getByRole('button', { name: '缩略图视图' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '缩略图视图' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('groups-grid.png'), fullPage: true });
  await page.getByRole('button', { name: '查看 品牌帐号', exact: true }).click();
  await expect(page).toHaveURL(/group=group-brand/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(3);
  await page.getByRole('button', { name: '管理分组', exact: true }).click();
  await page.getByRole('button', { name: '品牌帐号 更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除分组', exact: true }).click();
  await expect(groups).toHaveCount(2);
  await page.getByRole('button', { name: '查看 未分组', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(5);
});
test('删除帐号确认、待执行任务取消和重新授权恢复身份', async ({ page }) => {
  await page.goto('/#/accounts');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tasks = ['待发布', '已排期', '发布成功', '发布中'].map((status, i) => ({
      id: `account-task-${i}`,
      accountId: 'tk-glow',
      status,
    }));
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: 'GlowUp Official' });
  await row.getByRole('button', { name: 'GlowUp Official 更多操作', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tasks = state.tasks.filter((t: { status: string }) => t.status !== '发布中');
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await row.getByRole('button', { name: 'GlowUp Official 更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2 条待发布或已排期任务');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: 'GlowUp Official 更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除帐号', exact: true }).click();
  await page.reload();
  await expect(row).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!));
  expect(state.tasks.map((t: { status: string }) => t.status)).toEqual(['已取消', '已取消', '发布成功']);
  expect(state.projects.every((p: { accountIds: string[] }) => !p.accountIds.includes('tk-glow'))).toBe(true);
  await page.getByRole('button', { name: '绑定账号' }).click();
  await page.getByRole('button', { name: '前往 TikTok 授权（演示）' }).click();
  await page.getByPlaceholder('@your.brand').fill('glowup.official');
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('@glowup.official');
});

test('工具栏筛选、批量移组与浏览历史，统计仅跟随平台', async ({ page }) => {
  await page.goto('/#/accounts');
  const statistics = page.getByLabel('账号统计');
  const all = await statistics.innerText();
  await page.getByLabel('帐号平台分类').getByRole('button', { name: 'TikTok', exact: true }).click();
  await expect(statistics).toContainText('TikTok 账号');
  await expect(statistics).toContainText('需要处理');
  const platform = await statistics.innerText();
  await page.getByLabel('授权状态筛选').selectOption('已授权');
  expect(await statistics.innerText()).toBe(platform);
  await page.getByLabel('选择全部帐号').check();
  await page.getByLabel('批量移动到分组').selectOption('ungrouped');
  await page.getByRole('button', { name: '移动分组', exact: true }).click();
  await expect(page.getByLabel('修改 GlowUp Official 的分组')).toHaveText('未分组');
  await page.getByRole('button', { name: '管理分组', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '管理分组', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  expect(await statistics.innerText()).toBe(all);
  await page.goBack();
  await expect(page.getByLabel('授权状态筛选')).toHaveValue('已授权');
  await page.reload();
  await expect(page.getByLabel('修改 GlowUp Official 的分组')).toHaveText('未分组');
});

test('YouTube 演示绑定、详情与数据同步，存储失败可重试', async ({ page }) => {
  await page.goto('/#/accounts?platform=youtube');
  await expect(page.getByRole('table')).toContainText('暂不支持发布');
  await page.getByRole('button', { name: '绑定账号', exact: true }).click();
  await page.getByLabel('帐号平台', { exact: true }).selectOption('youtube');
  await expect(page.getByRole('dialog')).toContainText('暂不支持发布');
  await page.getByRole('button', { name: '前往 YouTube 授权（演示）', exact: true }).click();
  await page.getByLabel('YouTube 用户名', { exact: true }).fill('@video.demo');
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: '@video.demo' });
  await expect(row).toContainText('—');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.assign(window, {
      restoreAccountStorage: () => {
        Storage.prototype.setItem = original;
      },
    });
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('chuhai-studio-v1:')) throw Error('quota');
      original.call(this, key, value);
    };
  });
  await row.getByRole('button', { name: '同步 video.demo 的数据', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('保存失败');
  await page.evaluate(() =>
    (window as unknown as { restoreAccountStorage: () => void }).restoreAccountStorage(),
  );
  await row.getByRole('button', { name: '同步 video.demo 的数据', exact: true }).click();
  await expect(page.getByText('演示数据同步完成', { exact: true })).toBeVisible();
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).accounts.find(
        (a: { handle: string }) => a.handle === '@video.demo',
      ).statistics,
  );
  await row.getByRole('button', { name: '同步 video.demo 的数据', exact: true }).click();
  await expect(row.getByRole('button', { name: '同步 video.demo 的数据', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  const after = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).accounts.find(
        (a: { handle: string }) => a.handle === '@video.demo',
      ).statistics,
  );
  expect(after).toEqual(before);
  await row.getByRole('button', { name: '数据看板', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'video.demo', exact: true })).toBeVisible();
  await expect(page.getByText('YouTube 仅支持账号管理演示，暂不支持发布。', { exact: true })).toBeVisible();
});

test('390px 账号表格内部滚动与分组弹窗布局', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/accounts');
  await expect(page.getByLabel('账号统计')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const container = page.getByLabel('账号表格滚动区域');
  expect(await container.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('accounts-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '管理分组', exact: true }).click();
  const dialog = page.getByRole('dialog');
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(390);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByLabel('分组名称', { exact: true }).fill('移动团队');
  await page.getByRole('button', { name: '新建分组', exact: true }).click();
  await expect(dialog.getByText('移动团队', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('groups-mobile.png'), fullPage: true });
});
