import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { currentUser } from '@/services/identity';
import { completeRecharge, createRechargeOrder, creditsBalance, creditsTotal, rechargePacks, type RechargePackKey } from '@/services/credits';
async function login(id: string) {
  currentUser.value = { id, name: id, identity: `${id}@test.com`, method: 'email', bindings: ['email'] };
  await nextTick();
}
beforeEach(async () => {
  vi.restoreAllMocks(); localStorage.clear(); currentUser.value = null; await nextTick(); await login('one');
});
for (const pack of Object.keys(rechargePacks) as RechargePackKey[]) {
  test(`${pack} 按档位增加余额及总额度`, () => {
    const order = createRechargeOrder(pack);
    const result = completeRecharge(order.id, 'wechat');
    expect(result).toMatchObject({ status: 'completed', channel: 'wechat', amount: rechargePacks[pack].amount });
    expect(creditsBalance.value).toBe(100 + rechargePacks[pack].credits);
    expect(creditsTotal.value).toBe(creditsBalance.value);
  });
}
test('同一订单重复完成只入账一次', () => {
  const order = createRechargeOrder('p50');
  completeRecharge(order.id, 'alipay'); completeRecharge(order.id, 'alipay');
  expect(creditsBalance.value).toBe(200);
});
test('未完成订单不入账，重新充值创建独立订单', () => {
  const first = createRechargeOrder('p50'), second = createRechargeOrder('p50');
  expect(first.id).not.toBe(second.id); expect(creditsBalance.value).toBe(100);
});
test('用户余额隔离，重新载入恢复余额及订单幂等', async () => {
  const order = createRechargeOrder('p100'); completeRecharge(order.id, 'wechat');
  await login('two'); expect(creditsBalance.value).toBe(100);
  expect(() => completeRecharge(order.id, 'wechat')).toThrow('不存在');
  await login('one'); expect(creditsBalance.value).toBe(600);
  completeRecharge(order.id, 'wechat'); expect(creditsBalance.value).toBe(600);
});
test('存储失败不增加余额且可以重试', () => {
  const order = createRechargeOrder('p50');
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => completeRecharge(order.id, 'alipay')).toThrow('本地保存失败');
  expect(creditsBalance.value).toBe(100);
  spy.mockRestore(); completeRecharge(order.id, 'alipay'); expect(creditsBalance.value).toBe(200);
});
test('创建失败不产生可支付订单', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => createRechargeOrder('p50')).toThrow('本地保存失败'); expect(creditsBalance.value).toBe(100);
});
