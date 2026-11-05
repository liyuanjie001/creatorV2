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
test('删除帐号二次确认、取消待执行任务、保留发布历史，发布中禁删', async ({ page }) => {
  await page.goto('/#/accounts');
  const glow = page.getByRole('row').filter({ hasText: 'GlowUp Official' });
  await expect(glow.getByRole('button', { name: '删除', exact: true })).toBeDisabled();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const s = JSON.parse(localStorage.getItem(key)!);
    s.tasks = s.tasks.filter((t: { status: string }) => t.status !== '发布中');
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.reload();
  await glow.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2 条待发布或已排期任务');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(glow).toHaveCount(1);
  await glow.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除帐号', exact: true }).click();
  await expect(glow).toHaveCount(0);
  await page.reload();
  await expect(glow).toHaveCount(0);
  await page.goto('/#/projects/P1?section=publish&tab=records');
  await expect(page.getByRole('table')).toContainText('@glowup.official');
  await expect(
    page.getByRole('table').locator('tbody tr').filter({ hasText: '待发布（演示）' }),
  ).toContainText('已取消');
  await page.goto('/#/accounts');
  await page.getByRole('button', { name: '添加 TK 帐号' }).click();
  await page.getByRole('button', { name: '前往 TikTok 授权（演示）' }).click();
  await page.getByPlaceholder('@your.brand').fill('glowup.official');
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await page.getByRole('button', { name: '返回帐号列表' }).click();
  await expect(page.getByRole('table')).toContainText('@glowup.official');
});
test('作品状态、菜单与弹窗动作一致，移除作品保留发布记录', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=publish&size=50');
  const table = page.getByRole('table', { name: '全部视频列表' });
  const row = table.getByRole('row').filter({
    has: page.getByRole('textbox', { name: '修改视频名称 护肤实测 · 成功后创建草稿（演示）', exact: true }),
  });
  await expect(row).toContainText('发布成功');
  await expect(row.getByRole('button', { name: '再次发布', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '查看视频详情', exact: true })).toHaveCount(0);
  await row.getByRole('button', { name: '更多操作', exact: true }).click();
  const labels = await page.getByRole('menuitem').allTextContents();
  await page.keyboard.press('Escape');
  await row.getByRole('button', { name: '查看 护肤实测 · 成功后创建草稿（演示）', exact: true }).click();
  const dialog = page.getByRole('dialog');
  for (const label of labels)
    await expect(dialog.getByRole('button', { name: label.trim(), exact: true })).toBeVisible();
  await expect(dialog).toContainText('发布成功');
  await page.screenshot({ path: `/tmp/work-details-${info.project.name}.png`, fullPage: true });
  await dialog.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: /^已发布/ }).click();
  const record = page.getByRole('table').getByRole('row').filter({ hasText: '成功后创建草稿' });
  await expect(record).toHaveCount(1);
  await record.getByRole('button', { name: '更多操作' }).click();
  await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toHaveCount(0);
});
test('正常图文媒体可预览，缺失媒体禁止发布，工具栏顺序正确', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=publish&size=50');
  const table = page.getByRole('table', { name: '全部视频列表' });
  const healthy = table.getByRole('row').filter({
    has: page.getByRole('textbox', { name: '修改视频名称 产品图集 · 图片可用（演示）', exact: true }),
  });
  await expect(healthy.getByRole('img', { name: '图文首图封面' })).toBeVisible();
  await expect(healthy.getByRole('button', { name: '去发布', exact: true })).toBeEnabled();
  const missing = table.getByRole('row').filter({
    has: page.getByRole('textbox', { name: '修改视频名称 产品图集 · 媒体缺失（演示）', exact: true }),
  });
  await expect(missing.getByRole('button', { name: '去发布', exact: true })).toBeDisabled();
  await healthy.getByRole('checkbox').check();
  const search = (await page.getByRole('textbox', { name: '搜索视频', exact: true }).boundingBox())!;
  const upload = (await page.locator('label').filter({ hasText: '上传视频 / 图文' }).boundingBox())!;
  const publish = (await page.getByRole('button', { name: '发布', exact: true }).boundingBox())!;
  expect(search.x + search.width).toBeLessThanOrEqual(upload.x);
  expect(upload.x + upload.width).toBeLessThanOrEqual(publish.x);
  await healthy.getByRole('button', { name: '查看 产品图集 · 图片可用（演示）', exact: true }).click();
  await expect(page.getByRole('region', { name: '媒体预览' }).getByRole('img')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.goto('/#/accounts?tab=groups');
  await page.screenshot({ path: `/tmp/groups-${info.project.name}-list.png`, fullPage: true });
});

test('发布中示例主动刷新后完成，所有状态可在筛选中查看', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish&size=50');
  const table = page.getByRole('table');
  for (const status of ['未发布', '发布成功', '发布失败', '已取消', '待发布', '已排期', '发布中']) {
    await page.getByLabel('发布状态筛选').selectOption(status);
    await expect(table.locator('tbody tr').first()).toBeVisible();
  }
  const row = table.locator('tbody tr').first();
  await row.getByRole('button', { name: '更多操作' }).click();
  await page.getByRole('menuitem', { name: '刷新状态', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(0, { timeout: 10000 });
  await page.getByLabel('发布状态筛选').selectOption('发布成功');
  await expect(
    table.getByRole('textbox', { name: '修改视频名称 好物分享 · 发布中（演示）', exact: true }),
  ).toBeVisible();
});
