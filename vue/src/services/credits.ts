import { computed, ref, watch } from 'vue';
import { currentUser } from './identity';
import { now, readJSON, uid, writeJSON } from './storage';
import type { SocialPlatform, StudioState, TKAccount } from '@/types/studio';
import { countryName, isCountryCode } from './countries';

export type PaymentChannel = 'alipay' | 'wechat';
export const rechargePacks = {
  p490: {
    amount: 490,
    credits: 1920,
    accountCount: 2,
    videoCount: 147,
    unitPrice: '0.25',
    originalAmount: null,
    discountRate: null,
    priceLabel: '轻量运营',
    tag: '',
  },
  p1000: {
    amount: 1000,
    credits: 4100,
    accountCount: 5,
    videoCount: 315,
    unitPrice: '0.24',
    originalAmount: 1250,
    discountRate: '8',
    priceLabel: '个人运营',
    tag: '',
  },
  p2000: {
    amount: 2000,
    credits: 9200,
    accountCount: 10,
    videoCount: 707,
    unitPrice: '0.21',
    originalAmount: 4000,
    discountRate: '5',
    priceLabel: '多账号运营',
    tag: '热门推荐',
  },
  p5000: {
    amount: 5000,
    credits: 24245,
    accountCount: 20,
    videoCount: 1865,
    unitPrice: '0.20',
    originalAmount: 12500,
    discountRate: '4',
    priceLabel: '团队矩阵运营',
    tag: '高性价比',
  },
} as const;
export type RechargePackKey = keyof typeof rechargePacks;
// Standalone prices are demo data; bundle prices remain the confirmed product table.
export const creditOnlyPacks = {
  credit100: { amount: 100, credits: 400, accountCount: 0, priceLabel: '轻量体验' },
  credit500: { amount: 500, credits: 2000, accountCount: 0, priceLabel: '日常补充' },
  credit1000: { amount: 1000, credits: 4000, accountCount: 0, priceLabel: '持续创作' },
  credit2000: { amount: 2000, credits: 8000, accountCount: 0, priceLabel: '批量创作' },
} as const;
export const accountOnlyPacks = {
  account99: { amount: 99, credits: 0, accountCount: 1, priceLabel: '单号体验' },
  account450: { amount: 450, credits: 0, accountCount: 5, priceLabel: '多号运营' },
  account850: { amount: 850, credits: 0, accountCount: 10, priceLabel: '矩阵运营' },
  account1600: { amount: 1600, credits: 0, accountCount: 20, priceLabel: '规模运营' },
} as const;
export const purchasePacks = { ...rechargePacks, ...creditOnlyPacks, ...accountOnlyPacks } as const;
export type PurchasePackKey = keyof typeof purchasePacks;
export type RechargeOrder = {
  id: string;
  userId: string;
  pack: PurchasePackKey | 'p50' | 'p100';
  amount: number;
  credits: number;
  accountCount?: number;
  channel: PaymentChannel;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
};
export type AccountAllocation = Record<SocialPlatform, number>;
export type AccountClaimItem = { platform: SocialPlatform; countryCode: string; quantity: number };
export type AccountClaimInput = AccountAllocation | AccountClaimItem[];
export type AccountClaim = {
  id: string;
  userId: string;
  createdAt: string;
  allocation: AccountAllocation;
  items?: AccountClaimItem[];
  accounts: TKAccount[];
};
type CreditAccount = { balance: number; total: number; orders: RechargeOrder[]; claims: AccountClaim[] };
const initial = (): CreditAccount => ({ balance: 100, total: 100, orders: [], claims: [] });
const key = (userId: string) => `chuhai-credits-v1:${userId}`;
const account = ref<CreditAccount>(initial());
function read(userId: string): CreditAccount {
  const value = readJSON<CreditAccount>(key(userId), initial);
  return { ...value, claims: value.claims ?? [] };
}
function save(userId: string, value: CreditAccount) {
  if (!writeJSON(key(userId), value)) throw new Error('本地保存失败，请检查浏览器存储后重试');
  if (currentUser.value?.id === userId) account.value = value;
}
watch(
  () => currentUser.value?.id,
  (userId) => {
    account.value = userId ? read(userId) : initial();
  },
  { immediate: true, flush: 'sync' },
);
export const creditsBalance = computed(() => account.value.balance);
export const creditsTotal = computed(() => account.value.total);
export const socialAccountsTotal = computed(() =>
  account.value.orders.reduce(
    (sum, order) => sum + (order.status === 'completed' ? (order.accountCount ?? 0) : 0),
    0,
  ),
);
export const socialAccountsClaimed = computed(() =>
  account.value.claims.reduce((sum, claim) => sum + claim.accounts.length, 0),
);
export const socialAccountsRemaining = computed(
  () => socialAccountsTotal.value - socialAccountsClaimed.value,
);
function userId() {
  if (!currentUser.value) throw new Error('请先登录后充值');
  return currentUser.value.id;
}
export function createRechargeOrder(pack: PurchasePackKey): RechargeOrder {
  const id = userId();
  if (!Object.hasOwn(purchasePacks, pack)) throw new Error('请选择有效套餐');
  const { amount, credits, accountCount } = purchasePacks[pack];
  const order: RechargeOrder = {
    id: uid(),
    userId: id,
    pack,
    amount,
    credits,
    accountCount,
    channel: 'alipay',
    status: 'pending',
    createdAt: now(),
  };
  const value = read(id);
  save(id, { ...value, orders: [...value.orders, order] });
  return order;
}
export function completeRecharge(orderId: string, channel: PaymentChannel): RechargeOrder {
  const id = userId();
  const value = read(id);
  const order = value.orders.find((item) => item.id === orderId);
  if (!order) throw new Error('充值订单不存在，请重新选择档位');
  if (order.status === 'completed') return order;
  const completed: RechargeOrder = { ...order, channel, status: 'completed', completedAt: now() };
  save(id, {
    ...value,
    balance: value.balance + order.credits,
    total: value.total + order.credits,
    orders: value.orders.map((item) => (item.id === orderId ? completed : item)),
  });
  return completed;
}

