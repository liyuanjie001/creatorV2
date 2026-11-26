import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { currentUser, identityService } from '@/services/identity';
import { ACCESS_STORAGE_KEY } from '@/lib/access';
import { accountCoupons } from '@/services/credits';
import { studio } from '@/services/studio';

let wrapper: VueWrapper | undefined;
beforeEach(() => {
  currentUser.value = null;
  localStorage.clear();
  localStorage.setItem(ACCESS_STORAGE_KEY, __ACCESS_PASSWORD_HASH__);
  identityService.demo();
});
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = ''; });
async function settle() { await vi.dynamicImportSettled(); await flushPromises(); }
async function clickText(text: string) {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent?.trim() === text);
  if (!button) throw new Error(`未找到按钮：${text}`);
  button.click();
  await settle();
}

test('真实页面从套餐付款到待到账，再模拟到账并同步购买记录', async () => {
  const router = createAppRouter(createMemoryHistory());
  await router.push('/purchase');
  await router.isReady();
  wrapper = mount(App, { attachTo: document.body, global: { plugins: [router] } });
  await settle();
  const card = wrapper.get('[aria-label="基础版套餐"]');
  expect(card.get('[aria-label="应付总价"]').text()).toBe('¥584');
  expect(card.find('[aria-label="增加账号使用权"]').exists()).toBe(false);
  const buy = card.findAll('button').find(button => button.text() === '购买套餐')!;
  await buy.trigger('click');
  await settle();
  expect(document.body.textContent).toContain('赠送账号抵扣券 1 张（可兑换 2 个账号）');
  await clickText('模拟支付成功');
  expect(document.body.textContent).toContain('已到账 961 积分');
  expect(document.body.textContent).toContain('已自动兑换 2 个账号');
  const orderId = accountCoupons.value[0]!.orderId;
  expect(studio.value.accounts.filter(item => item.orderId === orderId)).toHaveLength(0);
  await clickText('查看到账进度');
  expect(router.currentRoute.value.path).toBe('/accounts');
  expect(wrapper.get('[aria-label="套餐账号到账进度"]').text()).toContain('待到账');
  await clickText('模拟账号到账');
  expect(studio.value.accounts.filter(item => item.orderId === orderId)).toHaveLength(2);
  expect(wrapper.get('[aria-label="套餐账号到账进度"]').text()).toContain('已添加至账号管理');
  expect(wrapper.findAll('button').some(button => button.text() === '模拟账号到账')).toBe(false);
  await router.push('/me');
  await settle();
  const history = wrapper.get('[aria-label="购买记录"]');
  expect(history.text()).toContain('赠送账号抵扣券 1 张');
  expect(history.text()).toContain('已添加至账号管理');
  expect(history.text()).not.toContain('待到账');
});
