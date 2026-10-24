import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { useWindowManager, WINDOW_STORAGE_KEY } from '@/composables/useWindowManager';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { useInspirationDialog } from '@/composables/useInspirationDialog';
import { loadIdeaNotes, NOTES_KEY } from '@/composables/useIdeaNotes';
import { resetHomeProjects } from '@/composables/useHomeProjects';

let wrapper: VueWrapper | undefined;
let warnings: string[] = [];

beforeEach(() => {
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  localStorage.removeItem(WINDOW_STORAGE_KEY);
  localStorage.removeItem('chuhai-home-projects');
  localStorage.removeItem('chuhai-hide-home-hot-videos');
  resetHomeProjects();
  useWindowManager().reload();
  warnings = [];
  vi.useFakeTimers();
});
afterEach(async () => {
  useInspirationDialog().inspireOpen.value = false;
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  await flushPromises();
  vi.useRealTimers();
  expect(warnings).toEqual([]);
});

async function open(path: string) {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router],
      config: {
        warnHandler: (message) => {
          warnings.push(message);
        },
      },
    },
  });
  await flushPromises();
  return { router, app: wrapper };
}

function button(text: string | RegExp, root = wrapper) {
  const found = root
    ?.findAll('button')
    .find((item) =>
      typeof text === 'string'
        ? item.text().replace(/\s+/g, '') === text.replace(/\s+/g, '')
        : text.test(item.text()),
    );
  if (!found) throw new Error(`Button not found: ${text}`);
  return found;
}

describe('全部路由挂载真实 Vue 组件', () => {
  const paths = [
    ['/', '还没有项目'],
    ['/inspiration', '创意中心'],
    ['/notes', '妙记'],
    ['/create', '让你的品牌故事鲜活起来'],
    ['/accounts', '窗口管理'],
    ['/analytics', '数据分析'],
    ['/tasks', '任务管理'],
    ['/tasks/new', '新建任务'],
    ['/projects', '全部项目'],
    ['/projects/new', '品牌'],
    ['/projects/P1', 'GlowUp 美妆出海'],
    ['/assets', '素材'],
    ['/settings', '设置中心'],
    ['/trash', '回收站'],
    ['/me', '个人中心'],
  ];
  test.each(paths)('%s', async (path, title) => {
    const { app } = await open(path);
    expect(app.text()).toContain(title);
  });
});

test('查询参数切换与旧地址重定向', async () => {
  const { router, app } = await open('/trends');
  expect(router.currentRoute.value.path).toBe('/trends');
  expect(app.text()).toContain('全球 · 实时热搜榜');
  await router.push('/notes');
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/notes');
  expect(app.text()).toContain('便携咖啡机 · 露营场景宣发');
  await router.push('/settings?tab=security');
  await flushPromises();
  expect(app.text()).toContain('两步验证已开启');
});

test('创作控制台生成结果出现在我的创作', async () => {
  const { app } = await open('/create');
  await app.find('textarea').setValue('便携咖啡机露营场景');
  await button('生成 消耗 20 积分').trigger('click');
  await app.find('button[title="批量生成"]').trigger('click');
  await vi.advanceTimersByTimeAsync(1900);
  await flushPromises();
  expect(app.text()).toContain('3 秒开箱：把期待感拉满的悬念开头');
  expect(app.text()).not.toContain('Before / After 对比图文');
});

test('商品切换重置表单，跨项目导航隔离状态', async () => {
  const { app, router } = await open('/projects/P1');
  const productNav = app.findAll('aside button').find((item) => item.text().startsWith('产品卡'));
  if (!productNav) throw new Error('产品卡导航不存在');
  await productNav.trigger('click');
  await flushPromises();
  expect(app.find('input').element.value).toBeDefined();
  const names = app.findAll('input').map((item) => item.element.value);
  expect(names).toContain('烟酰胺焕肤精华 30ml');
  await button(/透明质酸保湿面霜/).trigger('click');
  expect(app.findAll('input').map((item) => item.element.value)).toContain('透明质酸保湿面霜');
  await router.push('/projects/P2');
  await flushPromises();
  expect(app.text()).toContain('TechNova 北美');
  expect(app.text()).not.toContain('透明质酸保湿面霜');
});

