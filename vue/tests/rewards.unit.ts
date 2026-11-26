import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { currentUser, identityService, sendCode, DEMO_CODE } from '@/services/identity';
import { guideTour } from '@/services/guideTour';
import {
  claimDailyCredits,
  getCheckInStatus,
  resetCheckIn,
  creditsBalance,
  creditsTotal,
  createRechargeOrder,
  createSubscriptionOrder,
  completeRecharge,
  refreshRechargeAccount,
  referralRewards,
  spendCredits,
} from '@/services/credits';
import {
  getInvitationCode,
  getInvitedUsers,
  invitationRegistrationUpdates,
  invitationUrl,
  newAccountRewards,
} from '@/services/invitations';
import { writeJSONBatch } from '@/services/storage';
import type { AuthUser } from '@/types/studio';

const media = vi.hoisted(() => new Map<string, { text(): Promise<string> }>());
vi.mock('@/services/media', () => ({
  saveMedia: async (_owner: string, blob: Blob) => {
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    const id = crypto.randomUUID();
    media.set(id, { text: async () => contents });
    return id;
  },
  getMedia: async (_owner: string, id: string) => media.get(id),
}));

function user(id: string, extra: Partial<AuthUser> = {}): AuthUser {
  return { id, name: id, identity: `${id}@example.com`, method: 'email', bindings: ['email'], ...extra };
}
function login(id: string, extra: Partial<AuthUser> = {}) {
  currentUser.value = user(id, extra);
  return currentUser.value;
}
function enroll(id: string) {
  guideTour.enroll(id);
  return login(id, { checkInCampaign: 1 });
}
function inviteBuyer(id = 'buyer') {
  const inviter = login('inviter');
  const code = getInvitationCode(inviter);
  const buyer = user(id, newAccountRewards(code));
  writeJSONBatch(invitationRegistrationUpdates(buyer));
  currentUser.value = buyer;
  return { inviter, buyer, code };
}
const ledger = (id: string) => JSON.parse(localStorage.getItem(`chuhai-credits-v1:${id}`) ?? 'null');

beforeEach(() => {
  vi.restoreAllMocks();
  currentUser.value = null;
  guideTour.activate(null);
  localStorage.clear();
  media.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-26T04:00:00Z'));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('每日10积分，当日不能重复，刷新重新登录保留记录且不影响50积分赠送', () => {
  enroll('daily');
  expect(creditsBalance.value).toBe(50);
  expect(claimDailyCredits()).toMatchObject({ days: 1, earned: 10, checkedInToday: true, canClaim: false });
  expect(creditsBalance.value).toBe(60);
  expect(creditsTotal.value).toBe(60);
  expect(() => claimDailyCredits()).toThrow('今日已签到');
  login('other');
  login('daily', { checkInCampaign: 1 });
  refreshRechargeAccount();
  expect(creditsBalance.value).toBe(60);
  expect(getCheckInStatus().days).toBe(1);
});

test('按北京时间零点跨日领取，断签后继续累计，十次封顶', () => {
  enroll('boundary');
  vi.setSystemTime(new Date('2026-11-26T15:59:59Z'));
  claimDailyCredits();
  vi.setSystemTime(new Date('2026-11-26T16:00:00Z'));
  claimDailyCredits();
  for (let day = 0; day < 8; day++) {
    vi.setSystemTime(new Date(Date.UTC(2026, 11, 1 + day * 2, 4)));
    claimDailyCredits();
  }
  expect(getCheckInStatus()).toMatchObject({ days: 10, earned: 100, completed: true, canClaim: false });
  expect(creditsBalance.value).toBe(150);
  vi.setSystemTime(new Date('2027-01-01T04:00:00Z'));
  expect(() => claimDailyCredits()).toThrow('已领满');
});

test('演示账号积分实际入账、可消费且重新登录不重置，累计上限100', () => {
  identityService.demo();
  const before = creditsBalance.value;
  claimDailyCredits();
  expect(creditsBalance.value).toBe(before + 10);
  spendCredits(5, { title: '演示签到积分消费' });
  expect(creditsBalance.value).toBe(before + 5);
  identityService.logout();
  identityService.demo();
  expect(creditsBalance.value).toBe(before + 5);
  expect(() => claimDailyCredits()).toThrow('今日已签到');
  for (let day = 1; day < 10; day++) {
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 26 + day, 4)));
    claimDailyCredits();
  }
  expect(ledger('demo').checkIns).toHaveLength(10);
  expect(creditsBalance.value).toBe(before + 95);
  vi.setSystemTime(new Date('2027-01-01T04:00:00Z'));
  identityService.logout();
  identityService.demo();
  expect(() => claimDailyCredits()).toThrow('已领满');
});

test('普通老账号无需新用户活动标记即可直接签到', () => {
  login('legacy');
  expect(getCheckInStatus().canClaim).toBe(true);
  claimDailyCredits();
  expect(creditsBalance.value).toBe(110);
});

