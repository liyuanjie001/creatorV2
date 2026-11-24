import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { currentUser } from '@/services/identity';
import { guideTour } from '@/services/guideTour';
import {
  completeRecharge,
  createRechargeOrder,
  socialAccountsRemaining,
  creditsBalance,
  creditsTotal,
  confirmWelcomeCredits,
  refreshRechargeAccount,
  spendCredits,
  currentPackage,
  purchasePacks,
  rechargePacks,
  creditOnlyPacks,
  getPurchaseQuote,
  type RechargePackKey,
  type PurchasePackKey,
  type RechargeOrder,
} from '@/services/credits';
async function login(id: string) {
  currentUser.value = { id, name: id, identity: `${id}@test.com`, method: 'email', bindings: ['email'] };
  await nextTick();
}
beforeEach(async () => {
  vi.restoreAllMocks();
  localStorage.clear();
  currentUser.value = null;
  guideTour.activate(null);
  await nextTick();
  await login('one');
});

test('新登记账号初始50积分已持久化，消费后重新登录不重发', async () => {
  guideTour.enroll('new-credit');
  await login('new-credit');
  expect(creditsBalance.value).toBe(50);
  expect(creditsTotal.value).toBe(50);
  expect(JSON.parse(localStorage.getItem('chuhai-credits-v1:new-credit')!)).toMatchObject({ balance: 50, total: 50, welcomeGift: 50 });
  spendCredits(12);
  await login('one'); await login('new-credit');
  refreshRechargeAccount();
  expect(confirmWelcomeCredits()).toBe(true);
  expect(creditsBalance.value).toBe(38);
  expect(creditsTotal.value).toBe(50);
});

test('已有账本不被50积分覆盖，也不误报新用户赠送到账', async () => {
  const ledger = JSON.stringify({ balance: 876, total: 1000, orders: [], claims: [] });
  localStorage.setItem('chuhai-credits-v1:existing-credit', ledger);
  guideTour.enroll('existing-credit');
  await login('existing-credit');
  expect(creditsBalance.value).toBe(876);
  expect(confirmWelcomeCredits()).toBe(false);
  expect(localStorage.getItem('chuhai-credits-v1:existing-credit')).toBe(ledger);
});

test('损坏的新用户账本不能被初始赠送覆盖', async () => {
  guideTour.enroll('bad-credit');
  localStorage.setItem('chuhai-credits-v1:bad-credit', '{');
  await login('bad-credit');
  expect(creditsBalance.value).toBe(0);
  expect(() => confirmWelcomeCredits()).toThrow();
  expect(localStorage.getItem('chuhai-credits-v1:bad-credit')).toBe('{');
});

