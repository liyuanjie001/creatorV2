import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { currentUser } from '@/services/identity';
import {
  completeRecharge,
  createRechargeOrder,
  createSubscriptionOrder,
  creditsBalance,
  currentPackageKey,
  currentSubscription,
  getSubscriptionQuote,
  getCouponSubscriptionQuote,
  getSubscriptionDiscount,
  getPurchaseQuote,
  rechargeAccountClaims,
  accountCoupons,
  rechargePacks,
  refreshRechargeAccount,
  subscriptionStatus,
  subscriptionSeatLabel,
  type SubscriptionOptions,
  type RechargePackKey,
} from '@/services/credits';

const personal = { edition: 'personal', period: 'quarter', accountCount: 2, seats: 0 } as const;
const team = { ...personal, edition: 'team', seats: 2 } as const;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2027-01-30T17:30:00Z')); // January 31 in Shanghai.
  localStorage.clear();
  currentUser.value = { id: 'subscriber', name: 'Subscriber', identity: 'subscriber@test.com', method: 'email', bindings: ['email'] };
});

afterEach(() => {
  currentUser.value = null;
  vi.useRealTimers();
});

test.each([
  ['p500', 961, 87],
  ['p1000', 2272, 206],
  ['p2000', 5000, 454],
  ['p5000', 12820, 1165],
] as const)('%s 历史报价额度与参考表一致，个人版订单保持原积分', (tier, credits, videos) => {
  for (const edition of ['personal', 'team'] as const) {
    for (const period of ['quarter', 'year'] as const) {
      for (const accountCount of [0, 100]) {
        const options = { edition, period, accountCount, seats: edition === 'team' ? 100 : 0 };
        const expected = credits * (period === 'year' ? 4 : 1);
        expect(getSubscriptionQuote(tier, options).credits).toBe(expected);
        if (edition === 'team') continue;
        const order = createSubscriptionOrder(tier, options);
        expect(order.credits).toBe(expected);
        const before = creditsBalance.value;
        expect(completeRecharge(order.id, 'alipay').credits).toBe(expected);
        expect(creditsBalance.value).toBe(before + expected);
        completeRecharge(order.id, 'wechat');
        expect(creditsBalance.value).toBe(before + expected);
      }
    }
  }
  expect(Math.floor(credits / 11)).toBe(videos);
});

test.each([
  ['p500', 42, 500, 60],
  ['p1000', 40, 1000, 50],
  ['p2000', 36, 2000, 45],
  ['p5000', 30, 5000, 40],
] as const)('%s 个人版固定赠券并保持原套餐总价', (tier, unitPrice, base, seatPrice) => {
  for (const edition of ['personal'] as const) {
    for (const period of ['quarter', 'year'] as const) {
      const multiplier = period === 'year' ? 4 : 1;
      for (const seats of [0]) {
        for (const accountCount of [0, 1, 2, 5, 100]) {
          const order = createSubscriptionOrder(tier, { edition, period, accountCount, seats });
          const giftCount = rechargePacks[tier].accountCount;
          expect(order.subscription).toMatchObject({
            baseAmount: base * multiplier + unitPrice * giftCount,
            accountAmount: 0,
            seatAmount: seats * seatPrice * multiplier,
          });
          expect(order.accountCount).toBe(giftCount);
          expect(order.amount).toBe(base * multiplier + unitPrice * giftCount + seats * seatPrice * multiplier);
        }
      }
    }
  }
});

test.each([
  ['p1000', 700, 1590, 5],
  ['p2000', 1000, 2500, 10],
  ['p5000', 2500, 6410, 30],
] as const)('%s 新团队报价按整期单席单价和积分相乘，赠券固定且重复付款不重复到账', (tier, price, credits, giftCount) => {
  for (const period of ['quarter', 'year'] as const) {
    const multiplier = period === 'year' ? 4 : 1;
    for (const seats of [2, 7, 100]) {
      const options = { ...team, period, seats, accountCount: 0 };
      const quote = getCouponSubscriptionQuote(tier, options);
      expect(quote).toMatchObject({
        amount: price * multiplier * seats, credits: credits * multiplier * seats,
        baseAmount: price * multiplier * seats, accountAmount: 0, seatAmount: 0, accountCount: giftCount,
        seatPricing: { unitAmount: price * multiplier, unitCredits: credits * multiplier, includesOwner: true },
      });
      const discount = getSubscriptionDiscount(quote);
      expect(discount.referenceAmount).toBeCloseTo(quote.credits * 500 / 961 + giftCount * 42);
      const order = createSubscriptionOrder(tier, options);
      expect(order.subscription?.seatPricing).toEqual(quote.seatPricing);
      const before = creditsBalance.value;
      const couponsBefore = accountCoupons.value.length;
      completeRecharge(order.id, 'alipay');
      refreshRechargeAccount();
      completeRecharge(order.id, 'wechat');
      expect(creditsBalance.value).toBe(before + quote.credits);
      expect(accountCoupons.value).toHaveLength(couponsBefore + 1);
      expect(accountCoupons.value.at(-1)?.accountCount).toBe(giftCount);
      expect(subscriptionSeatLabel(order.subscription!)).toBe(`${seats} 席（含本人）`);
    }
  }
});