test.each(['team:owner:member'])('%s 不具备签到资格', (id) => {
  login(
    id,
    id.startsWith('team:') ? { checkInCampaign: 1, teamOwnerId: 'owner', teamMemberId: 'member' } : {},
  );
  expect(getCheckInStatus().eligible).toBe(false);
  expect(() => claimDailyCredits()).toThrow('个人账号');
  expect(() => resetCheckIn()).toThrow('个人账号');
});

test('未登录不能领取或重置签到', () => {
  expect(getCheckInStatus().eligible).toBe(false);
  expect(() => claimDailyCredits()).toThrow('个人账号');
  expect(() => resetCheckIn()).toThrow('个人账号');
});

test('功能重置仅清空当前账号签到进度，保留钱包和其他账号，可再次领取并持久化', () => {
  login('other');
  claimDailyCredits();
  const other = localStorage.getItem('chuhai-credits-v1:other');
  login('resetter');
  claimDailyCredits();
  createRechargeOrder('credit500');
  spendCredits(5);
  const before = ledger('resetter');
  expect(resetCheckIn()).toMatchObject({ days: 0, earned: 0, canClaim: true });
  expect(ledger('resetter')).toEqual({ ...before, checkIns: [] });
  expect(localStorage.getItem('chuhai-credits-v1:other')).toBe(other);
  login('other');
  login('resetter');
  expect(getCheckInStatus().canClaim).toBe(true);
  claimDailyCredits();
  expect(creditsBalance.value).toBe(before.balance + 10);
  expect(getCheckInStatus().days).toBe(1);
});

test('领满后可重置，原有奖励保留并开始新一轮', () => {
  login('completed');
  for (let day = 0; day < 10; day++) {
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 26 + day, 4)));
    claimDailyCredits();
  }
  expect(getCheckInStatus().completed).toBe(true);
  expect(resetCheckIn().canClaim).toBe(true);
  expect(creditsBalance.value).toBe(200);
  claimDailyCredits();
  expect(creditsBalance.value).toBe(210);
});

test('重置保存失败时保留领取记录和余额', () => {
  login('reset-failure');
  claimDailyCredits();
  const before = localStorage.getItem('chuhai-credits-v1:reset-failure');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => resetCheckIn()).toThrow('本地保存失败');
  expect(localStorage.getItem('chuhai-credits-v1:reset-failure')).toBe(before);
  expect(creditsBalance.value).toBe(110);
  expect(getCheckInStatus().checkedInToday).toBe(true);
});

test('签到账号隔离，存储失败不发奖，恢复后可以领取', () => {
  enroll('failure');
  const before = localStorage.getItem('chuhai-credits-v1:failure');
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => claimDailyCredits()).toThrow('本地保存失败');
  expect(creditsBalance.value).toBe(50);
  expect(localStorage.getItem('chuhai-credits-v1:failure')).toBe(before);
  spy.mockRestore();
  claimDailyCredits();
  enroll('another');
  expect(getCheckInStatus().days).toBe(0);
  expect(creditsBalance.value).toBe(50);
});

test('邀请码稳定、大小写兼容，演示邀请码不绑定，无效码不接受，链接清理旧参数', () => {
  const inviter = login('inviter');
  const code = getInvitationCode(inviter);
  expect(getInvitationCode(inviter)).toBe(code);
  expect(newAccountRewards(` ${code.toLowerCase()} `)).toMatchObject({
    referrerId: inviter.id,
    checkInCampaign: 1,
  });
  expect(newAccountRewards('CHUHAI2026')).toEqual({ checkInCampaign: 1 });
  expect(() => newAccountRewards('UNKNOWN')).toThrow('邀请码无效');
  expect(() => newAccountRewards('constructor')).toThrow('邀请码无效');
  expect(invitationUrl(code, 'https://example.com/app/?old=value#/purchase')).toBe(
    `https://example.com/app/#/auth?mode=register&invite=${code}`,
  );
});

test.each(['email', 'phone', 'google', 'googleQuick', 'newUser'] as const)(
  '%s 新建账号绑定邀请并持久化签到资格，已有账号登录不改绑',
  async (method) => {
    vi.useRealTimers();
    const inviter = login('inviter');
    const code = getInvitationCode(inviter);
    let created: AuthUser;
    if (method === 'email' || method === 'phone') {
      const identity = method === 'email' ? `${crypto.randomUUID()}@example.com` : '+8613812345678';
      sendCode(identity, method);
      created = await identityService.register(identity, method, 'password123', DEMO_CODE, code);
    } else if (method === 'google') created = await identityService.google('google@example.com', '', code);
    else if (method === 'googleQuick') created = await identityService.googleQuick(code);
    else created = await identityService.newUser(code);
    expect(created).toMatchObject({ referrerId: inviter.id, checkInCampaign: 1 });
    expect(getInvitedUsers(inviter.id)).toHaveLength(1);
    expect(getCheckInStatus().eligible).toBe(true);
    identityService.logout();
    if (method === 'google') await identityService.google(created.identity, '', 'INVALID');
    else if (method === 'googleQuick') await identityService.googleQuick('INVALID');
    else if (method === 'newUser') {
      sendCode(created.identity, 'email');
      await identityService.login(created.identity, '', DEMO_CODE);
    } else await identityService.login(created.identity, 'password123');
    expect(currentUser.value?.referrerId).toBe(inviter.id);
    expect(getInvitedUsers(inviter.id)).toHaveLength(1);
  },
);

