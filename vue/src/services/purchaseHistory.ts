import { computed } from 'vue';
import { currentUser } from './identity';
import {
  rechargeOrders,
  rechargeAccountClaims,
  accountCoupons,
  purchasePacks,
  rechargePacks,
  subscriptionEditions,
  subscriptionPeriods,
  type RechargeOrder,
  type PurchasePackKey,
} from './credits';
import { studio } from './studio';

export function purchaseName(order: RechargeOrder) {
  if (order.subscription && Object.hasOwn(rechargePacks, order.pack))
    return `${subscriptionEditions[order.subscription.edition]} · ${rechargePacks[order.pack as keyof typeof rechargePacks].priceLabel} · ${subscriptionPeriods[order.subscription.period]}`;
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
      const coupon = accountCoupons.value.find(item => item.orderId === order.id);
      const couponDelivered = coupon?.redemption.status === 'delivered' && coupon.redemption.accountIds.every(id => studio.value.accounts.some(item => item.id === id));
      const automatic = order.deliveryMode === 'automatic';
      const delivered = automatic
        ? studio.value.accounts.filter((account) => account.orderId === order.id).length
        : rechargeAccountClaims.value
            .filter((claim) => claim.userId === order.userId)
            .flatMap((claim) => claim.accounts)
            .filter((account) => account.orderId === order.id).length;
      const pendingSync = order.status === 'completed' && ((automatic && quantity > delivered) || (coupon?.redemption.status === 'delivered' && !couponDelivered));
      const accountStatus = order.deliveryMode === 'coupon'
        ? order.status === 'pending' ? '付款后自动兑换' : couponDelivered ? '已添加至账号管理' : pendingSync ? '待同步至账号管理' : '已自动兑换，3 个工作日内到账'
        : !quantity
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
        accountSummary: order.deliveryMode === 'coupon' ? `赠送账号抵扣券 1 张（可兑换 ${quantity} 个账号）` : `账号使用权 ${quantity} 个`,
        statusLabel: order.status === 'pending' ? '待支付' : order.deliveryMode === 'coupon' && !couponDelivered ? '待到账' : pendingSync ? '已支付' : '已到账',
        paymentLabel:
          order.status === 'pending' ? '尚未支付' : order.channel === 'wechat' ? '微信支付' : '支付宝',
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)),
);
