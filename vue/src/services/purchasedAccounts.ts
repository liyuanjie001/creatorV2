import { reserveSocialAccounts, recoverPurchasedAccounts, type AccountClaimInput } from './credits';
import { studio } from './studio';
import { currentUser } from './identity';
import { writeJSON } from './storage';
import type { StudioState } from '@/types/studio';
export function claimSocialAccounts(requestId: string, input: AccountClaimInput) {
  const claim = reserveSocialAccounts(requestId, input);
  const owner = currentUser.value!.id;
  const next = JSON.parse(JSON.stringify(studio.value)) as StudioState;
  recoverPurchasedAccounts(next, owner);
  if (!writeJSON('chuhai-studio-v1:' + owner, next))
    throw new Error('领取记录已保存，帐号交付暂未完成，请重试或刷新恢复');
  studio.value = next;
  return claim;
}
