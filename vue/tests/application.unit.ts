import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { useWindowManager, WINDOW_STORAGE_KEY } from '@/composables/useWindowManager';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { useInspirationDialog } from '@/composables/useInspirationDialog';
import { loadIdeaNotes, NOTES_KEY } from '@/composables/useIdeaNotes';

let wrapper: VueWrapper | undefined;
let warnings: string[] = [];

beforeEach(() => {
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  localStorage.removeItem(WINDOW_STORAGE_KEY);
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
    ['/', '工作台'],
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
    ['/me', '我的'],
  ];
  test.each(paths)('%s', async (path, title) => {
    const { app } = await open(path);
    expect(app.text()).toContain(title);
  });
});

test('查询参数切换与旧地址重定向', async () => {
  const { router, app } = await open('/trends');
  expect(router.currentRoute.value.fullPath).toBe('/inspiration?tab=trends');
  expect(app.text()).toContain('全球 · 实时热搜榜');
  await button('妙记').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query.tab).toBe('notes');
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
  const productNav = app.findAll('aside button').find((item) => item.text().startsWith('商品'));
  if (!productNav) throw new Error('商品导航不存在');
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
    ['项目简报', '分日互动表现'],
    ['商品', '烟酰胺焕肤精华'],
    ['灵感库', '翻拍'],
    ['元素', '数字人艾米'],
    ['Canvas', '新建画板'],
    ['AI 聊天', '帮我排一下'],
    ['AI 导演', '分镜'],
    ['窗口管理', '当前项目尚未同步窗口'],
    ['发布管理', '发布'],
    ['数据归因', '曝光'],
    ['任务调度', '调度'],
    ['回收站', '恢复'],
    ['全部生成', '生成'],
  ];
  for (const [label, content] of expected) {
    const nav = app.findAll('aside button').find((item) => item.text().startsWith(label));
    if (!nav) throw new Error(`项目导航不存在: ${label}`);
    await nav.trigger('click');
    await flushPromises();
    expect(app.text()).toContain(content);
  }
});

test('批量生成校验平台并将结果加入生成墙', async () => {
  const { app } = await open('/projects/P1');
  await button(/^批量生成/).trigger('click');
  await flushPromises();
  const start = Array.from(document.querySelectorAll('button')).find((item) =>
    item.textContent?.includes('开始批量生成'),
  );
  if (!start) throw new Error('批量生成弹窗未打开');
  for (const selected of document.querySelectorAll<HTMLButtonElement>(
    '[role="dialog"] button[aria-pressed="true"]',
  ))
    selected.click();
  await flushPromises();
  start.click();
  await flushPromises();
  expect(document.body.textContent).toContain('至少选择一个平台');
  const platform = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
    (item) => item.textContent?.trim() === 'TikTok',
  );
  if (!platform) throw new Error('发布平台选项不存在');
  platform.click();
  await flushPromises();
  start.click();
  await vi.advanceTimersByTimeAsync(4500);
  await flushPromises();
  expect(document.body.textContent).toContain('批量生成完成');
  expect(app.text()).toContain('烟酰胺焕肤精华 30ml · 种草短片 #1');
});

test('灵感对话写入妙记并立即在现有页面显示', async () => {
  const { app } = await open('/inspiration?tab=notes');
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

test('顶栏弹窗可用 Esc 关闭并恢复触发按钮焦点', async () => {
  await open('/');
  const trigger = button('AI 灵感生成');
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
  const { router } = await open('/');
  const before = loadIdeaNotes().length;
  await button('AI 灵感生成').trigger('click');
  await flushPromises();
  const field = document.querySelector<HTMLInputElement>('[role="dialog"] input');
  if (!field) throw new Error('灵感输入框不存在');
  field.value = '一条不应在关闭后完成的生成';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flushPromises();
  await router.push('/tasks');
  await vi.advanceTimersByTimeAsync(2000);
  expect(loadIdeaNotes()).toHaveLength(before);
});

test('手动创建项目校验品牌名称并保持演示导航', async () => {
  const { app, router } = await open('/projects/new');
  await button('手动创建品牌套件').trigger('click');
  await button('创建项目').trigger('click');
  await flushPromises();
  expect(document.body.textContent).toContain('请填写品牌名称');
  await app.find('input[placeholder="你的品牌名称"]').setValue('测试品牌');
  await button('创建项目').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.path).toBe('/');
  expect(app.find('aside').text()).not.toContain('测试品牌');
});
