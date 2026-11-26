import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { currentUser } from '@/services/identity';
import {
  createRechargeOrder,
  creditsBalance,
  rechargeOrders,
  refreshRechargeAccount,
} from '@/services/credits';
import { completePurchase } from '@/services/purchasedAccounts';
import { purchaseHistory } from '@/services/purchaseHistory';
import { studio } from '@/services/studio';
async function login(id: string) {
  currentUser.value = { id, name: id, identity: `${id}@test.com`, method: 'email', bindings: ['email'] };
  await nextTick();
}
beforeEach(async () => {
  vi.restoreAllMocks();
  currentUser.value = null;
  await nextTick();
  localStorage.clear();
  await login('history-buyer');
});
const key = 'chuhai-credits-v1:history-buyer';
test('new pending and paid orders expose snapshots and actual delivery', async () => {
  const pending = createRechargeOrder('p500');
  expect(purchaseHistory.value[0]).toMatchObject({
    id: pending.id,
    amount: 500,
    credits: 933,
    accountCount: 2,
    statusLabel: '待支付',
    paymentLabel: '尚未支付',
    accountStatus: '付款后到账',
  });
  expect(creditsBalance.value).toBe(100);
  completePurchase(pending.id, 'wechat');
  await nextTick();
  expect(purchaseHistory.value[0]).toMatchObject({
    statusLabel: '已到账',
    paymentLabel: '微信支付',
    accountStatus: '已添加至账号管理',
  });
  studio.value.accounts[0]!.deleted = true;
  expect(purchaseHistory.value[0]!.statusLabel).toBe('已到账');
});
test('credits-only bundle keeps version name and never describes account delivery', () => {
  const order = createRechargeOrder('p2000', { includeAccounts: false });
  completePurchase(order.id, 'alipay');
  expect(purchaseHistory.value[0]).toMatchObject({
    name: '高级版套餐',
    credits: 4545,
    accountCount: 0,
    accountStatus: '',
    statusLabel: '已到账',
  });
});
test('history retains original price and quotas and shows partial manual claims', () => {
  localStorage.setItem(
    key,
    JSON.stringify({
      balance: 42,
      total: 2020,
      orders: [
        {
          id: 'old',
          userId: 'history-buyer',
          pack: 'p490',
          amount: 490,
          credits: 1920,
          accountCount: 2,
          status: 'completed',
          channel: 'alipay',
          createdAt: '2025-01-01T00:00:00Z',
        },
      ],
      claims: [{ id: 'claim', userId: 'history-buyer', accounts: [{ orderId: 'old', countryCode: 'JP' }] }],
    }),
  );
  refreshRechargeAccount();
  expect(purchaseHistory.value[0]).toMatchObject({
    name: '基础版（历史套餐）',
    amount: 490,
    credits: 1920,
    accountCount: 2,
    accountStatus: '历史待领取 1 个',
  });
  expect(creditsBalance.value).toBe(42);
});
test('paid account sync is not reported as delivered before workspace recovery', () => {
  const snapshot = {
    id: 'sync',
    userId: 'history-buyer',
    pack: 'p500',
    amount: 500,
    credits: 933,
    accountCount: 2,
    deliveryMode: 'automatic',
    status: 'completed',
    channel: 'alipay',
    createdAt: '2026-01-01T00:00:00Z',
  };
  localStorage.setItem(key, JSON.stringify({ balance: 1033, total: 1033, orders: [snapshot], claims: [] }));
  refreshRechargeAccount();
  expect(purchaseHistory.value[0]).toMatchObject({
    pendingSync: true,
    statusLabel: '已支付',
    accountStatus: '待同步至账号管理',
  });
});
test('refresh reloads local records without writes, recalculation, payment or mutation of source ordering', () => {
  createRechargeOrder('credit500');
  const value = JSON.parse(localStorage.getItem(key)!);
  value.orders[0].createdAt = '2025-01-01T00:00:00Z';
  value.orders.push({ ...value.orders[0], id: 'newer', createdAt: '2026-01-01T00:00:00Z' });
  localStorage.setItem(key, JSON.stringify(value));
  const writes = vi.spyOn(Storage.prototype, 'setItem');
  refreshRechargeAccount();
  expect(purchaseHistory.value.map((item) => item.id)[0]).toBe('newer');
  expect(rechargeOrders.value[0]!.id).not.toBe('newer');
  expect(creditsBalance.value).toBe(100);
  expect(rechargeOrders.value.every((order) => order.status === 'pending')).toBe(true);
  expect(writes).not.toHaveBeenCalled();
});
test('corrupt or inaccessible refresh preserves previously loaded records and balance', () => {
  const order = createRechargeOrder('credit500');
  localStorage.setItem(key, '{');
  expect(() => refreshRechargeAccount()).toThrow('订单读取失败');
  expect(purchaseHistory.value[0]!.id).toBe(order.id);
  expect(creditsBalance.value).toBe(100);
  localStorage.setItem(key, JSON.stringify({ balance: 0, total: 0, orders: [null] }));
  expect(() => refreshRechargeAccount()).toThrow('订单读取失败');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(() => refreshRechargeAccount()).toThrow('订单读取失败');
  expect(purchaseHistory.value[0]!.id).toBe(order.id);
});
test('history stays isolated when switching users', async () => {
  const order = createRechargeOrder('p500');
  await login('other');
  expect(purchaseHistory.value).toHaveLength(0);
  await login('history-buyer');
  expect(purchaseHistory.value[0]!.id).toBe(order.id);
});
