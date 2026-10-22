export const ACCESS_STORAGE_KEY = 'chuhai-access-token';

export function unlockDestination(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  const path = value.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, '');
  return path === '/unlock' ? '/' : value;
}

export function createAccessGate(
  expectedHash = __ACCESS_PASSWORD_HASH__,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  let sessionUnlocked = false;
  function isUnlocked(): boolean {
    if (!expectedHash) return false;
    if (sessionUnlocked) return true;
    try {
      return (storage ?? localStorage).getItem(ACCESS_STORAGE_KEY) === expectedHash;
    } catch {
      return false;
    }
  }
  async function unlock(password: string): Promise<boolean> {
    if (!expectedHash || !password) return false;
    const digest = sha256(new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== expectedHash) return false;
    try {
      (storage ?? localStorage).setItem(ACCESS_STORAGE_KEY, hash);
    } catch {
      sessionUnlocked = true;
    }
    return true;
  }
  return { isConfigured: Boolean(expectedHash), isUnlocked, unlock };
}

export const accessGate = createAccessGate();
import { sha256 } from '@noble/hashes/sha2.js';
