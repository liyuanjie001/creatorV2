import {
  completeRecharge,
  reserveSocialAccounts,
  recoverPurchasedAccounts,
  type AccountClaimInput,
  type PaymentChannel,
  type RechargeOrder,
} from './credits';
import { studio } from './studio';
import { currentUser } from './identity';
import { writeJSON } from './storage';
import type { StudioState } from '@/types/studio';
import { recordSyncFailure } from './notifications';
function syncPurchasedAccounts(message: string) {
  const owner = currentUser.value!.id;
  const next = JSON.parse(JSON.stringify(studio.value)) as StudioState;
  if (!recoverPurchasedAccounts(next, owner)) return;
  if (!writeJSON('chuhai-studio-v1:' + owner, next)) throw new Error(message);
  studio.value = next;
}

export class PurchaseSyncError extends Error {
  constructor(public readonly order: RechargeOrder) {
    super('支付已完成，账号同步失败，请重试或刷新恢复');
    this.name = 'PurchaseSyncError';
  }
}

export function completePurchase(orderId: string, channel: PaymentChannel): RechargeOrder {
  const order = completeRecharge(orderId, channel);
  if (order.deliveryMode === 'automatic' && (order.accountCount ?? 0) > 0) {
    try {
      syncPurchasedAccounts('支付已完成，账号同步失败，请重试或刷新恢复');
    } catch {
      recordSyncFailure(order);
      throw new PurchaseSyncError(order);
    }
  }
  return order;
}

export function claimSocialAccounts(requestId: string, input: AccountClaimInput) {
  const claim = reserveSocialAccounts(requestId, input);
  syncPurchasedAccounts('领取记录已保存，帐号交付暂未完成，请重试或刷新恢复');
  return claim;
}
