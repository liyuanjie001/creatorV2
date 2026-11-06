import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const token = createHash('sha256').update(loadEnv('production', process.cwd(), 'password').password ?? '').digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(token => {
    localStorage.setItem('chuhai-access-token', token);
    localStorage.setItem('chuhai-studio-session', JSON.stringify({ id: 'demo', name: '林悦', identity: 'demo@chuhai.studio', method: 'email', bindings: ['email'] }));
  }, token);
});
test('自由创作快捷入口支持标签、视频链接、本地上传与爆款导航', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=gen&mode=normal');
  const shortcuts = page.getByLabel('视频快捷入口');
  await shortcuts.getByRole('button', { name: '拆解视频脚本', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '拆解视频脚本' })).toBeVisible();
  await dialog.getByLabel('视频链接', { exact: true }).fill('bad-link');
  await dialog.getByRole('button', { name: '使用链接' }).click();
  await expect(dialog.getByRole('alert')).toContainText('有效');
  await dialog.getByLabel('视频链接', { exact: true }).fill('https://example.com/video.mp4');
  await dialog.getByRole('button', { name: '使用链接' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('complementary', { name: '目标视频' })).toContainText('example.com/video.mp4');
  const sourceBox = (await page.getByRole('complementary', { name: '目标视频' }).boundingBox())!;
  const textBox = (await page.getByRole('textbox', { name: '创作提示词' }).boundingBox())!;
  expect(sourceBox.x + sourceBox.width).toBeLessThanOrEqual(textBox.x);
  await expect(page.getByRole('button', { name: '移除快捷入口标签' })).toBeVisible();
  await expect(shortcuts.getByRole('button', { name: '拆解视频脚本', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await shortcuts.getByRole('button', { name: '修改视频', exact: true }).click();
  await dialog.getByLabel('上传快捷入口视频').setInputFiles({ name: 'reference.mp4', mimeType: 'video/mp4', buffer: Buffer.from('mock video reference') });
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('reference.mp4', { exact: true })).toBeVisible();
  await page.screenshot({ path: `/tmp/creation-shortcuts-${info.project.name}.png` });
  await page.getByRole('button', { name: '移除快捷入口标签' }).click();
  await expect(page.getByRole('button', { name: '移除快捷入口标签' })).toHaveCount(0);
  await shortcuts.getByRole('button', { name: '爆款视频复刻', exact: true }).click();
  await dialog.getByRole('link', { name: '查看更多爆款视频' }).click();
  await expect(page).toHaveURL(/inspiration/);
});

test('作品详情修改视频直接引用当前作品且不填入原提示词', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish&tab=creations');
  const title = '晨间护肤故事 · 从洁面到精华的轻松护肤流程与真实使用体验';
  await page.getByLabel('每页条数').selectOption('50');
  const row = page.getByRole('row').filter({ has: page.getByRole('textbox', { name: `修改视频名称 ${title}`, exact: true }) });
  await row.getByRole('button', { name: `查看 ${title}`, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '修改视频', exact: true }).click();
  await expect(page).toHaveURL(/editFilm=/);
  const input = page.getByPlaceholder('告诉我你要修改的内容，如：修改第5-6秒人物表情......');
  await expect(input).toHaveValue('');
  await expect(page.getByRole('button', { name: '移除快捷入口标签' })).toBeVisible();
  await expect(page.getByLabel('视频快捷入口').getByRole('button', { name: '修改视频', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(input).toHaveValue('');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});
