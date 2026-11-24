import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import TKAccounts from '@/pages/TKAccounts.vue';
import { identityService } from '@/services/identity';
import { studio } from '@/services/studio';

let wrapper: VueWrapper | undefined;
beforeEach(() => {
  localStorage.clear();
  identityService.demo();
});
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
async function open(path = '/accounts') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/accounts', component: TKAccounts }],
  });
  await router.push(path);
  await router.isReady();
  wrapper = mount(TKAccounts, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { AccountAuthorization: true } },
  });
  await flushPromises();
  return { page: wrapper, router };
}

test('平台统计不随组合筛选变化，URL 更新与返回恢复筛选', async () => {
  const { page, router } = await open('/accounts?platform=tiktok');
  const stats = page.get('[aria-label="账号统计"]').text();
  expect(page.findAll('tbody tr')).toHaveLength(2);
  await page.get('[aria-label="授权状态筛选"]').setValue('已授权');
  await flushPromises();
  expect(page.findAll('tbody tr')).toHaveLength(1);
  expect(router.currentRoute.value.query.status).toBe('已授权');
  expect(page.get('[aria-label="账号统计"]').text()).toBe(stats);
  await page.get('[aria-label="搜索帐号"]').setValue('no-match');
  await flushPromises();
  expect(page.findAll('tbody tr')).toHaveLength(0);
  expect(page.text()).toContain('暂无符合筛选条件');
  expect(page.get('[aria-label="账号统计"]').text()).toBe(stats);
  await router.push('/accounts?platform=youtube');
  await flushPromises();
  expect(page.findAll('tbody tr')).toHaveLength(1);
  expect(page.text()).toContain('暂不支持发布');
  expect(page.find('[aria-label="待领取帐号提示"]').exists()).toBe(false);
});

test('旧分组链接打开弹窗，保存失败不新增，关闭保留筛选', async () => {
  const { page, router } = await open('/accounts?platform=tiktok&group=group-brand&tab=groups');
  const dialog = new DOMWrapper(document.querySelector('[role="dialog"]')!);
  expect(dialog.text()).toContain('管理分组');
  await dialog.get('[aria-label="分组名称"]').setValue('团队');
  const button = dialog.findAll('button').find((button) => button.text() === '新建分组')!;
  const count = studio.value.groups.length;
  const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  await button.trigger('click');
  await flushPromises();
  expect(dialog.get('[role="alert"]').text()).toContain('保存失败');
  expect(studio.value.groups).toHaveLength(count);
  storage.mockRestore();
  await button.trigger('click');
  await flushPromises();
  expect(studio.value.groups).toHaveLength(count + 1);
  await dialog.get('button[aria-label="关闭"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query.platform).toBe('tiktok');
  expect(router.currentRoute.value.query.group).toBe('group-brand');
  expect(router.currentRoute.value.query.tab).toBeUndefined();
  expect(page.get('[aria-label="帐号分组筛选"]').element).toHaveProperty('value', 'group-brand');
});
