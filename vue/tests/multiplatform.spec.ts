import { expect, test, type Page } from '@playwright/test';
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
async function search(page: Page, value: string) {
  const input = page.getByRole('textbox', { name: '搜索视频', exact: true });
  await input.fill(value);
  await input.press('Enter');
}
async function chooseAccount(page: Page, index: number, name: string) {
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).nth(index).click();
  await page.getByRole('button', { name, exact: true }).click();
}
test('帐号详情、平台筛选、返回恢复及多平台模拟授权', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/accounts?platform=instagram&q=GlowUp');
  await expect(page.getByRole('table', { name: '帐号列表' }).locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'GlowUp Instagram', exact: true }).click();
  await expect(page).toHaveURL(/accounts\/demo-instagram/);
  await expect(page.getByRole('region', { name: '帐号信息' })).toContainText('Instagram');
  await expect(page.getByRole('table', { name: '帐号已发布列表' })).toContainText('图文');
  await page.getByLabel('搜索帐号已发布内容').fill('不存在');
  await expect(page.getByRole('table', { name: '帐号已发布列表' })).toContainText('暂无符合条件');
  await page.getByLabel('搜索帐号已发布内容').fill('');
  await page
    .getByRole('table', { name: '帐号已发布列表' })
    .getByRole('button', { name: /^查看 / })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Instagram');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'GlowUp Instagram', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/account-detail-' + info.project.name + '.png', fullPage: true });
  await page.getByRole('button', { name: '返回帐号管理' }).click();
  await expect(page.getByRole('navigation', { name: '帐号平台分类' }).getByRole('button', { name: 'Instagram', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('搜索帐号', { exact: true })).toHaveValue('GlowUp');
  await page.getByRole('button', { name: '添加帐号', exact: true }).click();
  await page.getByLabel('帐号平台', { exact: true }).selectOption('facebook');
  await page.getByRole('button', { name: '前往 Facebook 授权（演示）', exact: true }).click();
  await page.getByLabel('Facebook 用户名', { exact: true }).fill('@new.brand');
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('授权结果已保存');
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.goto('/#/accounts?platform=facebook');
  await expect(page.getByRole('table')).toContainText('@new.brand');
  await page.goto('/#/accounts/tk-life');
  await expect(page.getByRole('region', { name: '帐号信息' })).toContainText('登录过期');
  await page.getByRole('button', { name: '立即登录授权', exact: true }).click();
  await expect(page.getByLabel('帐号平台', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '前往 TikTok 授权（演示）', exact: true }).click();
  await page.getByRole('button', { name: '完成授权', exact: true }).click();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByRole('region', { name: '帐号信息' })).toContainText('在线');
  await page.goto('/#/accounts/missing');
  await expect(page.getByRole('heading', { name: '帐号不可用' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('同作品三平台配置、合并文案、城市时区、改期取消和分类恢复', async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/projects/P1?section=publish');
  const work = page
    .getByRole('row')
    .filter({ has: page.getByRole('textbox', { name: '修改视频名称 晨间护肤故事（演示）', exact: true }) });
  await expect(page.getByRole('heading', { name: '我的作品', exact: true })).toBeVisible();
  await expect(
    page.locator('nav[aria-label="项目导航"]').getByRole('button', { name: '发布记录', exact: true }),
  ).toHaveCount(0);
  await work.getByRole('button', { name: '去发布', exact: true }).click();
  await chooseAccount(page, 0, '选择 @glowup.official');
  const caption = page.getByLabel('发布文案', { exact: true });
  await caption.fill('统一输入的正文 #TikTok #好物');
  await page.getByRole('button', { name: 'AI 帮写', exact: true }).click();
  await expect(caption).toHaveValue(/统一输入的正文\n发现日常/);
  await expect(caption).toHaveValue(/#TikTok #好物/);
  await caption.fill('统一输入的正文 #TikTok #好物');
  await expect(page.getByLabel('话题标签', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '添加发布帐号', exact: true }).click();
  await chooseAccount(page, 1, '选择 @glowup.official · Facebook');
  await caption.nth(1).fill('Facebook 发布文案 #分享');
  await page.getByRole('button', { name: '添加发布帐号', exact: true }).last().click();
  await chooseAccount(page, 2, '选择 @glowup.official · Instagram');
  await caption.nth(2).fill('Instagram 发布文案 #日常');
  // Only the TikTok configuration exposes TikTok-specific controls.
  await expect(page.getByText('合拍', { exact: true })).toHaveCount(1);
  await page.getByRole('radio', { name: '定时发布', exact: true }).nth(2).check();
  await page.getByLabel('发布日期', { exact: true }).fill('2099-07-01');
  await page.getByLabel('发布时间', { exact: true }).fill('09:00');
  await page.getByRole('button', { name: '发布时区', exact: true }).click();
  await page.getByLabel('搜索国家或城市时区').fill('Los Angeles');
  await page.getByRole('button', { name: /洛杉矶/ }).click();
  await expect(page.getByLabel('发布时间', { exact: true })).toHaveValue('09:00');
  await page.reload();
  await expect(caption.nth(0)).toHaveValue('统一输入的正文 #TikTok #好物');
  await expect(caption.nth(2)).toHaveValue('Instagram 发布文案 #日常');
  await expect(page.getByRole('button', { name: '发布时区' })).toContainText('(GMT-7) 洛杉矶');
  await expect(page.getByLabel('发布时间', { exact: true })).toHaveValue('09:00');
  await page.screenshot({ path: '/tmp/multiplatform-config-' + info.project.name + '.png', fullPage: true });
  await page.getByRole('button', { name: '提交发布', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).tasks.filter(
            (t: { filmId: string; status: string }) => t.filmId === 'video-v2-0' && t.status === '发布成功',
          ).length,
      ),
    )
    .toBe(2);
  await search(page, '晨间护肤故事（演示）');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('table')).toContainText('Facebook');
  await page.getByRole('button', { name: '已发布', exact: true }).click();
  await search(page, '发布文案');
  await expect(page.getByRole('table')).toContainText('Facebook 发布文案');
  await page.getByRole('navigation', { name: '发布平台分类' }).getByRole('button', { name: 'Facebook', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page
    .getByRole('table')
    .getByRole('button', { name: /^查看 / })
    .click();
  await expect(page.getByRole('dialog')).toContainText('发布历史（3）');
  await expect(page.getByRole('dialog')).toContainText('Instagram');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '定时发布', exact: true }).click();
  await search(page, 'Instagram 发布文案');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('table')).toContainText('(GMT-7) 洛杉矶');
  await expect(page.getByRole('table')).not.toContainText('Los Angeles');
  await page.screenshot({ path: '/tmp/timezone-list-' + info.project.name + '.png', fullPage: true });
  await page.getByRole('button', { name: '改期', exact: true }).click();
  await page.getByRole('button', { name: '发布时区', exact: true }).click();
  await page.getByLabel('搜索国家或城市时区').fill('纽约');
  await page.getByRole('button', { name: /纽约/ }).click();
  await expect(page.getByLabel('发布时间', { exact: true })).toHaveValue('09:00');
  await page.getByRole('button', { name: '保存排期', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('table')).toContainText('(GMT-4) 纽约');
  await page.getByRole('button', { name: '更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name: '取消排期', exact: true }).click();
  await page.getByRole('button', { name: '确认取消', exact: true }).click();
  await expect(page.getByRole('table')).not.toContainText('Instagram 发布文案');
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await search(page, '晨间护肤故事（演示）');
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: '缩略图视图', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.locator('article')).toContainText('Instagram');
  await page.screenshot({ path: '/tmp/works-platform-grid-' + info.project.name + '.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('排期夏令时缺失提示和重复偏移选择', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  await page
    .getByRole('row')
    .filter({ has: page.getByRole('textbox', { name: '修改视频名称 晨间护肤故事（演示）', exact: true }) })
    .getByRole('button', { name: '去发布', exact: true })
    .click();
  await chooseAccount(page, 0, '选择 @glowup.official');
  await page.getByRole('radio', { name: '定时发布', exact: true }).check();
  await page.getByLabel('发布日期', { exact: true }).fill('2027-03-14');
  await page.getByLabel('发布时间', { exact: true }).fill('02:30');
  await page.getByRole('button', { name: '发布时区' }).click();
  await page.getByLabel('搜索国家或城市时区').fill('New York');
  await page.getByRole('button', { name: /纽约/ }).click();
  await expect(page.getByText(/该当地时间不存在/)).toBeVisible();
  await expect(page.getByRole('button', { name: '定时发布', exact: true })).toBeDisabled();
  await page.getByLabel('发布日期', { exact: true }).fill('2027-11-07');
  await page.getByLabel('发布时间', { exact: true }).fill('01:30');
  await expect(page.getByText('当地时间出现两次，请明确选择：')).toBeVisible();
  await expect(page.getByRole('button', { name: '定时发布', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'GMT-05:00', exact: true }).check();
  await expect(page.getByRole('button', { name: '定时发布', exact: true })).toBeEnabled();
});