test('注册邀请索引保存失败可通过登录重试，不重复注册或计数', async () => {
  vi.useRealTimers();
  const inviter = login('inviter');
  const code = getInvitationCode(inviter);
  const original = Storage.prototype.setItem;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-studio-session') throw new Error('quota');
    return original.call(this, key, value);
  });
  await expect(identityService.google('retry@example.com', '', code)).rejects.toThrow('已撤销');
  expect(currentUser.value?.id).toBe('inviter');
  expect(getInvitedUsers('inviter')).toHaveLength(0);
  spy.mockRestore();
  const created = await identityService.google('retry@example.com');
  expect(created.referrerId).toBe('inviter');
  expect(getInvitedUsers('inviter')).toHaveLength(1);
});

test('首次套餐购买返10%向下取整，重复回调和续购不返，换账号读取奖励', () => {
  const { buyer } = inviteBuyer();
  const pending = createSubscriptionOrder('p500', {
    edition: 'personal',
    period: 'quarter',
    accountCount: 0,
    seats: 0,
  });
  expect(ledger('inviter')).toBeNull();
  completeRecharge(pending.id, 'alipay');
  completeRecharge(pending.id, 'wechat');
  const next = createRechargeOrder('p1000');
  completeRecharge(next.id, 'wechat');
  expect(ledger('inviter').referralRewards).toEqual([
    expect.objectContaining({
      buyerId: buyer.id,
      packageCredits: pending.credits,
      credits: Math.floor(pending.credits / 10),
    }),
  ]);
  login('inviter');
  refreshRechargeAccount();
  expect(referralRewards.value).toHaveLength(1);
  expect(creditsBalance.value).toBe(100 + Math.floor(pending.credits / 10));
});

test('单独充值或购买账号不返奖且不消耗首次套餐机会', () => {
  inviteBuyer();
  for (const pack of ['credit500', 'account99'] as const) {
    const order = createRechargeOrder(pack);
    completeRecharge(order.id, 'alipay');
  }
  expect(ledger('inviter')).toBeNull();
  const plan = createRechargeOrder('p500');
  completeRecharge(plan.id, 'alipay');
  expect(ledger('inviter').referralRewards).toHaveLength(1);
});

test('多个好友各自仅返一次，已有付费不追溯', () => {
  inviteBuyer('buyer-a');
  const plan = createRechargeOrder('p500');
  completeRecharge(plan.id, 'alipay');
  inviteBuyer('buyer-b');
  const planB = createRechargeOrder('p1000');
  completeRecharge(planB.id, 'wechat');
  expect(ledger('inviter').referralRewards).toHaveLength(2);
  const old = login('old');
  const oldOrder = createRechargeOrder('p500');
  completeRecharge(oldOrder.id, 'alipay');
  currentUser.value = { ...old, referrerId: 'inviter' };
  writeJSONBatch(invitationRegistrationUpdates(currentUser.value));
  const renewal = createRechargeOrder('p1000');
  completeRecharge(renewal.id, 'alipay');
  expect(ledger('inviter').referralRewards).toHaveLength(2);
});

test('邀请方写入失败回滚付款订单和余额，重试一次入账', () => {
  inviteBuyer();
  const order = createRechargeOrder('p500');
  const before = localStorage.getItem('chuhai-credits-v1:buyer');
  const original = Storage.prototype.setItem;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-credits-v1:inviter') throw new Error('quota');
    return original.call(this, key, value);
  });
  expect(() => completeRecharge(order.id, 'alipay')).toThrow('已撤销');
  expect(localStorage.getItem('chuhai-credits-v1:buyer')).toBe(before);
  expect(creditsBalance.value).toBe(100);
  expect(ledger('inviter')).toBeNull();
  spy.mockRestore();
  completeRecharge(order.id, 'alipay');
  expect(ledger('inviter').referralRewards).toHaveLength(1);
  expect(creditsBalance.value).toBe(1033);
});

test('损坏的邀请方账本不会被覆盖，也不会把订单标记为已付款', () => {
  inviteBuyer();
  const order = createRechargeOrder('p500');
  localStorage.setItem('chuhai-credits-v1:inviter', '{');
  expect(() => completeRecharge(order.id, 'alipay')).toThrow('积分读取失败');
  expect(localStorage.getItem('chuhai-credits-v1:inviter')).toBe('{');
  expect(ledger('buyer').orders[0].status).toBe('pending');
});

test('自邀和重绑被拒绝，未登记的邀请关系不返奖', () => {
  expect(() => invitationRegistrationUpdates(user('self', { referrerId: 'self' }))).toThrow('邀请关系无效');
  const { buyer } = inviteBuyer();
  expect(() => invitationRegistrationUpdates({ ...buyer, referrerId: 'other' })).toThrow('不能修改');
  login('unregistered', { referrerId: 'inviter' });
  const order = createRechargeOrder('p500');
  completeRecharge(order.id, 'alipay');
  expect(ledger('inviter')).toBeNull();
});
