import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick, toRaw, reactive } from 'vue';
import { currentUser } from '@/services/identity';
import {
  completeRecharge,
  createRechargeOrder,
  creditsBalance,
  socialAccountsTotal,
  socialAccountsRemaining,
  socialAccountsClaimed,
  recoverPurchasedAccounts,
  type AccountAllocation,
} from '@/services/credits';
import { claimSocialAccounts } from '@/services/purchasedAccounts';
import {
  studio,
  createProject,
  deleteAccount,
  ensurePublishTask,
  validatePublish,
  submitPublish,
  tickStudio,
  blankAttributes,
  disconnectAccount,
} from '@/services/studio';
import { accountAvailableInProject } from '@/services/accounts';
import { publishReason, videoRows } from '@/services/videoManagement';
async function login(id: string) {
  currentUser.value = { id, name: id, identity: id + '@test.com', method: 'email', bindings: ['email'] };
  await nextTick();
}
function purchase(pack: 'p490' | 'p1000' = 'p1000') {
  const order = createRechargeOrder(pack);
  completeRecharge(order.id, 'alipay');
  return order;
}
beforeEach(async () => {
  vi.restoreAllMocks();
  currentUser.value = null;
  localStorage.clear();
  await login('buyer');
});
test('TikTok partial claims consume completed orders, not pending orders; duplicate request is idempotent', () => {
  createRechargeOrder('p5000');
  const order = purchase();
  expect(socialAccountsRemaining.value).toBe(5);
  const allocation = { facebook: 0, instagram: 0, tiktok: 2 };
  const claim = claimSocialAccounts('first', allocation);
  expect(claim.accounts.map((a) => a.platform)).toEqual(['tiktok', 'tiktok']);
  expect(
    claim.accounts.every((a) => a.orderId === order.id && a.status === '已授权' && !!a.loginInfo?.password),
  ).toBe(true);
  expect(socialAccountsRemaining.value).toBe(3);
  expect(claimSocialAccounts('first', allocation).accounts.map((a) => a.id)).toEqual(
    claim.accounts.map((a) => a.id),
  );
  expect(studio.value.accounts).toHaveLength(2);
  claimSocialAccounts('second', { facebook: 0, instagram: 0, tiktok: 3 });
  expect(socialAccountsTotal.value).toBe(5);
  expect(socialAccountsClaimed.value).toBe(5);
  expect(socialAccountsRemaining.value).toBe(0);
});
for (const allocation of [
  { facebook: 0, instagram: 0, tiktok: -1 },
  { facebook: 0, instagram: 0, tiktok: 0.5 },
  { facebook: 0, instagram: 0, tiktok: NaN },
  { facebook: 0, instagram: 0, tiktok: 0 },
  { facebook: 0, instagram: 0, tiktok: 6 },
  { facebook: 1, instagram: 0, tiktok: 0 },
  { facebook: 0, instagram: 1, tiktok: 0 },
  { facebook: 1, instagram: 1, tiktok: 1 },
]) {
  test('invalid allocation is rejected: ' + JSON.stringify(allocation), () => {
    purchase();
    expect(() => claimSocialAccounts('bad', allocation as AccountAllocation)).toThrow();
    expect(socialAccountsRemaining.value).toBe(5);
    expect(studio.value.accounts).toHaveLength(0);
  });
}
test('ledger write failure consumes nothing; retry succeeds', () => {
  purchase('p490');
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  expect(() => claimSocialAccounts('retry', { facebook: 0, instagram: 0, tiktok: 2 })).toThrow(
    '本地保存失败',
  );
  expect(socialAccountsRemaining.value).toBe(2);
  expect(studio.value.accounts).toHaveLength(0);
  spy.mockRestore();
  claimSocialAccounts('retry', { facebook: 0, instagram: 0, tiktok: 2 });
  expect(socialAccountsRemaining.value).toBe(0);
});
test('delivery failure is recoverable and never double-claims', async () => {
  purchase('p490');
  const original = Storage.prototype.setItem;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key.startsWith('chuhai-studio-v1:')) throw Error('quota');
    original.call(this, key, value);
  });
  expect(() => claimSocialAccounts('recover', { facebook: 0, instagram: 0, tiktok: 1 })).toThrow(
    '领取记录已保存',
  );
  expect(socialAccountsRemaining.value).toBe(1);
  expect(studio.value.accounts).toHaveLength(0);
  spy.mockRestore();
  await login('other');
  await login('buyer');
  expect(studio.value.accounts).toHaveLength(1);
  claimSocialAccounts('recover', { facebook: 0, instagram: 0, tiktok: 1 });
  expect(studio.value.accounts).toHaveLength(1);
  expect(socialAccountsRemaining.value).toBe(1);
});
test('user isolation, reload, credentials stability and deletion tombstones', async () => {
  purchase();
  const claim = claimSocialAccounts('mine', { facebook: 0, instagram: 0, tiktok: 1 });
  const id = claim.accounts[0]!.id;
  const credentials = { ...studio.value.accounts[0]!.loginInfo };
  await login('other');
  expect(socialAccountsRemaining.value).toBe(0);
  expect(studio.value.accounts).toHaveLength(0);
  await login('buyer');
  expect(studio.value.accounts[0]!.loginInfo).toEqual(credentials);
  expect(socialAccountsRemaining.value).toBe(4);
  deleteAccount(id);
  await login('other');
  await login('buyer');
  expect(studio.value.accounts.find((a) => a.id === id)?.deleted).toBe(true);
  expect(socialAccountsRemaining.value).toBe(4);
  const next = structuredClone(toRaw(studio.value));
  expect(recoverPurchasedAccounts(next, 'buyer')).toBe(false);
});
test('legacy balance and orders retain snapshots and receive no account entitlements', async () => {
  await login('other');
  localStorage.setItem(
    'chuhai-credits-v1:legacy',
    JSON.stringify({
      balance: 2600,
      total: 2600,
      orders: [
        {
          id: 'old',
          userId: 'legacy',
          pack: 'p490',
          amount: 490,
          credits: 2500,
          channel: 'alipay',
          status: 'completed',
          createdAt: '2026-01-01',
        },
      ],
    }),
  );
  await login('legacy');
  expect(creditsBalance.value).toBe(2600);
  expect(socialAccountsRemaining.value).toBe(0);
  expect(completeRecharge('old', 'wechat').credits).toBe(2500);
  expect(creditsBalance.value).toBe(2600);
  purchase('p490');
  expect(creditsBalance.value).toBe(4520);
  expect(socialAccountsRemaining.value).toBe(2);
});
test('purchased accounts can publish in every project and newly created projects; invalid states are blocked', async () => {
  const before = createProject('existing');
  purchase();
  const account = claimSocialAccounts('publisher', { facebook: 0, instagram: 0, tiktok: 1 }).accounts[0]!;
  const after = createProject('new');
  expect(accountAvailableInProject(account, before)).toBe(true);
  expect(accountAvailableInProject(account, after)).toBe(true);
  const film = {
    id: 'film',
    projectId: after.id,
    title: 'video',
    type: '视频' as const,
    source: '普通创作' as const,
    createdAt: new Date().toISOString(),
    duration: '10',
    ratio: '9:16',
    quality: '480p',
    brief: '',
    productIds: [],
    version: 1,
    mediaIds: [],
    inPublishing: false,
    attributes: blankAttributes(),
  };
  studio.value.films.push(film);
  const task = ensurePublishTask(film);
  task.accountId = account.id;
  expect(
    publishReason(
      studio.value,
      videoRows(studio.value, after.id, false).find((row) => row.film?.id === film.id)!,
      false,
    ),
  ).toBe('');
  expect(() => validatePublish(task)).not.toThrow();
  await submitPublish([task]);
  await tickStudio(Date.now() + 2000);
  await tickStudio(Date.now() + 9000);
  expect(task.status).toBe('发布成功');
  disconnectAccount(account.id);
  expect(() => validatePublish(task)).toThrow();
  studio.value.accounts[0]!.status = '已授权';
  studio.value.accounts[0]!.deleted = true;
  expect(() => validatePublish(task)).toThrow();
  expect(accountAvailableInProject({ ...account, source: undefined }, before)).toBe(false);
});

