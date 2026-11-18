import { computed, ref, watch } from 'vue';
import { currentUser } from './identity';
import { now, readJSON, uid, writeJSON } from './storage';
import type { SocialPlatform, StudioState, TKAccount } from '@/types/studio';
import { countryName, isCountryCode } from './countries';

export type PaymentChannel = 'alipay' | 'wechat';
const starterBenefits = {
  imagePublishing: false,
  bgm: false,
  batchPublishing: false,
  scheduledPublishing: false,
  videoRemake: false,
  batchGeneration: false,
  contentAnalytics: false,
  teamPermissions: false,
} as const;
const standardBenefits = {
  ...starterBenefits,
  imagePublishing: true,
  bgm: true,
  scheduledPublishing: true,
  videoRemake: true,
  teamPermissions: true,
} as const;
const advancedBenefits = {
  ...standardBenefits,
  batchPublishing: true,
  batchGeneration: true,
  contentAnalytics: true,
} as const;

export const rechargePacks = {
  p500: {
    amount: 500,
    credits: 933,
    accountCount: 2,
    videoCount: 84,
    creditsOnly: { credits: 1041, videoCount: 94 },
    unitPrice: '0.48',
    ipCount: 2,
    maintenanceCount: 50,
    teamMembers: 0,
    benefits: starterBenefits,
    priceLabel: '基础版',
    description: '轻量运营',
    tag: '',
  },
  p1000: {
    amount: 1000,
    credits: 1895,
    accountCount: 5,
    videoCount: 172,
    creditsOnly: { credits: 2173, videoCount: 197 },
    unitPrice: '0.46',
    ipCount: 5,
    maintenanceCount: 120,
    teamMembers: 10,
    benefits: standardBenefits,
    priceLabel: '专业版',
    description: '个人运营',
    tag: '',
  },
  p2000: {
    amount: 2000,
    credits: 3945,
    accountCount: 10,
    videoCount: 358,
    creditsOnly: { credits: 4545, videoCount: 413 },
    unitPrice: '0.44',
    ipCount: 10,
    maintenanceCount: 260,
    teamMembers: 20,
    benefits: advancedBenefits,
    priceLabel: '商业版',
    description: '多账号运营',
    tag: '热门推荐',
  },
  p5000: {
    amount: 5000,
    credits: 10095,
    accountCount: 30,
    videoCount: 917,
    creditsOnly: { credits: 11904, videoCount: 1082 },
    unitPrice: '0.42',
    ipCount: 30,
    maintenanceCount: 700,
    teamMembers: 50,
    benefits: advancedBenefits,
    priceLabel: '企业版',
    description: '团队矩阵运营',
    tag: '高性价比',
  },
} as const;
export type RechargePackKey = keyof typeof rechargePacks;
export type RechargeBenefit = { label: string; value: boolean | number | string };
// These benefits describe the purchased package; they do not gate application features.
export function getRechargeBenefits(pack: (typeof rechargePacks)[RechargePackKey]): RechargeBenefit[] {
  return [
    { label: '视频一键发布', value: true },
    { label: '图文一键发布', value: pack.benefits.imagePublishing },
    { label: '视频／图文 BGM', value: pack.benefits.bgm },
    { label: '批量发布', value: pack.benefits.batchPublishing },
    { label: '定时发布', value: pack.benefits.scheduledPublishing },
    { label: '可绑定发布账号数', value: `${pack.accountCount} 个` },
    { label: '可发布平台', value: '全部平台' },
    { label: '快速创作', value: true },
    { label: '智能创作（Agent 多任务并行）', value: true },
    { label: '爆款视频复刻', value: pack.benefits.videoRemake },
    { label: '批量内容生成', value: pack.benefits.batchGeneration },
    { label: '账号数据通解', value: true },
    { label: '发布结果统计', value: true },
    { label: '内容数据分析', value: pack.benefits.contentAnalytics },
    { label: '项目管理（不限项目数）', value: true },
    { label: '产品卡创建', value: true },
    { label: '素材库管理', value: true },
    { label: '团队协作成员', value: pack.teamMembers ? `${pack.teamMembers} 人` : false },
    { label: '团队权限管理', value: pack.benefits.teamPermissions },
  ];
}
function creditPack(key: RechargePackKey) {
  const pack = rechargePacks[key];
  return {
    amount: pack.amount,
    ...pack.creditsOnly,
    accountCount: 0 as const,
    unitPrice: pack.unitPrice,
    priceLabel: pack.priceLabel,
  };
}
export const creditOnlyPacks = {
  credit500: creditPack('p500'),
  credit1000: creditPack('p1000'),
  credit2000: creditPack('p2000'),
  credit5000: creditPack('p5000'),
} as const;
export const accountOnlyPacks = {
  account99: { amount: 99, credits: 0, accountCount: 1, priceLabel: '单号体验' },
  account450: { amount: 450, credits: 0, accountCount: 5, priceLabel: '多号运营' },
  account850: { amount: 850, credits: 0, accountCount: 10, priceLabel: '矩阵运营' },
  account1600: { amount: 1600, credits: 0, accountCount: 20, priceLabel: '规模运营' },
} as const;
export const purchasePacks = { ...rechargePacks, ...creditOnlyPacks, ...accountOnlyPacks } as const;
export type PurchasePackKey = keyof typeof purchasePacks;
export type PurchaseOptions = { includeAccounts?: boolean };
export type PurchaseMode = 'withAccounts' | 'creditsOnly';
export function getPurchaseQuote(pack: PurchasePackKey, options: PurchaseOptions = {}) {
  if (!Object.hasOwn(purchasePacks, pack)) throw new Error('请选择有效套餐');
  const config = purchasePacks[pack];
  const bundle = 'creditsOnly' in config;
  const creditsOnly = bundle && options.includeAccounts === false;
  return {
    amount: config.amount,
    credits: creditsOnly ? config.creditsOnly.credits : config.credits,
    accountCount: creditsOnly ? 0 : config.accountCount,
    videoCount: creditsOnly
      ? config.creditsOnly.videoCount
      : 'videoCount' in config
        ? config.videoCount
        : undefined,
    ...(bundle ? { purchaseMode: (creditsOnly ? 'creditsOnly' : 'withAccounts') as PurchaseMode } : {}),
  };
}
export type RechargeOrder = {
  id: string;
  userId: string;
  pack: PurchasePackKey | 'p490' | 'p50' | 'p100' | 'credit100';
  amount: number;
  credits: number;
  accountCount?: number;
  purchaseMode?: PurchaseMode;
  videoCount?: number;
  deliveryMode?: 'automatic';
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
export const rechargeOrders = computed(() => account.value.orders);
export const rechargeAccountClaims = computed(() => account.value.claims);
// Reload persisted snapshots without settling pending orders or changing balances.
export function refreshRechargeAccount() {
  const owner = userId();
  try {
    const raw = localStorage.getItem(key(owner));
    const value: CreditAccount = raw === null ? initial() : JSON.parse(raw);
    if (
      !value ||
      !Number.isFinite(value.balance) ||
      !Number.isFinite(value.total) ||
      !Array.isArray(value.orders) ||
      !value.orders.every(
        (order) =>
          order &&
          typeof order.id === 'string' &&
          typeof order.userId === 'string' &&
          typeof order.pack === 'string' &&
          Number.isFinite(order.amount) &&
          Number.isFinite(order.credits) &&
          typeof order.createdAt === 'string' &&
          ['pending', 'completed'].includes(order.status),
      ) ||
      (value.claims !== undefined &&
        (!Array.isArray(value.claims) ||
          !value.claims.every((claim) => claim && Array.isArray(claim.accounts))))
    )
      throw new Error();
    account.value = { ...value, claims: value.claims ?? [] };
  } catch {
    throw new Error('订单读取失败，请检查浏览器存储后重试');
  }
}
// Credits-only recharges never change the version; buying a lower tier does not downgrade it.
export const currentPackageKey = computed<RechargePackKey | null>(() => {
  let highest: RechargePackKey | null = null;
  for (const order of account.value.orders) {
    if (order.status !== 'completed') continue;
    const pack = order.pack === 'p490' ? 'p500' : order.pack;
    if (!Object.hasOwn(rechargePacks, pack)) continue;
    const candidate = pack as RechargePackKey;
    if (!highest || rechargePacks[candidate].amount > rechargePacks[highest].amount) highest = candidate;
  }
  return highest;
});
export const currentPackage = computed(() =>
  currentPackageKey.value ? rechargePacks[currentPackageKey.value] : null,
);
export const socialAccountsTotal = computed(() =>
  account.value.orders.reduce(
    (sum, order) => sum + (order.status === 'completed' ? (order.accountCount ?? 0) : 0),
    0,
  ),
);
export const socialAccountsClaimed = computed(() =>
  account.value.claims.reduce((sum, claim) => sum + claim.accounts.length, 0),
);
function remainingLegacyAccounts(value: CreditAccount) {
  const delivered = value.claims.flatMap((claim) => claim.accounts);
  return value.orders.reduce(
    (sum, order) =>
      sum +
      (order.status === 'completed' && order.deliveryMode !== 'automatic'
        ? Math.max(
            0,
            (order.accountCount ?? 0) - delivered.filter((item) => item.orderId === order.id).length,
          )
        : 0),
    0,
  );
}
// Only historical orders expose claimable slots. New orders deliver their accounts at payment.
export const socialAccountsRemaining = computed(() => remainingLegacyAccounts(account.value));
function userId() {
  if (!currentUser.value) throw new Error('请先登录后充值');
  return currentUser.value.id;
}
export function createRechargeOrder(pack: PurchasePackKey, options: PurchaseOptions = {}): RechargeOrder {
  const id = userId();
  const quote = getPurchaseQuote(pack, options);
  const order: RechargeOrder = {
    id: uid(),
    userId: id,
    pack,
    ...quote,
    ...(quote.accountCount > 0 ? { deliveryMode: 'automatic' as const } : {}),
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
  const claims = [...value.claims];
  if (order.deliveryMode === 'automatic' && (order.accountCount ?? 0) > 0) {
    const requestId = `automatic:${order.id}`;
    const used = claims.reduce((sum, claim) => sum + claim.accounts.length, 0);
    const quantity = order.accountCount!;
    claims.push({
      id: requestId,
      userId: id,
      createdAt: completed.completedAt!,
      allocation: { tiktok: quantity, instagram: 0, facebook: 0 },
      items: [{ platform: 'tiktok', countryCode: 'US', quantity }],
      accounts: Array.from({ length: quantity }, (_, index) =>
        createPurchasedAccount(requestId, order.id, 'tiktok', 'US', used + index, `${requestId}:${index}`),
      ),
    });
  }
  save(id, {
    ...value,
    balance: value.balance + order.credits,
    total: value.total + order.credits,
    orders: value.orders.map((item) => (item.id === orderId ? completed : item)),
    claims,
  });
  return completed;
}

function createPurchasedAccount(
  requestId: string,
  orderId: string,
  platform: SocialPlatform,
  countryCode: string,
  index: number,
  deliveryId?: string,
): TKAccount {
  const id = deliveryId ?? uid();
  const username = 'demo_' + platform.slice(0, 2) + '_' + id.replace(/[^a-zA-Z0-9]/g, '').slice(-20);
  const region = countryName(countryCode) + '（演示）';
  const names = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' };
  return {
    id,
    source: 'recharge',
    claimId: requestId,
    orderId,
    platform,
    name: `${names[platform]} 购买账号 ${index + 1}`,
    handle: '@' + username,
    countryCode,
    region,
    groupId: 'ungrouped',
    note: '购买账号 · 所有项目可用',
    status: '已授权',
    authorizedAt: now(),
    loginInfo: {
      username,
      password: 'Demo!' + uid().replaceAll('-', '').slice(0, 14),
      ip: '192.0.2.' + ((index % 254) + 1),
      region,
      mock: true,
    },
  };
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
    .filter((order) => order.status === 'completed' && order.deliveryMode !== 'automatic')
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
  for (const { platform, countryCode, quantity } of items) {
    for (let i = 0; i < quantity; i++) {
      accounts.push(
        createPurchasedAccount(
          requestId,
          slots[accounts.length]!,
          platform,
          countryCode,
          used.length + accounts.length,
        ),
      );
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