// The claim ledger commits first; delivery can be recovered after an interrupted workspace write.
export function normalizeClaimItems(input: AccountClaimInput): AccountClaimItem[] {
  const platformKeys: SocialPlatform[] = ['tiktok', 'instagram', 'facebook'];
  const rows = Array.isArray(input)
    ? input
    : platformKeys.map((platform) => ({ platform, countryCode: 'US', quantity: input?.[platform] }));
  const merged = new Map<string, AccountClaimItem>();
  let total = 0;
  for (const item of rows) {
    if (!item || !platformKeys.includes(item.platform)) throw new Error('请选择有效的社媒平台');
    if (!isCountryCode(item.countryCode)) throw new Error('请选择有效的国家地区');
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 0)
      throw new Error('请输入有效的非负整数帐号数量');
    total += item.quantity;
    if (!Number.isSafeInteger(total)) throw new Error('帐号数量超出有效范围');
    if (item.quantity === 0) continue;
    const key = `${item.platform}:${item.countryCode}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { platform: item.platform, countryCode: item.countryCode, quantity: item.quantity });
  }
  if (total <= 0) throw new Error('请至少选择 1 个帐号');
  return [...merged.values()];
}

export function reserveSocialAccounts(requestId: string, input: AccountClaimInput): AccountClaim {
  const id = userId(),
    value = read(id);
  const existing = value.claims.find((claim) => claim.id === requestId);
  if (existing) return existing;
  if (!requestId.trim()) throw new Error('领取请求标识不能为空');
  const items = normalizeClaimItems(input);
  const allocation: AccountAllocation = { tiktok: 0, instagram: 0, facebook: 0 };
  for (const item of items) allocation[item.platform] += item.quantity;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const used = value.claims.flatMap((claim) => claim.accounts);
  const slots = value.orders
    .filter((order) => order.status === 'completed')
    .flatMap((order) =>
      Array.from(
        {
          length: Math.max(0, (order.accountCount ?? 0) - used.filter((a) => a.orderId === order.id).length),
        },
        () => order.id,
      ),
    );
  if (count > slots.length) throw new Error('领取数量不能超过待领取名额');
  const accounts: TKAccount[] = [];
  const names = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' };
  for (const { platform, countryCode, quantity } of items) {
    const region = countryName(countryCode) + '（演示）';
    for (let i = 0; i < quantity; i++) {
      const accountId = uid(),
        username = 'demo_' + platform.slice(0, 2) + '_' + accountId.replaceAll('-', '').slice(0, 12);
      accounts.push({
        id: accountId,
        source: 'recharge',
        claimId: requestId,
        orderId: slots[accounts.length],
        platform,
        name: names[platform] + ' 套餐帐号 ' + (used.length + accounts.length + 1),
        handle: '@' + username,
        countryCode,
        region,
        groupId: 'ungrouped',
        note: '套餐领取 · 所有项目可用',
        status: '已授权',
        authorizedAt: now(),
        loginInfo: {
          username,
          password: 'Demo!' + uid().replaceAll('-', '').slice(0, 14),
          ip: '192.0.2.' + (((used.length + accounts.length) % 254) + 1),
          region,
          mock: true,
        },
      });
    }
  }
  const claim: AccountClaim = {
    id: requestId,
    userId: id,
    createdAt: now(),
    allocation: { ...allocation },
    items,
    accounts,
  };
  save(id, { ...value, claims: [...value.claims, claim] });
  return claim;
}
export function recoverPurchasedAccounts(state: StudioState, owner: string) {
  const delivered = read(owner).claims.flatMap((claim) => claim.accounts);
  // Existing soft-deleted accounts are tombstones, so they are never restored.
  const missing = delivered.filter((item) => !state.accounts.some((existing) => existing.id === item.id));
  if (!missing.length) return false;
  state.accounts.unshift(...structuredClone(missing));
  return true;
}