test('演示账号和团队成员不发放新用户积分，成员保持分配额度', async () => {
  guideTour.enroll('demo');
  await login('demo');
  expect(confirmWelcomeCredits()).toBe(false);
  expect(creditsBalance.value).toBe(100);
  localStorage.setItem('chuhai-team-v1:one', JSON.stringify({ ownerId: 'one', members: [{ id: 'member', active: true, credits: 23, creditLimit: 30 }] }));
  guideTour.enroll('team:one:member');
  currentUser.value = { id: 'team:one:member', name: '成员', identity: 'member@test.com', method: 'email', bindings: ['team'], teamOwnerId: 'one', teamMemberId: 'member', teamRole: 'creator' };
  expect(creditsBalance.value).toBe(23);
  expect(creditsTotal.value).toBe(30);
  expect(confirmWelcomeCredits()).toBe(false);
  expect(localStorage.getItem('chuhai-credits-v1:team:one:member')).toBeNull();
});
for (const pack of Object.keys(purchasePacks) as PurchasePackKey[]) {
  test(`${pack} 按档位增加余额及总额度`, () => {
    const order = createRechargeOrder(pack);
    const result = completeRecharge(order.id, 'wechat');
    expect(result).toMatchObject({
      status: 'completed',
      channel: 'wechat',
      amount: purchasePacks[pack].amount,
      credits: purchasePacks[pack].credits,
      accountCount: purchasePacks[pack].accountCount,
    });
    completeRecharge(order.id, 'alipay');
    expect(creditsBalance.value).toBe(100 + purchasePacks[pack].credits);
    expect(creditsTotal.value).toBe(creditsBalance.value);
    expect(socialAccountsRemaining.value).toBe(0);
    expect(result.deliveryMode).toBe(purchasePacks[pack].accountCount ? 'automatic' : undefined);
  });
}
test('同一订单重复完成只入账一次', () => {
  const order = createRechargeOrder('p500');
  completeRecharge(order.id, 'alipay');
  completeRecharge(order.id, 'alipay');
  expect(creditsBalance.value).toBe(1033);
});
test('我的套餐按最高已支付套餐显示，账号选择不影响版本，独立积分充值不改变版本', () => {
  expect(currentPackage.value).toBeNull();
  const credits = createRechargeOrder('credit500');
  completeRecharge(credits.id, 'alipay');
  expect(currentPackage.value).toBeNull();
  const pending = createRechargeOrder('p5000');
  expect(pending.status).toBe('pending');
  expect(currentPackage.value).toBeNull();
  const converted = createRechargeOrder('p2000', { includeAccounts: false });
  completeRecharge(converted.id, 'alipay');
  expect(currentPackage.value?.priceLabel).toBe('商业版');
  const included = createRechargeOrder('p1000');
  completeRecharge(included.id, 'alipay');
  expect(currentPackage.value?.priceLabel).toBe('商业版');
  const upgrade = createRechargeOrder('p5000');
  completeRecharge(upgrade.id, 'alipay');
  expect(currentPackage.value?.priceLabel).toBe('企业版');
  const lowerTier = createRechargeOrder('p500');
  completeRecharge(lowerTier.id, 'alipay');
  expect(currentPackage.value?.priceLabel).toBe('企业版');
});
test('未完成订单不入账，重新充值创建独立订单', () => {
  const first = createRechargeOrder('p500'),
    second = createRechargeOrder('p500');
  expect(first.id).not.toBe(second.id);
  expect(creditsBalance.value).toBe(100);
});
test('用户余额隔离，重新载入恢复余额及订单幂等', async () => {
  const order = createRechargeOrder('p1000');
  completeRecharge(order.id, 'wechat');
  await login('two');
  expect(creditsBalance.value).toBe(100);
  expect(currentPackage.value).toBeNull();
  expect(() => completeRecharge(order.id, 'wechat')).toThrow('不存在');
  await login('one');
  expect(creditsBalance.value).toBe(1995);
  expect(currentPackage.value?.priceLabel).toBe('专业版');
  completeRecharge(order.id, 'wechat');
  expect(creditsBalance.value).toBe(1995);
});
test('存储失败不增加余额且可以重试', () => {
  const order = createRechargeOrder('p500');
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => completeRecharge(order.id, 'alipay')).toThrow('本地保存失败');
  expect(creditsBalance.value).toBe(100);
  spy.mockRestore();
  completeRecharge(order.id, 'alipay');
  expect(creditsBalance.value).toBe(1033);
});
test('创建失败不产生可支付订单', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => createRechargeOrder('p500')).toThrow('本地保存失败');
  expect(creditsBalance.value).toBe(100);
});

const legacyPacks = [
  { pack: 'p490', amount: 490, credits: 1920, accountCount: 2 },
  { pack: 'p1000', amount: 1000, credits: 4100, accountCount: 5 },
  { pack: 'p2000', amount: 2000, credits: 9200, accountCount: 10 },
  { pack: 'p5000', amount: 5000, credits: 24245, accountCount: 20 },
] as const;
for (const status of ['pending', 'completed'] as const) {
  test.each(legacyPacks)(`历史 $pack ${status} 订单按保存的额度结算且重复支付不重复入账`, async (pack) => {
    const order: RechargeOrder = {
      ...pack,
      id: 'legacy-order',
      userId: 'legacy',
      channel: 'alipay',
      status,
      createdAt: '2026-11-01',
      ...(status === 'completed' ? { completedAt: '2026-11-01' } : {}),
    };
    const balance = status === 'completed' ? 100 + pack.credits : 100;
    localStorage.setItem(
      'chuhai-credits-v1:legacy',
      JSON.stringify({ balance, total: balance, orders: [order], claims: [] }),
    );
    await login('legacy');
    expect(creditsBalance.value).toBe(balance);
    expect(socialAccountsRemaining.value).toBe(status === 'completed' ? pack.accountCount : 0);
    expect(completeRecharge(order.id, 'wechat')).toMatchObject({ ...pack, status: 'completed' });
    completeRecharge(order.id, 'alipay');
    expect(creditsBalance.value).toBe(100 + pack.credits);
    expect(socialAccountsRemaining.value).toBe(pack.accountCount);
    const fresh = createRechargeOrder('p500');
    expect(fresh).toMatchObject({ pack: 'p500', amount: 500, credits: 933, accountCount: 2 });
    completeRecharge(fresh.id, 'alipay');
    await login('other');
    await login('legacy');
    expect(creditsBalance.value).toBe(1033 + pack.credits);
    expect(socialAccountsRemaining.value).toBe(pack.accountCount);
  });
}

