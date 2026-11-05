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
  await expect(page.getByText('授权有效', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '关联项目', exact: true })).toHaveCount(0);
  await page.getByLabel('修改 GlowUp Official 的备注').click();
  await page.getByLabel('帐号备注', { exact: true }).fill('重点品牌帐号');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByLabel('修改 GlowUp Official 的分组').click();
  await page.getByLabel('帐号分组', { exact: true }).selectOption('ungrouped');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByLabel('帐号分组筛选').click();
  await page.getByRole('menuitem', { name: '未分组', exact: true }).click();
  await page.getByLabel('授权状态筛选').click();
  await page.getByRole('menuitem', { name: '已授权', exact: true }).click();
  await page.getByLabel('搜索帐号', { exact: true }).fill('重点');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByLabel('修改 GlowUp Official 的备注')).toHaveText('重点品牌帐号');
  await page.screenshot({ path: `/tmp/accounts-${info.project.name}.png`, fullPage: true });
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
  await page.screenshot({ path: `/tmp/groups-${info.project.name}-grid.png`, fullPage: true });
  await page.getByRole('button', { name: '查看 品牌帐号', exact: true }).click();
  await expect(page).toHaveURL(/tab=accounts.*group=group-brand/);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: '帐号分组', exact: true }).click();
  await page.getByRole('button', { name: '品牌帐号 更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除分组', exact: true }).click();
  await expect(groups).toHaveCount(2);
  await page.getByRole('button', { name: '查看 未分组', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
});
test('删除帐号确认、待执行任务取消和重新授权恢复身份', async ({ page }) => {
  await page.goto('/#/accounts');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tasks = ['待发布', '已排期', '发布成功', '发布中'].map((status, i) => ({ id: `account-task-${i}`, accountId: 'tk-glow', status }));
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: 'GlowUp Official' });
  await expect(row.getByRole('button', { name: '删除', exact: true })).toBeDisabled();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tasks = state.tasks.filter((t: { status: string }) => t.status !== '发布中');
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await row.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2 条待发布或已排期任务');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除帐号', exact: true }).click();
  await page.reload();
  await expect(row).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!));
  expect(state.tasks.map((t: { status: string }) => t.status)).toEqual(['已取消', '已取消', '发布成功']);
  expect(state.projects.every((p: { accountIds: string[] }) => !p.accountIds.includes('tk-glow'))).toBe(true);
  await page.getByRole('button', { name: '添加 TK 帐号' }).click();
  await page.getByRole('button', { name: '前往 TikTok 授权（演示）' }).click();
  await page.getByPlaceholder('@your.brand').fill('glowup.official');
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await page.getByRole('button', { name: '返回帐号列表' }).click();
  await expect(page.getByRole('table')).toContainText('@glowup.official');
});
