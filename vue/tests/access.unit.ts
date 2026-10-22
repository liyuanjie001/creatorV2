import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { ACCESS_STORAGE_KEY, createAccessGate } from '@/lib/access';

let wrapper: VueWrapper | undefined;
beforeEach(() => localStorage.clear());
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

async function open(path: string) {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, { attachTo: document.body, global: { plugins: [router] } });
  await flushPromises();
  return { router, app: wrapper };
}

test.each(['/', '/projects/P1', '/assets', '/settings?tab=team', '/trends', '/unknown'])(
  '未解锁时保护 %s',
  async (path) => {
    const { router, app } = await open(path);
    expect(router.currentRoute.value.name).toBe('unlock');
    expect(app.text()).toContain('输入访问密码');
    expect(app.find('aside').exists()).toBe(false);
    expect(app.text()).not.toContain('GlowUp');
    expect(localStorage.getItem(ACCESS_STORAGE_KEY)).toBeNull();
  },
);

test('密码错误不放行，正确后记住权限并返回原来的查询地址', async () => {
  const { router, app } = await open('/settings?tab=team');
  expect(router.currentRoute.value.query.redirect).toBe('/settings?tab=team');
  expect(app.get('button[type="submit"]').attributes('type')).toBe('submit');
  await app.get('input').setValue('wrong-password');
  await app.get('form').trigger('submit');
  await vi.waitFor(() => expect(app.text()).toContain('密码不正确'));
  expect(router.currentRoute.value.name).toBe('unlock');
  expect(localStorage.getItem(ACCESS_STORAGE_KEY)).toBeNull();

  await app.get('input').setValue('test-password');
  expect(app.find('[role="alert"]').exists()).toBe(false);
  await app.get('form').trigger('submit');
  await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/settings?tab=team'));
  await flushPromises();
  expect(app.text()).toContain('团队成员');
  expect(localStorage.getItem(ACCESS_STORAGE_KEY)).toBe(__ACCESS_PASSWORD_HASH__);
  expect(localStorage.getItem(ACCESS_STORAGE_KEY)).not.toBe('test-password');
});

test('新的路由实例从 localStorage 恢复权限，无需再次输入', async () => {
  const initialGate = createAccessGate();
  expect(await initialGate.unlock('test-password')).toBe(true);
  const router = createAppRouter(createMemoryHistory(), createAccessGate());
  await router.push('/projects/P2');
  await router.isReady();
  expect(router.currentRoute.value.fullPath).toBe('/projects/P2');
});

test.each(['true', 'unlocked', '{broken', 'outdated-token'])('无效的本地记录不能放行: %s', async (token) => {
  localStorage.setItem(ACCESS_STORAGE_KEY, token);
  const { router } = await open('/analytics');
  expect(router.currentRoute.value.name).toBe('unlock');
});

test('更换密码后旧记录失效', async () => {
  expect(await createAccessGate().unlock('test-password')).toBe(true);
  const newHash = createHash('sha256').update('new-password').digest('hex');
  const gate = createAccessGate(newHash);
  expect(gate.isUnlocked()).toBe(false);
  expect(await gate.unlock('test-password')).toBe(false);
  expect(await gate.unlock('new-password')).toBe(true);
  expect(createAccessGate(newHash).isUnlocked()).toBe(true);
});

test('缺少密码配置时保持锁定', async () => {
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  const gate = createAccessGate('');
  expect(gate.isConfigured).toBe(false);
  expect(gate.isUnlocked()).toBe(false);
  expect(await gate.unlock('test-password')).toBe(false);
});

test('存储不可用时支持当前会话，但新会话仍需输入密码', async () => {
  const storage = {
    getItem(): string | null {
      throw new Error('Storage disabled');
    },
    setItem() {
      throw new Error('Storage disabled');
    },
  };
  const gate = createAccessGate(__ACCESS_PASSWORD_HASH__, storage);
  expect(gate.isUnlocked()).toBe(false);
  expect(await gate.unlock('test-password')).toBe(true);
  expect(gate.isUnlocked()).toBe(true);
  expect(createAccessGate(__ACCESS_PASSWORD_HASH__, storage).isUnlocked()).toBe(false);
});

test.each([
  'https://example.com',
  '//example.com',
  '/unlock?redirect=/unlock',
  '/unlock/',
  '/UNLOCK',
  '/UNLOCK/',
])('已解锁访问入口时拒绝循环或站外跳转: %s', async (redirect) => {
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  const { router } = await open(`/unlock?redirect=${encodeURIComponent(redirect)}`);
  expect(router.currentRoute.value.path).toBe('/');
});