test('历史团队基础版可按旧快照付款且保持原席位含义，新订单不再提供团队基础版', () => {
  const order = createSubscriptionOrder('p500', personal);
  const key = 'chuhai-credits-v1:subscriber';
  const saved = JSON.parse(localStorage.getItem(key)!);
  Object.assign(saved.orders[0], { amount: 2564, credits: 3844 });
  Object.assign(saved.orders[0].subscription, {
    edition: 'team', period: 'year', seats: 2, baseAmount: 2084, seatAmount: 480,
  });
  localStorage.setItem(key, JSON.stringify(saved));
  refreshRechargeAccount();
  const paid = completeRecharge(order.id, 'alipay');
  expect(paid).toMatchObject({ amount: 2564, credits: 3844, subscription: { seatAmount: 480 } });
  expect(paid.subscription?.seatPricing).toBeUndefined();
  expect(subscriptionSeatLabel(paid.subscription!)).toBe('2 席（另计本人）');
  expect(creditsBalance.value).toBe(3944);
  expect(() => createSubscriptionOrder('p500', team)).toThrow('团队版不再提供基础版');
});

test('旧订阅快照按原积分和账号费用结算，独立积分充值额度保持原值', () => {
  const order = createSubscriptionOrder('p500', personal);
  const key = 'chuhai-credits-v1:subscriber';
  const saved = JSON.parse(localStorage.getItem(key)!);
  saved.orders[0].credits = 1041;
  saved.orders[0].amount = 560;
  saved.orders[0].subscription.accountAmount = 60;
  saved.orders[0].deliveryMode = 'automatic';
  localStorage.setItem(key, JSON.stringify(saved));
  refreshRechargeAccount();
  expect(completeRecharge(order.id, 'alipay')).toMatchObject({
    credits: 1041, amount: 560, subscription: { accountAmount: 60 },
  });
  expect(creditsBalance.value).toBe(1141);
  const tiers: RechargePackKey[] = ['p500', 'p1000', 'p2000', 'p5000'];
  expect(tiers.map(tier => getPurchaseQuote(tier, { includeAccounts: false }).credits))
    .toEqual([1041, 2173, 4545, 11904]);
});

test('报价格式、周期与数量边界在创建订单时一起校验', () => {
  expect(getSubscriptionQuote('p500', personal)).toMatchObject({ amount: 584, credits: 961 });
  expect(getSubscriptionQuote('p500', team)).toMatchObject({ amount: 704, credits: 961 });
  expect(createSubscriptionOrder('p1000', { ...team, period: 'year' })).toMatchObject({
    amount: 5600, credits: 12720, accountCount: 5, deliveryMode: 'coupon',
    subscription: { edition: 'team', period: 'year', baseAmount: 5600, accountAmount: 0, seatAmount: 0, seats: 2 },
  });
  expect(getSubscriptionQuote('p5000', { ...team, period: 'year', accountCount: 100, seats: 100 }))
    .toMatchObject({ amount: 39000, credits: 51280 });
  for (const accountCount of [-1, 0.5, NaN, 101]) {
    expect(() => createSubscriptionOrder('p500', { ...personal, accountCount })).toThrow('账号使用权数量');
  }
  for (const seats of [0, 1, 2.5, 101]) {
    expect(() => createSubscriptionOrder('p1000', { ...team, seats })).toThrow('团队席位数');
  }
  expect(() => createSubscriptionOrder('p500', { ...personal, seats: 2 })).toThrow('个人版仅限本人');
  expect(() => createSubscriptionOrder('p500', { ...personal, period: 'month' } as unknown as SubscriptionOptions))
    .toThrow('订阅周期');
});