test('项目详情 13 个栏目使用真实面板', async () => {
  const { app } = await open('/projects/P1');
  const expected = [
    ['产品卡', '烟酰胺焕肤精华'],
    ['灵感库', '翻拍'],
    ['账号管理', '当前项目尚未同步窗口'],
    ['发布管理', '发布'],
    ['数据归因', '曝光'],
    ['任务调度', '调度'],
    ['自由创作', '生成'],
  ];
  for (const [label, content] of expected) {
    const nav = app.findAll('aside button').find((item) => item.text().startsWith(label));
    if (!nav) throw new Error(`项目导航不存在: ${label}`);
    await nav.trigger('click');
    await flushPromises();
    expect(app.text()).toContain(content);
  }
});

test('创作台点击素材库和产品卡打开选择面板', async () => {
  const { app } = await open('/projects/P1');
  await app.find('button[title="从素材库选择"]').trigger('click');
  await flushPromises();
  expect(document.body.textContent).toContain('本地上传');
  expect(document.body.textContent).toContain('素材库上传');
  expect(document.body.textContent).toContain('全部素材');
  expect(document.body.textContent).not.toMatch(/没有匹配的素材[\s\S]*选择产品卡/);
  expect(document.body.textContent).toMatch(/GlowUp_精华实测|精华质地特写|ins风_开箱/);
  await app.find('button[title="引用产品卡"]').trigger('click');
  await flushPromises();
  expect(document.body.textContent).toContain('选择产品卡');
  expect(document.body.textContent).toContain('烟酰胺焕肤精华');
});

test('项目灵感库按源码展示推荐爆款与翻拍操作', async () => {
  const { app } = await open('/projects/P1');
  const nav = app.findAll('aside button').find((item) => item.text().startsWith('灵感库'));
  if (!nav) throw new Error('灵感库导航不存在');
  await nav.trigger('click');
  await flushPromises();
  expect(app.text()).toContain('推荐近期爆款');
  expect(app.text()).toContain('的商品「');
  expect(app.text()).toContain('一键翻拍');
  expect(app.text()).toContain('播放');
  expect(app.find('button[title="收藏"]').exists()).toBe(true);
  expect(app.find('input[placeholder="搜索灵感关键词、话题、作者…"]').exists()).toBe(true);

  const remake = app.findAll('button').find((item) => item.text() === '一键翻拍');
  if (!remake) throw new Error('一键翻拍按钮不存在');
  await remake.trigger('click');
  await flushPromises();
  expect(app.text()).toContain('自由创作');
  expect(app.find('button[title="移除参考视频"]').exists()).toBe(true);
  expect(app.text()).toContain('ASMR 开箱');
  const textarea = app.find('textarea');
  expect(textarea.exists()).toBe(true);
  expect((textarea.element as HTMLTextAreaElement).value).toContain('完全复刻原视频脚本和画面');
});

test('项目侧栏可切换到其他项目', async () => {
  const { app, router } = await open('/projects/P1');
  expect(app.text()).toContain('GlowUp 美妆出海');
  const trigger = app.find('button[aria-label="切换项目"]');
  expect(trigger.exists()).toBe(true);
  await trigger.trigger('click');
  await flushPromises();
  const option = Array.from(document.querySelectorAll('[role="menuitem"]')).find((item) =>
    item.textContent?.includes('TechNova 北美'),
  );
  if (!option) throw new Error('项目切换菜单未打开');
  (option as HTMLElement).click();
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/projects/P2');
  expect(app.text()).toContain('TechNova 北美');
});

