import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const token = createHash('sha256')
  .update(loadEnv('production', process.cwd(), 'password').password ?? '')
  .digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ token }) => {
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
    },
    { token },
  );
});
test('统一列表、筛选地址恢复、缩略图及视频详情', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/projects/P1?section=publish');
  const manager = page.getByRole('region', { name: '我的作品内容' });
  await expect(page.getByRole('table', { name: '全部视频列表' })).toBeVisible();
  await page.getByLabel('创作方式筛选').selectOption('专家模式');
  await expect(page).toHaveURL(/source=/);
  await page.reload();
  await expect(page.getByLabel('创作方式筛选')).toHaveValue('专家模式');
  await manager.getByRole('button', { name: '重置', exact: true }).click();
  await page.getByRole('button', { name: '搜索视频', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索视频' }).fill('晨间');
  await page.getByRole('textbox', { name: '搜索视频' }).press('Enter');
  await expect(page).toHaveURL(/q=/);
  await manager.getByRole('button', { name: '重置', exact: true }).click();
  await page.getByRole('button', { name: '缩略图视图' }).click();
  await expect(manager.locator('article')).toHaveCount(12);
  await expect(manager.locator('article').filter({ hasText: '生成中' }).first()).toBeVisible();
  await page.screenshot({ path: `/tmp/video-management-${info.project.name}-grid.png`, fullPage: true });
  await page.getByRole('button', { name: '列表视图' }).click();
  await page.getByRole('button', { name: '查看视频详情', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('参考产品卡');
  await expect(page.getByRole('dialog')).toContainText('实际发布时间');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^已发布/ }).click();
  await expect(page.getByRole('table', { name: '已发布视频列表' })).toBeVisible();
  await expect(page.getByRole('button', { name: '上传视频', exact: true })).toHaveCount(0);
  await page.screenshot({ path: `/tmp/video-management-${info.project.name}-published.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('独立配置发布、排期调整取消与刷新恢复', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  await page.getByRole('button', { name: '去发布', exact: true }).first().click();
  await expect(page).toHaveURL(/tab=configure/);
  const selects = page.locator('select');
  await selects.first().selectOption('tk-glow');
  await page.getByRole('radio', { name: '定时发布', exact: true }).check();
  await page.getByRole('button', { name: '定时发布', exact: true }).click();
  await expect(page.getByRole('table', { name: '已发布视频列表' })).toBeVisible();
  await expect(page.getByRole('button', { name: '改期', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '改期', exact: true }).click();
  await page.getByLabel('调整排期时间').fill('2099-11-04T18:00');
  await page.getByRole('button', { name: '保存排期' }).click();
  await expect(page.getByRole('table')).toContainText('2099/11/04');
  await page.getByLabel('选择当前页').check();
  await expect(page.getByRole('button', { name: '取消排期', exact: true }).first()).toBeDisabled();
  await page.getByRole('button', { name: '取消选择', exact: true }).click();
  await page.getByLabel('发布状态筛选').selectOption('已排期');
  await page.getByLabel('选择当前页').check();
  await page.getByRole('button', { name: '取消排期', exact: true }).first().click();
  await page.getByRole('button', { name: '确认取消' }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(0);
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('已取消');
});

test('分页、批量部分失败重试和再次发布保留原记录', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/#/projects/P1?section=publish');
  await expect(page.getByRole('table')).toBeVisible();
  const titles = await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const s = JSON.parse(localStorage.getItem(key)!);
    const sample = s.films[0];
    const names = ['批量测试第一条成片', '批量测试第二条成片'];
    const films = Array.from({ length: 25 }, (_, i) => ({
      ...sample,
      id: `batch-film-${i}`,
      title: names[i] || `分页示例 ${i}`,
      createdAt: new Date(Date.now() + i * 1000).toISOString(),
    }));
    s.films.push(...films);
    s.tasks.push(
      ...films.slice(0, 2).map((f, i) => ({
        id: `batch-task-${i}`,
        batchId: '',
        filmId: f.id,
        projectId: 'P1',
        accountId: 'tk-glow',
        title: f.title,
        tags: '',
        privacy: 'PUBLIC_TO_EVERYONE',
        comments: true,
        duet: true,
        stitch: true,
        ai: false,
        commercial: false,
        cover: '首帧',
        photoMusic: false,
        scheduledAt: '',
        status: '待配置',
        createdAt: f.createdAt,
        dueAt: 0,
        simulateFailure: i === 0,
        attempt: 0,
      })),
    );
    localStorage.setItem(key, JSON.stringify(s));
    return names;
  });
  await page.reload();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: '下一页' }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(page.getByRole('button', { name: '上一页' })).toBeEnabled();
  await page.getByLabel('每页条数').selectOption('50');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(37);
  for (const title of titles)
    await page.getByRole('checkbox', { name: `选择 ${title}`, exact: true }).check();
  await page.getByRole('button', { name: '发布', exact: true }).click();
  await expect(page).toHaveURL(/configure/);
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('发布失败', { timeout: 12000 });
  await expect(page.getByRole('table')).toContainText('发布成功');
  await page.getByRole('button', { name: '重新配置', exact: true }).click();
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr').filter({ hasText: '发布失败' })).toHaveCount(0, {
    timeout: 12000,
  });
  await expect(page.getByRole('table').locator('tbody tr').filter({ hasText: titles[0] })).toContainText(
    '发布成功',
    { timeout: 12000 },
  );
  await page.getByRole('button', { name: /^全部/ }).click();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('textbox', { name: `修改视频名称 ${titles[1]}`, exact: true }) });
  await row.getByRole('button', { name: '再次发布', exact: true }).click();
  await page.locator('select').first().selectOption('tk-glow');
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('table').locator('tbody tr').filter({ hasText: titles[1] })).toHaveCount(2);
  await page.getByRole('button', { name: '缩略图视图' }).click();
  await expect(page.locator('article').filter({ hasText: titles[1] })).toHaveCount(2);
});

test('生成任务重命名、批量禁用原因与外部内容解除关联', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  const name = page.getByRole('textbox', { name: '修改视频名称 产品展示短片 · 生成中（演示）', exact: true });
  await name.fill('生成任务的新名称');
  await name.press('Enter');
  await page.reload();
  await expect(page.getByRole('textbox', { name: '修改视频名称 生成任务的新名称', exact: true })).toHaveValue(
    '生成任务的新名称',
  );
  await page.getByRole('checkbox', { name: '选择 生成任务的新名称', exact: true }).check();
  await expect(page.getByRole('button', { name: '发布', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '删除', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '取消选择', exact: true }).click();
  await page.getByLabel('创作方式筛选').selectOption('TK 历史内容');
  const first = page.getByRole('table').locator('tbody tr').first();
  await first.getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: '下载', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('外部内容仅解除项目关联');
  await page.getByRole('button', { name: '确认删除' }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(3);
  const contents = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).content,
  );
  expect(contents).toHaveLength(8);
  await page.getByRole('button', { name: /^已发布/ }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(3);
});
