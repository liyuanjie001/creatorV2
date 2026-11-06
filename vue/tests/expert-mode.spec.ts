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
test('专家素材、产品与可选参数随会话保存并用于生成', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=gen&mode=expert');
  await expect(page.getByRole('heading', { name: '让每一条视频，都更懂用户' })).toBeVisible();
  await expect(page.getByText('让创意更有方向，让内容更具说服力。', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '视频参数设置' })).toHaveCount(0);
  const inputBox = (await page.getByRole('textbox', { name: '专家对话' }).boundingBox())!;
  const assetBox = (await page.getByRole('button', { name: '素材库', exact: true }).boundingBox())!;
  const settingsBox = (await page.getByRole('button', { name: '视频参数设置', exact: true }).boundingBox())!;
  expect(assetBox.y).toBeGreaterThanOrEqual(inputBox.y + inputBox.height);
  expect(settingsBox.y).toBeGreaterThanOrEqual(inputBox.y + inputBox.height);
  expect(settingsBox.x).toBeGreaterThan(assetBox.x);
  await expect(page.getByTestId('expert-mode-label')).toHaveText('专家模式');
  await expect(page.getByRole('button', { name: '视频参数设置', exact: true })).toHaveClass(/bg-white/);
  await page.locator('form').getByRole('button', { name: '产品卡', exact: true }).click();
  const picker = page.getByRole('dialog');
  const product = picker
    .locator('button')
    .filter({ has: page.locator('span.block.truncate') })
    .first();
  await product.click();
  await expect(page.getByRole('textbox', { name: '专家对话' })).toHaveValue(/@/);
  await page.getByRole('button', { name: '素材库', exact: true }).click();
  await expect(picker).toBeVisible();
  await expect
    .poll(async () => {
      const trigger = (await page.getByRole('button', { name: '素材库', exact: true }).boundingBox())!;
      const box = (await picker.boundingBox())!;
      return box.y + box.height <= trigger.y && Math.abs(box.x - trigger.x) <= 2;
    })
    .toBe(true);
  await picker.locator('.grid.grid-cols-2 > button').first().click();
  await page.getByRole('button', { name: '视频参数设置', exact: true }).click();
  const parameters = page.getByRole('region', { name: '视频参数设置' });
  await parameters.getByLabel('模型', { exact: true }).selectOption('Cinema Studio 3.0');
  await parameters.getByLabel('分辨率', { exact: true }).selectOption('4K');
  await parameters.getByLabel('比例', { exact: true }).selectOption('16:9');
  await parameters.getByLabel('时长', { exact: true }).selectOption('30');
  await parameters.getByLabel('生成音频', { exact: true }).uncheck();
  await page.screenshot({ path: `/tmp/expert-parameters-${info.project.name}.png` });
  await page.reload();
  await expect(page.getByRole('region', { name: '视频参数设置' })).toHaveCount(0);
  await page.getByRole('button', { name: '视频参数设置', exact: true }).click();
  await expect(parameters.getByLabel('模型', { exact: true })).toHaveValue('Cinema Studio 3.0');
  await expect(parameters.getByLabel('生成音频', { exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: '收起视频参数' }).click();
  await page.getByRole('textbox', { name: '专家对话' }).fill('突出产品的日常使用场景');
  await page.getByRole('button', { name: '发送消息' }).click();
  const card = (name: string) =>
    page
      .locator('section[data-agent-card]')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card('产品资料确认').getByRole('button', { name: '确认并继续' }).click();
  await card('确认整套创作方案').getByRole('button', { name: '确认并继续' }).click();
  await card('选择需要制作的脚本版本').getByRole('button', { name: '确认提交' }).click();
  for (let version = 1; version <= 5; version++) {
    for (let shot = 1; shot <= 3; shot++) {
      await card(`版本 ${version} · 镜头 ${shot}`).getByRole('button', { name: '确认并继续' }).click();
    }
  }
  await card('确认脚本与分镜').getByRole('button', { name: '确认并继续' }).click();
  await card('生成关键帧并执行 Visual QA').getByRole('button', { name: '执行任务' }).click();
  for (let version = 1; version <= 5; version++) {
    const frame = card(`版本 ${version} · 关键帧与 QA`);
    await frame.getByRole('button', { name: '重新生成', exact: true }).click();
    await frame.getByLabel('已检查并接受警告').check();
    await frame.getByRole('button', { name: '确认并继续' }).click();
  }
  await card('确认关键帧与 QA').getByRole('button', { name: '确认并继续' }).click();
  await card('确认渲染参数').getByRole('button', { name: '确认并生成' }).click();
  const film = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!);
    return state.jobs.find(
      (job: { film: { source: string }; demoPreview?: boolean }) =>
        job.film.source === '专家创作' && !job.demoPreview,
    )?.film;
  });
  expect(film).toMatchObject({
    model: 'Cinema Studio 3.0',
    quality: '4K',
    ratio: '16:9',
    duration: '30',
    audio: false,
  });
  expect(film.productIds.length).toBeGreaterThan(0);
  expect(film.referenceAssets.length).toBe(1);
  await page.reload();
  await expect(page.getByRole('log', { name: 'Agent 创作对话' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '视频生成结果', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '查看详情', exact: true }).first().click();
  await expect(page.getByRole('region', { name: '媒体预览' })).toBeVisible();
});

