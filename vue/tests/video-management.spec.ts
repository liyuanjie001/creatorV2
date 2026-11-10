import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const token = createHash('sha256').update(loadEnv('production', process.cwd(), 'password').password ?? '').digest('hex');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(token => {
    localStorage.setItem('chuhai-access-token', token);
    localStorage.setItem('chuhai-studio-session', JSON.stringify({id:'demo',name:'林悦',identity:'demo@chuhai.studio',method:'email',bindings:['email']}));
  }, token);
});
async function open(page: Page, tab = 'creations') {
  await page.goto(`/#/projects/P1?section=publish&tab=${tab}`);
  await expect(page.getByRole('table')).toBeVisible();
}
function work(page: Page, title: string) {
  return page.getByRole('row').filter({has:page.getByRole('textbox',{name:`修改视频名称 ${title}（演示）`,exact:true})});
}
async function search(page: Page, value: string) {
  await page.getByRole('textbox',{name:'搜索视频',exact:true}).fill(value);
  await page.getByRole('textbox',{name:'搜索视频',exact:true}).press('Enter');
}
test('默认状态、筛选、历史草稿与刷新保持一致', async ({page}, info) => {
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await open(page);
  await page.getByLabel('每页条数').selectOption('50');
  for (const status of ['生成中','生成成功','生成失败','未发布','待发布','定时发布','发布中','发布成功','发布失败','已取消']) await expect(page.getByRole('table')).toContainText(status);
  await page.getByLabel('生成状态筛选').click();
  await expect(page.getByRole('checkbox',{name:'等待生成',exact:true})).toHaveCount(0);
  await page.getByRole('checkbox',{name:'生成中',exact:true}).check();
  await page.getByRole('button',{name:'应用',exact:true}).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  await page.reload();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
  await open(page);await page.getByLabel('每页条数').selectOption('50');
  const gallery=work(page,'水润肌肤图集');
  await expect(gallery).toContainText('发布成功');await expect(gallery.getByRole('button',{name:'再次发布',exact:true})).toBeEnabled();
  await gallery.getByRole('button',{name:/^查看 /}).click();
  await expect(page.getByRole('dialog')).toContainText('发布历史（1）');
  await expect(page.getByRole('dialog').getByRole('button',{name:'再次发布',exact:true})).toBeVisible();
  await page.screenshot({path:`/tmp/works-details-${info.project.name}.png`});
  await page.keyboard.press('Escape');
  await open(page,'records');await page.getByLabel('每页条数').selectOption('50');
  await expect(page.getByRole('table')).not.toContainText('已取消');
  await expect(page.getByRole('table')).not.toContainText('发布中');
  await page.getByLabel('发布状态筛选').click();await expect(page.getByRole('checkbox',{name:'已发布',exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('菜单、卡片与详情操作一致，只有我的作品支持删除', async ({page})=>{
  await open(page);const row=work(page,'晨间护肤故事');
  await row.getByRole('button',{name:'更多操作'}).click();
  const menu=await page.getByRole('menuitem').allTextContents();
  expect(menu).toEqual(['去发布','下载','重新生成','修改视频','删除']);
  await page.keyboard.press('Escape');await row.getByRole('button',{name:/^查看 /}).click();
  const footer = page.getByRole('dialog').locator('footer');
  expect(await footer.getByRole('button').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label')))).toEqual(['去发布','下载','重新生成','更多操作']);
  expect((await footer.textContent())?.trim()).toBe('');
  await footer.getByRole('button', { name: '更多操作', exact: true }).click();
  expect(await page.getByRole('menuitem').allTextContents()).toEqual(['修改视频','删除']);
  await page.getByRole('menuitem',{name:'删除',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('已有发布历史保留');
  await page.getByRole('button',{name:'确认删除'}).click();await page.reload();
  await expect(work(page,'晨间护肤故事')).toHaveCount(0);
  await open(page,'records');await page.getByRole('button',{name:/^查看 /}).first().click();
  await expect(page.getByRole('dialog').getByRole('button',{name:'删除',exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'更多操作'}).first().click();
  await expect(page.getByRole('menuitem',{name:'删除',exact:true})).toHaveCount(0);
});
test('生成失败可重试和修改，排队不可发布删除，媒体丢失阻止发布',async({page})=>{
  await open(page);const queued=work(page,'品牌创意短片');
  await queued.getByRole('button',{name:/^查看 /}).click();
  await expect(page.getByRole('dialog')).toContainText('生成中');
  await page.getByRole('dialog').getByRole('button',{name:'更多操作',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'删除',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const failed=work(page,'产品测评短片');await failed.getByRole('button',{name:/^查看 /}).click();
  await page.getByRole('dialog').getByRole('button',{name:'更多操作',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'修改后生成'})).toBeEnabled();
  await page.getByRole('menuitem',{name:'重试生成'}).click();
  await expect(page.getByRole('dialog')).toContainText('生成中');await page.keyboard.press('Escape');
  const missing=work(page,'自然光产品实拍');await missing.getByRole('button',{name:/^查看 /}).click();
  await expect(page.getByRole('dialog').getByRole('button',{name:'去发布',exact:true})).toBeDisabled();
  await expect(page.getByRole('dialog').getByRole('button',{name:'重新生成',exact:true})).toHaveCount(0);
});
test('独立发布、改期、取消与再次发布保持历史',async({page})=>{
  test.setTimeout(60000);await open(page);
  await work(page,'晨间护肤故事').getByRole('button',{name:'去发布',exact:true}).click();
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).click(); await page.getByRole('button', { name: '选择 @glowup.official', exact: true }).click();
  await page.getByRole('radio',{name:'定时发布',exact:true}).check();
  await page.getByRole('button',{name:'定时发布',exact:true}).click();
  await search(page,'晨间护肤故事（演示）');
  await page.getByRole('button',{name:'改期',exact:true}).click();
  await page.getByLabel('发布日期',{exact:true}).fill('2099-11-04');await page.getByLabel('发布时间',{exact:true}).fill('18:00');await page.getByRole('button',{name:'保存排期'}).click();
  await page.reload();await page.getByRole('button',{name:'更多操作'}).click();
  await page.getByRole('menuitem',{name:'取消排期',exact:true}).click();await page.getByRole('button',{name:'确认取消'}).click();
  await expect(page.getByRole('table')).not.toContainText('已取消');
  await open(page);await expect(work(page,'晨间护肤故事')).toContainText('已取消');
  await open(page);await work(page,'晨间护肤故事').getByRole('button',{name:'去发布',exact:true}).click();
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).click(); await page.getByRole('button', { name: '选择 @glowup.official', exact: true }).click();await page.getByRole('button',{name:'立即发布',exact:true}).click();
  await search(page,'晨间护肤故事（演示）');await expect(page.getByRole('table')).toContainText('发布成功',{timeout:12000});
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'已发布',exact:true}).click();await search(page,'晨间护肤故事（演示）');await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
  await open(page);await work(page,'晨间护肤故事').getByRole('button',{name:'再次发布',exact:true}).click();
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).click(); await page.getByRole('button', { name: '选择 @glowup.official', exact: true }).click();await page.getByRole('button',{name:'立即发布',exact:true}).click();
  await search(page,'晨间护肤故事（演示）');await expect(page.getByRole('table')).toContainText('发布成功',{timeout:12000});await page.getByRole('button',{name:'已发布',exact:true}).click();await search(page,'晨间护肤故事（演示）');await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(2);
});
test('失败记录重新配置重试，卡片操作及上传入口位置',async({page},info)=>{
  await open(page);await search(page,'换季护肤心得');
  await page.getByRole('button',{name:'重新配置',exact:true}).click();
  await page.getByRole('button',{name:'立即发布',exact:true}).click();
  await search(page,'换季护肤心得');await expect(page.getByRole('table')).toContainText('发布成功',{timeout:12000});
  await open(page,'records');
  const searchBox=await page.getByRole('textbox',{name:'搜索视频',exact:true}).boundingBox();
  const upload=await page.getByRole('button',{name:'发布本地作品',exact:true}).boundingBox();
  expect(upload!.x).toBeGreaterThan(searchBox!.x);expect(Math.abs(upload!.y-searchBox!.y)).toBeLessThan(10);
  await page.getByRole('button',{name:'定时发布',exact:true}).click();await page.getByRole('button',{name:'缩略图视图'}).click();
  await expect(page.locator('article').first().getByRole('button',{name:'改期',exact:true})).toBeVisible();
  await page.screenshot({path:`/tmp/records-grid-${info.project.name}.png`,fullPage:true});
});

test('多个本地图文上传合成一个作品，BGM 与图片顺序刷新恢复并可发布', async ({ page }) => {
  await page.goto('/#/projects/P1?section=publish');
  const manager = page.getByRole('region', { name: '我的作品内容' });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDuoAAAAASUVORK5CYII=', 'base64');
  await page.getByRole('button', { name: '上传本地作品' }).click();
  await page.getByRole('menuitem', { name: '图集', exact: true }).locator('input').setInputFiles([
    { name: 'carousel-cover.png', mimeType: 'image/png', buffer: png },
    { name: 'carousel-detail.png', mimeType: 'image/png', buffer: png },
  ]);
  await expect(page.getByText('上传完成，媒体已保存在本机浏览器')).toBeVisible();
  await expect(page).toHaveURL(/tab=configure/);
  await expect(page.getByText('2 张 · 首张为封面')).toBeVisible();
  await page.getByRole('button', { name: '返回上一个页面' }).click();
  await page.getByRole('button', { name: '上传本地作品' }).click();
  await page.getByRole('menuitem', { name: '图集', exact: true }).locator('input').setInputFiles({
    name: 'additional-work.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await expect(page).toHaveURL(/tab=configure/);
  await page.getByRole('button', { name: '返回上一个页面' }).click();
  await expect(page.getByRole('textbox', { name: '修改视频名称 additional-work', exact: true })).toBeVisible();
  const title = page.getByRole('textbox', { name: '修改视频名称 carousel-cover', exact: true });
  await expect(title).toBeVisible();
  const row = manager.getByRole('row').filter({ has: title });
  await expect(row).toBeVisible();
  await expect(row).toContainText('2 张图片');
  await row.getByRole('button', { name: '去发布', exact: true }).click();
  await expect(page).toHaveURL(/tab=configure/);
  await expect(page.getByText('2 张 · 首张为封面')).toBeVisible();
  await page.getByRole('button', { name: '添加图片 1' }).click();
  await page.getByRole('button', { name: /additional-work/ }).click();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByText('3 张 · 首张为封面')).toBeVisible();
  const thumbs = page.locator('[draggable="true"][aria-label^="第 "]');
  const before = await thumbs.evaluateAll(items => items.map(item => item.getAttribute('data-media-id')));
  await thumbs.nth(2).dragTo(thumbs.nth(0));
  const after = await thumbs.evaluateAll(items => items.map(item => item.getAttribute('data-media-id')));
  expect(after).toEqual([before[2], before[0], before[1]]);
  await page.getByRole('button', { name: '选择发布帐号', exact: true }).click(); await page.getByRole('button', { name: '选择 @glowup.official', exact: true }).click();
  const bgmSection = page.getByRole('region', { name: '图文图片与背景音乐' });
  await expect(bgmSection.getByRole('button', { name: '选择音乐' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('3 张 · 首张为封面')).toBeVisible();
  await expect(page.getByRole('region', { name: '图文图片与背景音乐' }).getByRole('button', { name: '选择音乐' })).toBeVisible();
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect(page).toHaveURL(/tab=creations/);
  await expect(page.getByRole('row').filter({has:page.getByRole('textbox',{name:'修改视频名称 carousel-cover',exact:true})})).toContainText('发布成功', { timeout: 12000 });
});

test('分页与批量发布部分失败，仅重试失败项保留成功记录',async({page})=>{
  test.setTimeout(60000);await open(page);
  const total=await page.evaluate(()=>{
    const key='chuhai-studio-v1:demo';const state=JSON.parse(localStorage.getItem(key)!);
    const sample=state.films.find((f:{id:string})=>f.id==='video-v2-0');
    const template=state.tasks.find((t:{status:string})=>t.status==='发布失败');
    for(let i=0;i<25;i++){
      const film={...sample,id:`batch-${i}`,title:`批量回归 ${i}`,createdAt:new Date(Date.now()+i*1000).toISOString()};state.films.push(film);
      if(i<2)state.tasks.push({...template,id:`batch-task-${i}`,filmId:film.id,title:film.title,caption:film.title,status:'待配置',demoPreview:false,submittedAt:undefined,publishedAt:undefined,platformId:undefined,createdAt:film.createdAt,simulateFailure:i===0,attempt:0,error:''});
    }
    localStorage.setItem(key,JSON.stringify(state));return state.films.length+state.jobs.filter((j:{status:string})=>j.status!=='已完成').length+state.content.filter((c:{filmId?:string;projectIds:string[]})=>c.projectIds.includes('P1')&&!c.filmId).length;
  });
  await page.reload();await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(20);
  await page.getByRole('button',{name:'下一页'}).click();await expect(page).toHaveURL(/page=2/);
  await page.reload();await expect(page.getByRole('button',{name:'上一页'})).toBeEnabled();
  await page.getByLabel('每页条数').selectOption('50');await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(total);
  for(const i of [0,1])await page.getByRole('checkbox',{name:`选择 批量回归 ${i}`,exact:true}).check();
  await page.getByRole('button',{name:'发布所选作品',exact:true}).click();await page.getByRole('button',{name:'立即发布',exact:true}).click();
  await search(page,'批量回归');await page.getByLabel('每页条数').selectOption('50');
  const first=page.getByRole('row').filter({has:page.getByRole('textbox',{name:'修改视频名称 批量回归 0',exact:true})});
  await expect(first).toContainText('发布失败',{timeout:12000});
  await first.getByRole('button',{name:'重新配置',exact:true}).click();await page.getByRole('button',{name:'立即发布',exact:true}).click();
  await search(page,'批量回归');await page.getByLabel('每页条数').selectOption('50');await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(25);
  await expect(page.getByRole('table').locator('tbody tr').filter({hasText:'发布失败'})).toHaveCount(0,{timeout:12000});
});

test('上传紧随搜索且已选筛选高亮，操作列移除查看按钮', async ({ page }) => {
  for (const tab of ['creations', 'records']) {
    await open(page, tab);
    const toolbar = page.getByTestId('video-search-upload');
    const input = await toolbar.getByRole('textbox').boundingBox();
    const upload = await toolbar.getByRole('button').boundingBox();
    expect(upload!.x).toBeGreaterThan(input!.x + input!.width);
    expect(Math.abs(upload!.y - input!.y)).toBeLessThanOrEqual(5);
    await expect(page.getByRole('button', { name: '查看视频详情', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '发布状态筛选', exact: true }).click();
    await page.getByRole('checkbox', { name: '发布成功', exact: true }).check();
    await page.getByRole('button', { name: '应用', exact: true }).click();
    const filter = page.getByRole('button', { name: '发布状态筛选', exact: true });
    await expect(filter).toHaveClass(/bg-sky-100/);
    await expect(page.getByRole('columnheader').filter({ has: filter }).locator('span').first()).toHaveClass(/text-sky-600/);
    await page.getByRole('table').getByRole('button', { name: /^查看 / }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('操作列仅图标，更多菜单按发布、定时、视频、删除分组', async ({ page }, info) => {
  await open(page);
  const row = work(page, '精华使用日记');
  const actionCell = row.getByRole('cell').last();
  await expect(actionCell.getByRole('button', { name: '改期', exact: true })).toBeVisible();
  expect((await actionCell.textContent())?.trim()).toBe('');
  await actionCell.getByRole('button', { name: '更多操作' }).click();
  const menu = page.getByRole('menu');
  expect(await menu.getByRole('menuitem').allTextContents()).toEqual(['去发布', '改期', '取消排期', '下载', '重新生成', '修改视频', '删除']);
  await expect(menu.getByRole('separator')).toHaveCount(3);
  expect(await menu.getByRole('menuitem').evaluateAll(items => items.every(item => item.querySelector('svg')))).toBe(true);
  await page.screenshot({ path: `/tmp/grouped-video-actions-${info.project.name}.png` });
});


test('发布帐号列表完整展示、搜索、过期授权与刷新恢复', async ({ page }, info) => {
  await open(page);
  await work(page, '晨间护肤故事').getByRole('button', { name: '去发布', exact: true }).click();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    const project = state.projects.find((p: { id: string }) => p.id === 'P1');
    state.accounts.push({ id: 'expired-picker', name: 'Expired Brand', handle: '@expired.brand', status: '授权过期', groupId: 'ungrouped', note: '重点复登帐号', region: 'US', authorizedAt: '2026-11-01T00:00:00Z' });
    state.accounts.push({ id: 'other-project', name: 'Other Project', handle: '@other.project', status: '已授权', groupId: 'ungrouped', note: '', region: 'US', authorizedAt: '2026-11-01T00:00:00Z' });
    project.accountIds.push('expired-picker');
    for (let i = 0; i < 8; i++) {
      const id = `long-account-${i}`;
      state.accounts.push({ id, name: '用于检查完整展示的较长帐号名称'.repeat(3), handle: `@long.account.${i}`, status: '已授权', groupId: 'ungrouped', note: '长备注内容'.repeat(20), region: 'US', authorizedAt: '2026-11-01T00:00:00Z' });
      project.accountIds.push(id);
    }
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  const trigger = page.getByRole('button', { name: '选择发布帐号', exact: true });
  await trigger.click();
  const list = page.getByRole('dialog', { name: '选择发布帐号' });
  await expect(list).toContainText('授权时间：');
  await expect(list).toContainText('分组：');
  expect(await list.locator('.overflow-y-auto').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  expect((await list.boundingBox())!.width).toBeLessThanOrEqual((await trigger.boundingBox())!.width + 1);
  await expect(list.getByRole('button', { name: '选择 @other.project', exact: true })).toHaveCount(0);
  const search = page.getByRole('textbox', { name: '搜索发布帐号', exact: true });
  await search.fill('  重点复登  ');
  await expect(list.getByRole('button', { name: '选择 @expired.brand', exact: true })).toBeDisabled();
  await expect(list).toContainText('登录过期');
  await search.fill('no-match');
  await expect(list).toContainText('没有匹配的帐号');
  await search.fill('GLOWUP');
  await expect(list.getByRole('button', { name: '选择 @glowup.official', exact: true })).toBeVisible();
  await search.fill('');
  await page.screenshot({ path: `/tmp/publish-account-picker-${info.project.name}.png` });
  await list.getByRole('button', { name: '立即登录授权 @expired.brand', exact: true }).click();
  const auth = page.getByRole('dialog', { name: '连接 TikTok 帐号' });
  await auth.getByRole('button', { name: '前往 TikTok 授权（演示）' }).click();
  await expect(auth.getByRole('textbox', { name: 'TikTok 用户名' })).toHaveValue('@expired.brand');
  await auth.getByRole('button', { name: '完成授权', exact: true }).click();
  await auth.getByRole('button', { name: '完成', exact: true }).click();
  await trigger.click();
  await expect(search).toHaveValue('');
  await search.fill('expired');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Expired Brand · @expired.brand');
  await expect(trigger).toContainText('在线');
  await page.reload();
  await expect(trigger).toContainText('@expired.brand');
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(list).toHaveCount(0);
});

test('多条发布独立选帐号，失效帐号保留提示并拦截发布', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    const project = state.projects.find((p: { id: string }) => p.id === 'P1');
    const original = state.accounts.find((a: { id: string }) => a.id === 'tk-glow');
    state.accounts.push({ ...original, id: 'second-picker', name: 'Second Brand', handle: '@second.brand' });
    project.accountIds.push('second-picker');
    const films = state.films.filter((f: { projectId: string }) => f.projectId === 'P1').slice(0, 2);
    const template = state.tasks.find((t: { projectId: string }) => t.projectId === 'P1');
    films.forEach((f: { id: string; title: string }, i: number) => state.tasks.push({ ...template, id: `picker-task-${i}`, filmId: f.id, title: f.title, status: '待配置', accountId: '', demoPreview: false }));
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.goto('/#/projects/P1?section=publish&tab=configure&task=picker-task-0&task=picker-task-1');
  await page.reload();
  const triggers = page.getByRole('button', { name: '选择发布帐号', exact: true });
  await triggers.nth(0).click();
  await page.getByRole('button', { name: '选择 @glowup.official', exact: true }).click();
  await triggers.nth(1).click();
  await page.getByRole('button', { name: '选择 @second.brand', exact: true }).click();
  await page.reload();
  await expect(triggers.nth(0)).toContainText('@glowup.official');
  await expect(triggers.nth(1)).toContainText('@second.brand');
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.accounts.find((a: { id: string }) => a.id === 'second-picker').status = '授权过期';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(triggers.nth(1)).toContainText('登录过期');
  await expect(page.getByText('登录过期，请立即登录授权后再发布。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '立即发布', exact: true }).click();
  await expect(page.getByText('请选择项目关联且授权有效的帐号', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const key = 'chuhai-studio-v1:demo';
    const state = JSON.parse(localStorage.getItem(key)!);
    const project = state.projects.find((p: { id: string }) => p.id === 'P1');
    project.accountIds = project.accountIds.filter((id: string) => id !== 'second-picker');
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(triggers.nth(1)).toContainText('@second.brand');
  await expect(triggers.nth(1)).toContainText('不可用');
});
