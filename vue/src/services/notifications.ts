import { computed, ref, watch } from 'vue';
import { currentUser } from './identity';
import { rechargeOrders, type RechargeOrder } from './credits';
import { studio } from './studio';
import { now, writeJSON } from './storage';

export type Notification = {
  id: string;
  category: 'system' | 'purchase';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  action?: '/accounts' | '/me';
  actionLabel?: string;
};
export const notifications = ref<Notification[]>([]);
export const notificationError = ref('');
export const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);
let owner = '';
let blocked = false;
const key = (id: string) => `chuhai-notifications-v1:${id}`;
function persist(next: Notification[], strict = false) {
  if (!owner || blocked || !writeJSON(key(owner), next)) {
    notificationError.value = '消息保存失败，请恢复浏览器存储后重试；支付结果不受影响。';
    if (strict) throw new Error(notificationError.value);
    return;
  }
  notifications.value = next;
  notificationError.value = '';
}
function append(item: Notification) {
  if (notifications.value.some((existing) => existing.id === item.id)) return;
  persist([item, ...notifications.value]);
}
export function recordSyncFailure(order: RechargeOrder) {
  append({
    id: `${order.id}:sync-failed`,
    category: 'purchase',
    title: '账号同步失败',
    body: `订单 ${order.id} 支付已完成，账号同步失败。请返回支付弹窗重试，或刷新页面恢复，勿重复充值。`,
    createdAt: now(),
    read: false,
    action: '/accounts',
    actionLabel: '查看账号',
  });
}
function reconcile(historical = false) {
  if (!owner || owner !== currentUser.value?.id || blocked) return;
  for (const order of rechargeOrders.value) {
    if (order.status !== 'completed') continue;
    const createdAt = order.completedAt ?? order.createdAt;
    append({
      id: `${order.id}:payment`,
      category: 'purchase',
      title: '支付成功',
      body: `订单 ${order.id} 已支付 ¥${order.amount.toLocaleString()}，${order.credits.toLocaleString()} 积分已到账。`,
      createdAt,
      read: historical,
      action: '/me',
      actionLabel: '查看权益',
    });
    if (order.deliveryMode !== 'automatic' || !order.accountCount) continue;
    const delivered =
      studio.value.accounts.filter((account) => account.orderId === order.id).length >= order.accountCount;
    if (!delivered) continue;
    append({
      id: `${order.id}:delivery`,
      category: 'purchase',
      title: '账号已到账',
      body: `订单 ${order.id} 的 ${order.accountCount} 个美国 TikTok 账号使用权已添加至账号管理。`,
      createdAt,
      read: historical,
      action: '/accounts',
      actionLabel: '查看账号',
    });
    if (notifications.value.some((item) => item.id === `${order.id}:sync-failed`))
      append({
        id: `${order.id}:sync-recovered`,
        category: 'purchase',
        title: '账号同步已恢复',
        body: `订单 ${order.id} 的账号同步已完成，可前往账号管理查看。`,
        createdAt: now(),
        read: false,
        action: '/accounts',
        actionLabel: '查看账号',
      });
  }
}
watch(
  () => currentUser.value?.id,
  (id) => {
    owner = id ?? '';
    notifications.value = [];
    notificationError.value = '';
    blocked = false;
    if (!id) return;
    let firstVisit = false;
    try {
      const raw = localStorage.getItem(key(id));
      firstVisit = raw === null;
      const saved: unknown = JSON.parse(raw ?? '[]');
      if (
        !Array.isArray(saved) ||
        !saved.every(
          (item) =>
            typeof item?.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.body === 'string' &&
            typeof item.createdAt === 'string' &&
            typeof item.read === 'boolean' &&
            ['system', 'purchase'].includes(item.category),
        )
      )
        throw new Error();
      notifications.value = saved;
    } catch {
      blocked = true;
      notificationError.value = '消息读取失败，请恢复浏览器存储后刷新。';
      return;
    }
    append({
      id: 'system:guide',
      category: 'system',
      title: '欢迎使用设置中心',
      body: '在我的权益中查看套餐和剩余积分，在账号中心管理个人资料。当前为本地演示环境，反馈仅保存在本机，尚未发送客服。',
      createdAt: now(),
      read: false,
    });
    reconcile(firstVisit);
  },
  { immediate: true, flush: 'post' },
);
watch([rechargeOrders, () => studio.value.accounts], () => reconcile(), { deep: true, flush: 'post' });

export function markNotificationsRead(id?: string) {
  if (!currentUser.value || owner !== currentUser.value.id) throw new Error('请先登录');
  persist(
    notifications.value.map((item) => (!id || item.id === id ? { ...item, read: true } : item)),
    true,
  );
}