test('claim delivery handles nested Vue proxies created by existing workspace interactions', () => {
  purchase();
  studio.value.groups.push(reactive({ id: 'nested-proxy', name: 'Existing reactive group' }));
  const first = claimSocialAccounts('nested-first', { facebook: 0, instagram: 0, tiktok: 1 });
  studio.value.accounts[0]!.loginInfo = reactive(first.accounts[0]!.loginInfo!);
  claimSocialAccounts('nested-second', { facebook: 0, instagram: 0, tiktok: 1 });
  expect(socialAccountsRemaining.value).toBe(3);
  expect(studio.value.accounts).toHaveLength(2);
});

test('historical Facebook deliveries still recover and retry without consuming more slots', async () => {
  purchase();
  claimSocialAccounts('historical', { facebook: 0, instagram: 0, tiktok: 1 });
  const stored = JSON.parse(localStorage.getItem('chuhai-credits-v1:buyer')!);
  stored.claims[0].allocation = { facebook: 1, instagram: 0, tiktok: 0 };
  stored.claims[0].accounts[0].platform = 'facebook';
  stored.claims[0].accounts[0].name = '历史 Facebook 帐号';
  localStorage.setItem('chuhai-credits-v1:buyer', JSON.stringify(stored));
  localStorage.removeItem('chuhai-studio-v1:buyer');
  await login('other');
  await login('buyer');
  expect(studio.value.accounts[0]!.platform).toBe('facebook');
  expect(claimSocialAccounts('historical', stored.claims[0].allocation).accounts[0]!.platform).toBe(
    'facebook',
  );
  expect(socialAccountsRemaining.value).toBe(4);
  expect(studio.value.accounts).toHaveLength(1);
});
