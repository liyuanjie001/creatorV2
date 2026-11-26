import type { AuthUser } from '@/types/studio';
import { now, uid, writeJSON, type StorageUpdate } from './storage';

const KEY = 'chuhai-invitations-v1';
type InvitationRegistration = { userId: string; inviterId: string; name: string; registeredAt: string };
type InvitationRegistry = { codes: Record<string, string>; registrations: InvitationRegistration[] };

function read(): InvitationRegistry {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { codes: {}, registrations: [] };
    const value: InvitationRegistry = JSON.parse(raw);
    if (
      !value ||
      !value.codes ||
      typeof value.codes !== 'object' ||
      Array.isArray(value.codes) ||
      !Object.values(value.codes).every(
        (id) => typeof id === 'string' && id !== 'demo' && !id.startsWith('team:'),
      ) ||
      !Array.isArray(value.registrations) ||
      !value.registrations.every(
        (item) =>
          item &&
          typeof item.userId === 'string' &&
          typeof item.inviterId === 'string' &&
          item.userId !== item.inviterId &&
          typeof item.name === 'string' &&
          typeof item.registeredAt === 'string',
      )
    )
      throw new Error('invalid');
    return value;
  } catch {
    throw new Error('邀请记录读取失败，请检查浏览器存储后重试');
  }
}

export function canPromote(user: AuthUser | null): user is AuthUser {
  return !!user && user.id !== 'demo' && !user.teamOwnerId && !user.id.startsWith('team:');
}

export function newAccountRewards(invite = ''): Pick<AuthUser, 'checkInCampaign' | 'referrerId'> {
  const code = invite.trim().toUpperCase();
  if (!code || code === 'CHUHAI2026') return { checkInCampaign: 1 };
  const registry = read();
  const inviterId = Object.hasOwn(registry.codes, code) ? registry.codes[code] : undefined;
  if (!inviterId) throw new Error('邀请码无效，请检查后重试或留空');
  return { checkInCampaign: 1, referrerId: inviterId };
}

// The credential carries immutable attribution. Session creation retries this index
// after a failed localStorage write without losing a successfully saved credential.
export function invitationRegistrationUpdates(user: AuthUser): StorageUpdate[] {
  if (!canPromote(user) || !user.referrerId) return [];
  if (user.referrerId === user.id || user.referrerId === 'demo' || user.referrerId.startsWith('team:'))
    throw new Error('邀请关系无效');
  const registry = read();
  const existing = registry.registrations.find((item) => item.userId === user.id);
  if (existing) {
    if (existing.inviterId !== user.referrerId) throw new Error('邀请关系已绑定，不能修改');
    return [];
  }
  return [
    {
      key: KEY,
      value: {
        ...registry,
        registrations: [
          ...registry.registrations,
          {
            userId: user.id,
            inviterId: user.referrerId,
            name: user.name,
            registeredAt: now(),
          },
        ],
      },
    },
  ];
}

export function getInvitationCode(user: AuthUser): string {
  if (!canPromote(user)) throw new Error('请使用个人账号参加推广计划');
  const registry = read();
  const existing = Object.entries(registry.codes).find(([, owner]) => owner === user.id)?.[0];
  if (existing) return existing;
  let code: string;
  do {
    code = `RX${uid().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  } while (Object.hasOwn(registry.codes, code));
  if (!writeJSON(KEY, { ...registry, codes: { ...registry.codes, [code]: user.id } }))
    throw new Error('邀请码保存失败，请检查浏览器存储后重试');
  return code;
}

export function getInvitedUsers(userId: string): InvitationRegistration[] {
  return read().registrations.filter((item) => item.inviterId === userId);
}

export function getRegisteredInviter(user: AuthUser): string | undefined {
  if (!canPromote(user) || !user.referrerId || user.referrerId === user.id) return;
  const relation = read().registrations.find((item) => item.userId === user.id);
  return relation?.inviterId === user.referrerId ? relation.inviterId : undefined;
}

export function invitationUrl(code: string, base = window.location.href): string {
  const url = new URL(base);
  url.search = '';
  url.hash = `/auth?${new URLSearchParams({ mode: 'register', invite: code })}`;
  return url.toString();
}