test('紧凑输入框、多行扩展及附件移除', async ({ page }, info) => {
  await page.goto('/#/projects/P1?section=gen&mode=expert');
  const prompt = page.getByRole('textbox', { name: '专家对话' });
  const label = page.getByTestId('expert-mode-label');
  const sendButton = page.getByRole('button', { name: '发送消息' });
  await expect(sendButton).toHaveClass(/brand-gradient/);
  const labelBox = (await label.boundingBox())!;
  const sendBox = (await sendButton.boundingBox())!;
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(sendBox.x);
  expect(Math.abs(labelBox.y + labelBox.height / 2 - sendBox.y - sendBox.height / 2)).toBeLessThan(2);
  const hintBox = (await page.getByTestId('expert-credit-hint').boundingBox())!;
  const composerBox = (await page.locator('form').boundingBox())!;
  expect(hintBox.y).toBeGreaterThan(composerBox.y + composerBox.height);
  const initial = (await prompt.boundingBox())!;
  expect(initial.height).toBeLessThanOrEqual(70);
  await prompt.fill(Array.from({ length: 8 }, (_, i) => `创意段落 ${i}`).join('\n'));
  await expect.poll(async () => (await prompt.boundingBox())!.height).toBeGreaterThan(initial.height);
  await page.locator('form').getByRole('button', { name: '产品卡', exact: true }).click();
  await page
    .getByRole('dialog')
    .locator('button')
    .filter({ has: page.locator('span.block.truncate') })
    .first()
    .click();
  for (let index = 0; index < 2; index++) {
    await page.getByRole('button', { name: '素材库', exact: true }).click();
    await page.getByRole('dialog').locator('.grid.grid-cols-2 > button').nth(index).click();
  }
  await expect(page.getByTestId('expert-asset-chip')).toHaveCount(2);
  await expect(page.getByTestId('expert-product-chip')).toHaveCount(1);
  const attachment = (await page.getByTestId('expert-asset-chip').first().boundingBox())!;
  expect(attachment.y + attachment.height).toBeLessThanOrEqual((await prompt.boundingBox())!.y);
  await page.getByRole('button', { name: '展开历史会话' }).click();
  await expect
    .poll(
      async () => (await page.getByRole('complementary', { name: '历史会话侧边栏' }).boundingBox())!.width,
    )
    .toBeGreaterThanOrEqual(239);
  const form = (await page.locator('form').boundingBox())!;
  const send = (await page.getByRole('button', { name: '发送消息' }).boundingBox())!;
  expect(send.x + send.width).toBeLessThanOrEqual(form.x + form.width);
  await page.screenshot({ path: `/tmp/expert-composer-${info.project.name}.png` });
  await page.getByTestId('expert-asset-chip').first().getByRole('button').click();
  await page.getByTestId('expert-product-chip').getByRole('button').click();
  await expect(page.getByTestId('expert-asset-chip')).toHaveCount(1);
  await expect(page.getByTestId('expert-product-chip')).toHaveCount(0);
  await page.getByRole('button', { name: '视频参数设置', exact: true }).click();
  await expect(page.getByRole('button', { name: '视频参数设置', exact: true })).toHaveClass(/bg-white/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: '视频参数设置' })).toHaveCount(0);
});
