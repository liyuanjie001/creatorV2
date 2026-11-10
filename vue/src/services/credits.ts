import { computed, ref, watch } from 'vue';
import { currentUser } from './identity';
import { now, readJSON, uid, writeJSON } from './storage';

export type PaymentChannel = 'alipay' | 'wechat';
export const rechargePacks = {
  p50: { amount: 50, credits: 100 },
  p100: { amount: 100, credits: 500 },
  p490: { amount: 490, credits: 2500 },
  p1000: { amount: 1000, credits: 5500 },
} as const;
export type RechargePackKey = keyof typeof rechargePacks;
export type RechargeOrder = {
  id: string; userId: string; pack: RechargePackKey; amount: number; credits: number;
  channel: PaymentChannel; status: 'pending' | 'completed'; createdAt: string; completedAt?: string;
};
type CreditAccount = { balance: number; total: number; orders: RechargeOrder[] };
const initial = (): CreditAccount => ({ balance: 100, total: 100, orders: [] });
const key = (userId: string) => `chuhai-credits-v1:${userId}`;
const account = ref<CreditAccount>(initial());
function read(userId: string) { return readJSON<CreditAccount>(key(userId), initial); }
function save(userId: string, value: CreditAccount) {
  if (!writeJSON(key(userId), value)) throw new Error('本地保存失败，请检查浏览器存储后重试');
  if (currentUser.value?.id === userId) account.value = value;
}
watch(() => currentUser.value?.id, userId => {
  account.value = userId ? read(userId) : initial();
  if (userId) writeJSON(key(userId), account.value);
}, { immediate: true });
export const creditsBalance = computed(() => account.value.balance);
export const creditsTotal = computed(() => account.value.total);
function userId() {
  if (!currentUser.value) throw new Error('请先登录后充值');
  return currentUser.value.id;
}
export function createRechargeOrder(pack: RechargePackKey): RechargeOrder {
  const id = userId();
  const order: RechargeOrder = { id: uid(), userId: id, pack, ...rechargePacks[pack], channel: 'alipay', status: 'pending', createdAt: now() };
  const value = read(id);
  save(id, { ...value, orders: [...value.orders, order] });
  return order;
}
export function completeRecharge(orderId: string, channel: PaymentChannel): RechargeOrder {
  const id = userId();
  const value = read(id);
  const order = value.orders.find(item => item.id === orderId);
  if (!order) throw new Error('充值订单不存在，请重新选择档位');
  if (order.status === 'completed') return order;
  const completed: RechargeOrder = { ...order, channel, status: 'completed', completedAt: now() };
  save(id, { balance: value.balance + order.credits, total: value.total + order.credits,
    orders: value.orders.map(item => item.id === orderId ? completed : item) });
  return completed;
}