test('灵感对话写入妙记并立即在现有页面显示', async () => {
  const { app } = await open('/notes');
  const before = loadIdeaNotes().length;
  await button('去聊一条').trigger('click');
  await flushPromises();
  const field = document.querySelector<HTMLInputElement>('[role="dialog"] input');
  if (!field) throw new Error('灵感对话输入框未打开');
  field.value = '便携咖啡机推给北美露营人群';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await vi.advanceTimersByTimeAsync(1500);
  await flushPromises();
  expect(loadIdeaNotes()).toHaveLength(before + 1);
  expect(JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]')).toHaveLength(before + 1);
  expect(app.text()).toContain('户外移动咖啡馆');
});

test('素材搜索、列表视图、选择及元素分类', async () => {
  const { app } = await open('/assets');
  const search = app.find('input[placeholder="搜索素材…"]');
  await search.setValue('耳机');
  expect(app.text()).not.toContain('没有符合条件的素材');
  await app.find('button[title="列表视图"]').trigger('click');
  expect(app.find('table').exists()).toBe(true);
  expect(app.find('tbody').text()).toContain('耳机');
  expect(app.find('tbody').text()).not.toContain('精华');
  await search.setValue('没有这个素材');
  expect(app.text()).toContain('没有符合条件的素材');
  await search.setValue('');
  await button(/^元素\d/).trigger('click');
  await button('地点').trigger('click');
  expect(app.text()).toContain('实验室场景');
  expect(app.text()).not.toContain('数字人艾米');
});

test('设置中的受控和默认开关都可以切换', async () => {
  const { app, router } = await open('/settings');
  const control = app.find('[role="switch"]');
  expect(control.attributes('aria-checked')).toBe('true');
  await control.trigger('click');
  expect(control.attributes('aria-checked')).toBe('false');
  await router.push('/settings?tab=security');
  await flushPromises();
  expect(app.find('[role="switch"]').attributes('aria-checked')).toBe('true');
});

test('灵感弹窗可用 Esc 关闭并恢复触发按钮焦点', async () => {
  await open('/notes');
  const trigger = button('去聊一条');
  trigger.element.focus();
  await trigger.trigger('click');
  await flushPromises();
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flushPromises();
  await vi.advanceTimersByTimeAsync(20);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(trigger.element);
});

test('离开灵感对话会取消尚未完成的生成', async () => {
  const { router } = await open('/notes');
  const before = loadIdeaNotes().length;
  await button('去聊一条').trigger('click');
  await flushPromises();
  const field = document.querySelector<HTMLInputElement>('[role="dialog"] input');
  if (!field) throw new Error('灵感输入框不存在');
  field.value = '一条不应在关闭后完成的生成';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flushPromises();
  await router.push('/accounts');
  await vi.advanceTimersByTimeAsync(2000);
  expect(loadIdeaNotes()).toHaveLength(before);
});

test('第一版创建校验项目名并进入工作区，返回首页展示项目卡', async () => {
  const { projects } = await import('@/data/mock');
  const { resetHomeProjects } = await import('@/composables/useHomeProjects');
  const snapshot = [...projects];
  try {
    resetHomeProjects();
    const { app, router } = await open('/');
    expect(app.text()).toContain('还没有项目');
    expect(app.text()).not.toContain('从模板新建');
    expect(app.text()).not.toContain('我参与的项目');
    await button('创建项目').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/projects/new');
    await router.push('/');
    await flushPromises();
    await button('第一版创建').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('填写项目名称即可进入工作区');
    const confirm = Array.from(document.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === '创建',
    );
    if (!confirm) throw new Error('创建按钮不存在');
    confirm.click();
    await flushPromises();
    expect(document.body.textContent).toContain('请填写项目名称');
    const field = document.querySelector<HTMLInputElement>('input[placeholder="例如 GlowUp 美妆出海"]');
    if (!field) throw new Error('项目名称输入框未打开');
    field.value = '北美春季档';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    confirm.click();
    await flushPromises();
    expect(router.currentRoute.value.path).toMatch(/^\/projects\/P-\d+$/);
    await router.push('/');
    await flushPromises();
    expect(app.text()).toContain('我的项目');
    expect(app.text()).toContain('北美春季档');
    expect(app.text()).not.toContain('还没有项目');
  } finally {
    resetHomeProjects();
    projects.splice(0, projects.length, ...snapshot);
  }
});