test('个人版和团队版按基础版价格基准显示动态折扣', () => {
  const tiers = ['p500', 'p1000', 'p2000', 'p5000'] as const;
  for (const edition of ['personal', 'team'] as const) {
    for (const period of ['quarter', 'year'] as const) {
      const results = tiers.map((tier, i) => getSubscriptionDiscount(getSubscriptionQuote(tier, {
        edition, period, accountCount: [2, 5, 10, 30][i]!, seats: edition === 'team' ? 2 : 0,
      })));
      expect(results.map(result => result.label)).toEqual(period === 'quarter'
        ? ['10.0折', '8.6折', '7.8折', '7.4折'] : ['10.0折', '8.5折', '7.7折', '7.5折']);
    }
  }
  // The reference must match the selected quantities, including annual seat fees.
  const quote = getSubscriptionQuote('p2000', { ...team, period: 'year', accountCount: 5, seats: 7 });
  const discount = getSubscriptionDiscount(quote);
  expect(discount.referenceAmount).toBeCloseTo(20000 * 500 / 961 + 5 * 42 + 7 * 60 * 4);
  expect(discount.ratio).toBeCloseTo(9440 / discount.referenceAmount);
  const noAddons = getSubscriptionDiscount(getSubscriptionQuote('p2000', { ...personal, accountCount: 0 }));
  expect(noAddons.label).toBe('7.7折');
  expect(noAddons.ratio).not.toBe(discount.ratio);
});

test('月底接续、刷新恢复和重复结算不会重复发放积分或账号', () => {
  const first = createSubscriptionOrder('p500', personal);
  const term1 = completeRecharge(first.id, 'wechat');
  expect(term1.subscription).toMatchObject({
    startsAt: '2027-01-30T17:30:00.000Z', endsAt: '2027-04-29T17:30:00.000Z',
  });
  const second = createSubscriptionOrder('p500', { ...personal, period: 'year', accountCount: 0 });
  expect(second.deliveryMode).toBe('coupon');
  const term2 = completeRecharge(second.id, 'alipay');
  expect(term2.subscription).toMatchObject({
    startsAt: term1.subscription!.endsAt, endsAt: '2028-04-29T17:30:00.000Z',
  });
  const third = createSubscriptionOrder('p500', { ...personal, accountCount: 0 });
  const term3 = completeRecharge(third.id, 'alipay');
  expect(term3.subscription).toMatchObject({
    startsAt: term2.subscription!.endsAt, endsAt: '2028-07-29T17:30:00.000Z',
  });
  expect(subscriptionStatus(term2)).toBe('待生效');
  expect(currentSubscription.value?.id).toBe(first.id);
  expect(creditsBalance.value).toBe(5866);
  expect(rechargeAccountClaims.value).toHaveLength(0);
  expect(accountCoupons.value).toHaveLength(3);

  refreshRechargeAccount();
  expect(completeRecharge(first.id, 'alipay')).toEqual(term1);
  expect(completeRecharge(second.id, 'wechat')).toEqual(term2);
  vi.advanceTimersByTime(Date.parse(term1.subscription!.endsAt!) - Date.now());
  expect(subscriptionStatus(term1)).toBe('已到期');
  expect(currentSubscription.value?.id).toBe(second.id);
  vi.setSystemTime(new Date(term3.subscription!.endsAt!));
  refreshRechargeAccount();
  expect(currentPackageKey.value).toBeNull();
  expect(creditsBalance.value).toBe(5866);
  expect(rechargeAccountClaims.value).toHaveLength(0);
  expect(accountCoupons.value).toHaveLength(3);
});

test('有效订阅优先，同档选最近生效的一笔，到期回退原套餐', () => {
  const legacy = completeRecharge(createRechargeOrder('p5000', { includeAccounts: false }).id, 'alipay');
  const high = completeRecharge(createSubscriptionOrder('p1000', { ...personal, accountCount: 0 }).id, 'alipay');
  const low = completeRecharge(createSubscriptionOrder('p500', { ...personal, accountCount: 0 }).id, 'alipay');
  expect(currentSubscription.value?.id).toBe(high.id);
  expect(low.subscription?.startsAt).toBe(low.completedAt);
  vi.advanceTimersByTime(1000);
  const switched = completeRecharge(createSubscriptionOrder('p1000', { ...team, accountCount: 0 }).id, 'alipay');
  expect(switched.subscription?.startsAt).toBe(switched.completedAt);
  expect(currentSubscription.value?.id).toBe(switched.id);
  vi.setSystemTime(new Date(switched.subscription!.endsAt!));
  refreshRechargeAccount();
  expect(currentPackageKey.value).toBe(legacy.pack);
  expect(completeRecharge(legacy.id, 'wechat')).toEqual(legacy);
});