test('旧首档只兼容历史订单，不再允许创建新订单', () => {
  expect(() => createRechargeOrder('p490' as PurchasePackKey)).toThrow('请选择有效套餐');
});

const expectedQuotes = [
  ['p500', 'credit500', 500, 933, 2, 84, 1041, 94],
  ['p1000', 'credit1000', 1000, 1895, 5, 172, 2173, 197],
  ['p2000', 'credit2000', 2000, 3945, 10, 358, 4545, 413],
  ['p5000', 'credit5000', 5000, 10095, 30, 917, 11904, 1082],
] as const;
test.each(expectedQuotes)(
  '%s 两种选择与独立积分充值报价一致',
  (bundle, credit, amount, included, count, videos, converted, creditVideos) => {
    expect(getPurchaseQuote(bundle)).toEqual({
      amount,
      credits: included,
      accountCount: count,
      videoCount: videos,
      purchaseMode: 'withAccounts',
    });
    const options = { includeAccounts: false };
    const quote = getPurchaseQuote(bundle, options);
    expect(quote).toEqual({
      amount,
      credits: converted,
      accountCount: 0,
      videoCount: creditVideos,
      purchaseMode: 'creditsOnly',
    });
    expect(getPurchaseQuote(credit)).toEqual({
      amount,
      credits: converted,
      accountCount: 0,
      videoCount: creditVideos,
    });
    const order = createRechargeOrder(bundle, options);
    options.includeAccounts = true;
    expect(order).toMatchObject(quote);
    expect(order.deliveryMode).toBeUndefined();
    completeRecharge(order.id, 'alipay');
    completeRecharge(order.id, 'wechat');
    expect(creditsBalance.value).toBe(100 + converted);
    const stored = JSON.parse(localStorage.getItem('chuhai-credits-v1:one')!);
    expect(stored.claims).toEqual([]);
    expect(stored.orders[0]).toMatchObject({ ...quote, status: 'completed' });
    expect(rechargePacks[bundle as RechargePackKey].credits).toBe(included);
    expect(creditOnlyPacks[credit].credits).toBe(converted);
  },
);

test.each([
  ['credit100', 100, 400],
  ['credit500', 500, 2000],
  ['credit1000', 1000, 4000],
  ['credit2000', 2000, 8000],
] as const)('历史 %s 积分订单按原快照入账', async (pack, amount, credits) => {
  const order: RechargeOrder = {
    id: 'old-credit',
    userId: 'legacy-credit',
    pack,
    amount,
    credits,
    accountCount: 0,
    channel: 'alipay',
    status: 'pending',
    createdAt: '2026-11-01',
  };
  localStorage.setItem(
    'chuhai-credits-v1:legacy-credit',
    JSON.stringify({ balance: 100, total: 100, orders: [order] }),
  );
  await login('legacy-credit');
  expect(completeRecharge(order.id, 'wechat')).toMatchObject({ amount, credits, accountCount: 0 });
  completeRecharge(order.id, 'alipay');
  expect(creditsBalance.value).toBe(100 + credits);
  expect(socialAccountsRemaining.value).toBe(0);
});

test('旧 credit100 仅保留历史读取，新订单不再提供', () => {
  expect(() => createRechargeOrder('credit100' as PurchasePackKey)).toThrow('请选择有效套餐');
});