test('手动创建项目校验品牌名称并进入工作区', async () => {
  const { projects } = await import('@/data/mock');
  const { resetHomeProjects } = await import('@/composables/useHomeProjects');
  const snapshot = [...projects];
  try {
    resetHomeProjects();
    const { app, router } = await open('/projects/new');
    await button('手动创建品牌套件').trigger('click');
    await button('创建项目').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('请填写品牌名称');
    await app.find('input[placeholder="你的品牌名称"]').setValue('测试品牌');
    await button('创建项目').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toMatch(/^\/projects\/P-\d+$/);
    await router.push('/');
    await flushPromises();
    expect(app.text()).toContain('我的项目');
    expect(app.text()).toContain('测试品牌');
    expect(app.text()).not.toContain('还没有项目');
    expect(app.find('aside').text()).not.toContain('测试品牌');
  } finally {
    resetHomeProjects();
    projects.splice(0, projects.length, ...snapshot);
  }
});

test('离开首页再返回仍展示已创建的项目卡', async () => {
  const { projects } = await import('@/data/mock');
  const { addHomeProject, resetHomeProjects } = await import('@/composables/useHomeProjects');
  const snapshot = [...projects];
  try {
    resetHomeProjects();
    addHomeProject({ name: '回访项目卡' });
    const { app, router } = await open('/');
    expect(app.text()).toContain('我的项目');
    expect(app.text()).toContain('回访项目卡');
    await router.push('/assets');
    await flushPromises();
    await router.push('/');
    await flushPromises();
    expect(app.text()).toContain('我的项目');
    expect(app.text()).toContain('回访项目卡');
    expect(app.text()).not.toContain('还没有项目');
  } finally {
    resetHomeProjects();
    projects.splice(0, projects.length, ...snapshot);
  }
});

test('项目页底部展示爆款视频，可查看更多与隐藏推荐', async () => {
  const { app, router } = await open('/');
  expect(app.text()).toContain('爆款视频');
  expect(app.text()).toContain('隐藏推荐');
  expect(app.text()).toContain('查看更多');
  expect(app.text()).toContain('精华实测');
  await button('查看更多').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/inspiration');
  await router.push('/');
  await flushPromises();
  await button('隐藏推荐').trigger('click');
  await flushPromises();
  expect(app.text()).not.toContain('隐藏推荐');
  expect(app.text()).toContain('显示爆款推荐');
  expect(localStorage.getItem('chuhai-hide-home-hot-videos')).toBe('1');
});

test('项目卡支持重命名与删除，删空后回到缺省页', async () => {
  const { projects } = await import('@/data/mock');
  const { addHomeProject, renameHomeProject, removeHomeProject, resetHomeProjects } =
    await import('@/composables/useHomeProjects');
  const snapshot = [...projects];
  try {
    resetHomeProjects();
    const item = addHomeProject({ name: '待改名项目' });
    renameHomeProject(item.id, '已改名项目');
    const { app, router } = await open('/');
    expect(app.text()).toContain('已改名项目');
    expect(app.text()).not.toContain('待改名项目');
    removeHomeProject(item.id);
    await router.push('/assets');
    await flushPromises();
    await router.push('/');
    await flushPromises();
    expect(app.text()).toContain('还没有项目');
    expect(app.text()).not.toContain('已改名项目');
  } finally {
    resetHomeProjects();
    projects.splice(0, projects.length, ...snapshot);
  }
});
