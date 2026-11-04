import { ref } from 'vue';
import { sha256 } from '@noble/hashes/sha2.js';
import type { AuthUser } from '@/types/studio';
import { readJSON, writeJSON, uid } from './storage';
import { saveMedia, getMedia } from './media';
const SESSION = 'chuhai-studio-session';
const initial = readJSON<AuthUser | null>(SESSION, () => null);
export const currentUser = ref<AuthUser | null>(initial && typeof initial.id === 'string' ? initial : null);
type Credential = { user: AuthUser; salt: string; digest: string };
// Prototype credentials use IndexedDB rather than localStorage. No plaintext password is retained.
async function records(): Promise<Credential[]> {
  const pointer = readJSON<string>('chuhai-credential-pointer', () => '');
  if (!pointer) return [];
  const blob = await getMedia('identity', pointer); return blob ? JSON.parse(await blob.text()) : [];
}
async function persist(list: Credential[]) {
  const id = await saveMedia('identity', new File([JSON.stringify(list)], 'credentials.json', { type: 'application/json' }));
  if (!writeJSON('chuhai-credential-pointer', id)) throw new Error('浏览器存储不可用，无法保存注册信息');
}
function digest(password: string, salt: string) { return Array.from(sha256(new TextEncoder().encode(salt + password)), b => b.toString(16).padStart(2, '0')).join(''); }
function session(user: AuthUser) { currentUser.value = user; writeJSON(SESSION, user); return user; }
const challenges = new Map<string, { code: string; expires: number; sentAt: number }>();
export const DEMO_CODE = '123456';
export function validateIdentity(identity: string, method: string) {
  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)) throw new Error('请输入有效邮箱');
  if (method === 'phone' && !/^\+\d{7,15}$/.test(identity)) throw new Error('请输入含国家区号的有效手机号');
}
export function sendCode(identity: string, method: string) {
  validateIdentity(identity, method); const last = challenges.get(identity);
  if (last && Date.now() - last.sentAt < 60000) throw new Error('请在倒计时结束后重发');
  challenges.set(identity, { code: DEMO_CODE, expires: Date.now() + 300000, sentAt: Date.now() });
}
function verifyCode(identity: string, code: string) {
  const challenge = challenges.get(identity);
  if (!challenge || challenge.code !== code || challenge.expires < Date.now()) throw new Error('验证码不正确或已过期，请先发送验证码');
}
export const identityService = {
  async register(identity: string, method: 'email' | 'phone', password: string, code: string, invite: string) {
    validateIdentity(identity, method); verifyCode(identity, code);
    if (password.length < 8) throw new Error('密码至少 8 位');
    if (invite && invite !== 'CHUHAI2026') throw new Error('邀请码无效；演示邀请码为 CHUHAI2026，也可留空');
    const list = await records(); if (list.some(x => x.user.identity === identity)) throw new Error('该帐号已注册，请登录');
    const salt = uid(); const user: AuthUser = { id: uid(), name: identity.split('@')[0]!, identity, method, bindings: [method] };
    await persist([...list, { user, salt, digest: digest(password, salt) }]); challenges.delete(identity); return session(user);
  },
  async login(identity: string, password: string, code?: string) {
    const list = await records(); const entry = list.find(x => x.user.identity === identity);
    if (code !== undefined) verifyCode(identity, code);
    if (!entry || (code === undefined && entry.digest !== digest(password, entry.salt))) throw new Error('帐号或密码不正确');
    challenges.delete(identity); return session(entry.user);
  },
  async reset(identity: string, code: string, password: string) {
    verifyCode(identity, code); if (password.length < 8) throw new Error('密码至少 8 位');
    const list = await records(); const entry = list.find(x => x.user.identity === identity); if (!entry) throw new Error('帐号不存在');
    entry.salt = uid(); entry.digest = digest(password, entry.salt); await persist(list); challenges.delete(identity);
  },
  async google(email: string, password = '') {
    validateIdentity(email, 'email'); const list = await records(); const entry = list.find(x => x.user.identity === email);
    if (entry && !entry.user.bindings.includes('google')) {
      if (!password || entry.digest !== digest(password, entry.salt)) throw new Error('该邮箱已有帐号，请验证原帐号密码后绑定 Google');
      entry.user.bindings.push('google'); await persist(list);
    }
    if (entry) return session(entry.user);
    const user: AuthUser = { id: uid(), name: email.split('@')[0]!, identity: email, method: 'google', bindings: ['google'] };
    await persist([...list, { user, salt: uid(), digest: '' }]); return session(user);
  },
  async googleQuick() {
    const email = 'roxy.google@chuhai.studio';
    const list = await records();
    const entry = list.find(x => x.user.identity === email);
    if (entry) return session(entry.user);
    const user: AuthUser = { id: uid(), name: 'Google 用户', identity: email, method: 'google', bindings: ['google'] };
    await persist([...list, { user, salt: uid(), digest: '' }]);
    return session(user);
  },
  demo() { return session({ id: 'demo', name: '林悦', identity: 'demo@chuhai.studio', method: 'email', bindings: ['email'] }); },
  async updateName(name: string) {
    const user = currentUser.value; if (!user || !name.trim()) throw new Error('请填写名称');
    if (user.id !== 'demo') { const list = await records(); const entry = list.find(x => x.user.id === user.id); if (entry) { entry.user.name = name.trim(); await persist(list); } }
    session({ ...user, name: name.trim() });
  },
  logout() { currentUser.value = null; try { localStorage.removeItem(SESSION); } catch { /* session cleared */ } },
};
