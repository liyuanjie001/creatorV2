import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { currentUser } from '@/services/identity';
import { accountCoupons, completeRecharge, createRechargeOrder, createSubscriptionOrder, creditsBalance, rechargeAccountClaims, refreshRechargeAccount, socialAccountsRemaining } from '@/services/credits';
import { simulateCouponDelivery } from '@/services/purchasedAccounts';
import { purchaseHistory } from '@/services/purchaseHistory';
import { notifications } from '@/services/notifications';
import { studio } from '@/services/studio';
import { accountDeliveryDeadline } from '@/services/businessDays';

const options = { edition: 'personal', period: 'quarter', accountCount: 2, seats: 0 } as const;
beforeEach(async () => {
  vi.restoreAllMocks();
  currentUser.value = null;
  await nextTick();
  localStorage.clear();
  currentUser.value = { id: 'coupon-owner', name: 'Buyer', identity: 'buyer@example.com', method: 'email', bindings: ['email'] };
  await nextTick();
});
afterEach(() => { vi.restoreAllMocks(); currentUser.value = null; });

test('支付发放一张已自动兑换的券，未交付账号不能被领取或用于发布', async () => {
  const order = createSubscriptionOrder('p500', options);
  expect(accountCoupons.value).toHaveLength(0);
  completeRecharge(order.id, 'alipay');
  await nextTick();
  expect(creditsBalance.value).toBe(1061);
  expect(accountCoupons.value).toHaveLength(1);
  expect(accountCoupons.value[0]).toMatchObject({ orderId: order.id, accountCount: 2, status: 'redeemed', redemption: { status: 'pending', accountIds: [] } });
  expect(rechargeAccountClaims.value).toHaveLength(0);
  expect(studio.value.accounts).toHaveLength(0);
  expect(socialAccountsRemaining.value).toBe(0);
  expect(purchaseHistory.value[0]?.statusLabel).toBe('待到账');
  expect(notifications.value.some(item => item.title === '账号抵扣券已自动兑换')).toBe(true);
  expect(notifications.value.some(item => item.title === '账号已到账')).toBe(false);
  completeRecharge(order.id, 'wechat');
  refreshRechargeAccount();
  expect(accountCoupons.value).toHaveLength(1);
  simulateCouponDelivery(accountCoupons.value[0]!.id);
  await nextTick();
  expect(studio.value.accounts).toHaveLength(2);
  expect(purchaseHistory.value[0]?.statusLabel).toBe('已到账');
  expect(notifications.value.filter(item => item.title === '账号已到账')).toHaveLength(1);
  const ids = studio.value.accounts.map(item => item.id);
  simulateCouponDelivery(accountCoupons.value[0]!.id);
  expect(studio.value.accounts.map(item => item.id)).toEqual(ids);
  expect(rechargeAccountClaims.value).toHaveLength(1);
  expect(creditsBalance.value).toBe(1061);
  studio.value.accounts[0]!.deleted = true;
  simulateCouponDelivery(accountCoupons.value[0]!.id);
  expect(studio.value.accounts[0]!.deleted).toBe(true);
});

test('发券保存失败不扣改积分，交付同步失败可重试且不会重复生成账号', () => {
  const order = createSubscriptionOrder('p1000', options);
  const original = Storage.prototype.setItem;
  const blockLedger = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-credits-v1:coupon-owner') throw new Error('blocked');
    original.call(this, key, value);
  });
  expect(() => completeRecharge(order.id, 'alipay')).toThrow();
  expect(creditsBalance.value).toBe(100);
  expect(accountCoupons.value).toHaveLength(0);
  blockLedger.mockRestore();
  completeRecharge(order.id, 'alipay');
  const coupon = accountCoupons.value[0]!;
  const blockWorkspace = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-studio-v1:coupon-owner') throw new Error('blocked');
    original.call(this, key, value);
  });
  expect(() => simulateCouponDelivery(coupon.id)).toThrow('账号同步失败');
  expect(studio.value.accounts).toHaveLength(0);
  expect(purchaseHistory.value[0]?.statusLabel).toBe('待到账');
  expect(rechargeAccountClaims.value[0]?.accounts).toHaveLength(5);
  blockWorkspace.mockRestore();
  simulateCouponDelivery(coupon.id);
  expect(studio.value.accounts).toHaveLength(5);
  expect(rechargeAccountClaims.value).toHaveLength(1);
});

test('续购另发一张券，不改历史待支付订单交付方式，切换用户隔离', async () => {
  const old = createRechargeOrder('p500');
  completeRecharge(old.id, 'alipay');
  expect(rechargeAccountClaims.value).toHaveLength(1);
  expect(accountCoupons.value).toHaveLength(0);
  for (let i = 0; i < 2; i++) completeRecharge(createSubscriptionOrder('p500', options).id, 'alipay');
  expect(accountCoupons.value).toHaveLength(2);
  expect(new Set(accountCoupons.value.map(item => item.orderId)).size).toBe(2);
  currentUser.value = { id: 'other-buyer', name: 'Other', identity: 'other@example.com', method: 'email', bindings: ['email'] };
  await nextTick();
  expect(accountCoupons.value).toHaveLength(0);
  expect(() => simulateCouponDelivery(`coupon:${old.id}`)).toThrow('不存在');
});

test.each([
  ['2026-11-25T04:00:00Z', '2026-11-30T15:59:59.999Z'],
  ['2026-09-30T04:00:00Z', '2026-10-10T15:59:59.999Z'],
  ['2026-02-13T04:00:00Z', '2026-02-25T15:59:59.999Z'],
  ['2026-12-31T04:00:00Z', '2027-01-06T15:59:59.999Z'],
  ['2027-02-04T04:00:00Z', '2027-02-16T15:59:59.999Z'],
])('中国法定工作日计算 %s 的三个工作日截止时间', (paidAt, expected) => {
  expect(accountDeliveryDeadline(paidAt)).toBe(expected);
});
test('缺失年度日历及无效时间不猜测到账日期', () => {
  expect(accountDeliveryDeadline('2027-12-31T04:00:00Z')).toBeUndefined();
  expect(accountDeliveryDeadline('invalid')).toBeUndefined();
  expect(accountDeliveryDeadline('2026-11-25T04:00:00Z', {})).toBeUndefined();
});
