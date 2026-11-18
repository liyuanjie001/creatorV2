import { computed } from 'vue';
import { currentUser } from './identity';
import {
  rechargeOrders,
  rechargeAccountClaims,
  purchasePacks,
  rechargePacks,
  type RechargeOrder,
  type PurchasePackKey,
} from './credits';
import { studio } from './studio';

export function purchaseName(order: RechargeOrder) {
  if (order.pack === 'p490') return '基础版（历史套餐）';
  if (!Object.hasOwn(purchasePacks, order.pack)) return '历史积分充值';
  const pack = purchasePacks[order.pack as PurchasePackKey];
  if (Object.hasOwn(rechargePacks, order.pack)) return `${pack.priceLabel}套餐`;
  return order.accountCount && !order.credits ? '账号使用权购买' : '积分充值';
}

export const purchaseHistory = computed(() =>
  rechargeOrders.value
    .filter((order) => order.userId === currentUser.value?.id)
    .map((order) => {
      const quantity = order.accountCount ?? 0;
      const automatic = order.deliveryMode === 'automatic';
      const delivered = automatic
        ? studio.value.accounts.filter((account) => account.orderId === order.id).length
        : rechargeAccountClaims.value
            .filter((claim) => claim.userId === order.userId)
            .flatMap((claim) => claim.accounts)
            .filter((account) => account.orderId === order.id).length;
      const pendingSync = order.status === 'completed' && automatic && quantity > delivered;
      const accountStatus = !quantity
        ? ''
        : order.status === 'pending'
          ? '付款后到账'
          : automatic
            ? pendingSync
              ? '待同步至账号管理'
              : '已添加至账号管理'
            : delivered >= quantity
              ? '历史账号已领取'
              : `历史待领取 ${quantity - delivered} 个`;
      return {
        ...order,
        name: purchaseName(order),
        accountStatus,
        pendingSync,
        statusLabel: order.status === 'pending' ? '待支付' : pendingSync ? '已支付' : '已到账',
        paymentLabel:
          order.status === 'pending' ? '尚未支付' : order.channel === 'wechat' ? '微信支付' : '支付宝',
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)),
);
