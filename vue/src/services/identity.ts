import { ref, watch } from 'vue';
import { sha256 } from '@noble/hashes/sha2.js';
import type { AuthUser } from '@/types/studio';
import { readJSON, writeJSON, writeJSONBatch, uid, type StorageUpdate } from './storage';
import { saveMedia, getMedia } from './media';
import { guideTour } from './guideTour';
import { invitationRegistrationUpdates, newAccountRewards } from './invitations';
const SESSION = 'chuhai-studio-session';
const TEAM_CREDENTIALS = (ownerId: string) => `chuhai-team-credentials-v1:${ownerId}`;
const TEAM_INDEX = 'chuhai-team-credential-index-v1';
const initial = readJSON<AuthUser | null>(SESSION, () => null);
export const currentUser = ref<AuthUser | null>(initial && typeof initial.id === 'string' ? initial : null);
type OwnerProfile = Pick<AuthUser, 'id' | 'name' | 'identity'>;
const ownerProfileKey = (id: string) => `chuhai-owner-profile-v1:${id}`;
export const workspaceOwnerProfile = ref<OwnerProfile | null>(null);
watch(currentUser, async user => {
  const ownerId = user?.teamOwnerId ?? user?.id;
  if (!user || !ownerId) { workspaceOwnerProfile.value = null; return; }
  if (!user.teamOwnerId) {
    const profile = { id: user.id, name: user.name, identity: user.identity };
    workspaceOwnerProfile.value = profile;
    writeJSON(ownerProfileKey(ownerId), profile);
    return;
  }
  const cached = readJSON<OwnerProfile | null>(ownerProfileKey(ownerId), () => null);
  workspaceOwnerProfile.value = cached?.id === ownerId ? cached : null;
  if (workspaceOwnerProfile.value) return;
  try {
    const owner = (await records()).find(item => item.user.id === ownerId)?.user;
    const profile = owner ? { id: owner.id, name: owner.name, identity: owner.identity } :
      ownerId === 'demo' ? { id: 'demo', name: readJSON<string>('chuhai-demo-name', () => '林悦'), identity: 'demo@chuhai.studio' } : null;
    if ((currentUser.value?.teamOwnerId ?? currentUser.value?.id) !== ownerId) return;
    workspaceOwnerProfile.value = profile;
    if (profile) writeJSON(ownerProfileKey(ownerId), profile);
  } catch { /* The table shows unavailable fields when historical owner data cannot be read. */ }
}, { immediate: true, flush: 'sync' });
type Credential = { user: AuthUser; salt: string; digest: string };
type TeamCredential = Credential & { memberId: string; ownerId: string; active: boolean };
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
function session(user: AuthUser) {
  const updates = invitationRegistrationUpdates(user);
  if (updates.length) writeJSONBatch([...updates, { key: SESSION, value: user }]);
  else if (!writeJSON(SESSION, user)) throw new Error('本地保存失败，请恢复浏览器存储后重试');
  currentUser.value = user;
  return user;
}
function teamIndex() {
  return readJSON<Record<string, { ownerId: string; memberId: string }>>(TEAM_INDEX, () => ({}));
}
function saveTeamIndex(value: Record<string, { ownerId: string; memberId: string }>) {
  if (!writeJSON(TEAM_INDEX, value)) throw new Error('本地保存失败，请重试');
}
function teamCredentials(ownerId: string) {
  return readJSON<TeamCredential[]>(TEAM_CREDENTIALS(ownerId), () => []);
}
function saveTeamCredentials(ownerId: string, value: TeamCredential[]) {
  if (!writeJSON(TEAM_CREDENTIALS(ownerId), value)) throw new Error('成员账号保存失败，请检查浏览器存储');
}
function validateTeamIdentity(identity: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)) return;
  if (/^\+\d{7,15}$/.test(identity)) return;
  if (/^[a-zA-Z0-9._-]{3,30}$/.test(identity)) return;
  throw new Error('账号名需为 3—30 位字母、数字、点、下划线或连字符，也可使用邮箱或含区号手机号');
}
const challenges = new Map<string, { code: string; expires: number; sentAt: number }>();
export const DEMO_CODE = '123456';
export function codeResendSeconds(identity: string) {
  const challenge = challenges.get(identity);
  return challenge ? Math.max(0, Math.ceil((challenge.sentAt + 60000 - Date.now()) / 1000)) : 0;
}
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
    const list = await records(); if (list.some(x => x.user.identity === identity)) throw new Error('该帐号已注册，请登录');
    const salt = uid(); const user: AuthUser = { id: uid(), name: identity.split('@')[0]!, identity, method, bindings: [method], ...newAccountRewards(invite) };
    await persist([...list, { user, salt, digest: digest(password, salt) }]); challenges.delete(identity); guideTour.enroll(user.id); return session(user);
  },
  async login(identity: string, password: string, code?: string) {
    const list = await records(); const entry = list.find(x => x.user.identity === identity);
    if (code !== undefined) verifyCode(identity, code);
    if (!entry && code === undefined) {
      const linked = teamIndex()[identity];
      const member = linked && teamCredentials(linked.ownerId).find(x => x.memberId === linked.memberId && x.user.identity === identity);
      const workspace = linked && readJSON<{ members?: { id: string; active: boolean }[] }>(`chuhai-team-v1:${linked.ownerId}`, () => ({}));
      const active = workspace?.members?.some(value => value.id === linked?.memberId && value.active);
      if (member && member.active && active && member.digest === digest(password, member.salt)) {
        return session(member.user);
      }
    }
    if (!entry || (code === undefined && entry.digest !== digest(password, entry.salt))) throw new Error('帐号或密码不正确');
    challenges.delete(identity); return session(entry.user);
  },
  async reset(identity: string, code: string, password: string) {
    verifyCode(identity, code); if (password.length < 8) throw new Error('密码至少 8 位');
    const list = await records(); const entry = list.find(x => x.user.identity === identity); if (!entry) throw new Error('帐号不存在');
    entry.salt = uid(); entry.digest = digest(password, entry.salt); await persist(list); challenges.delete(identity);
  },
  async google(email: string, password = '', invite = '') {
    validateIdentity(email, 'email'); const list = await records(); const entry = list.find(x => x.user.identity === email);
    if (entry && !entry.user.bindings.includes('google')) {
      if (!password || entry.digest !== digest(password, entry.salt)) throw new Error('该邮箱已有帐号，请验证原帐号密码后绑定 Google');
      entry.user.bindings.push('google'); await persist(list);
    }
    if (entry) return session(entry.user);
    const user: AuthUser = { id: uid(), name: email.split('@')[0]!, identity: email, method: 'google', bindings: ['google'], ...newAccountRewards(invite) };
    await persist([...list, { user, salt: uid(), digest: '' }]); guideTour.enroll(user.id); return session(user);
  },
  async googleQuick(invite = '') {
    const email = 'roxy.google@chuhai.studio';
    const list = await records();
    const entry = list.find(x => x.user.identity === email);
    if (entry) return session(entry.user);
    const user: AuthUser = { id: uid(), name: 'Google 用户', identity: email, method: 'google', bindings: ['google'], ...newAccountRewards(invite) };
    await persist([...list, { user, salt: uid(), digest: '' }]);
    guideTour.enroll(user.id);
    return session(user);
  },
  demo() {
    const saved = readJSON<string>('chuhai-demo-name', () => '林悦');
    return session({ id: 'demo', name: typeof saved === 'string' && saved.trim() ? saved : '林悦', identity: 'demo@chuhai.studio', method: 'email', bindings: ['email'] });
  },
  async newUser(invite = '') {
    const list = await records();
    const id = uid();
    const user: AuthUser = { id, name: '新用户', identity: `new-${id}@chuhai.studio`, method: 'email', bindings: ['email'], ...newAccountRewards(invite) };
    const salt = uid();
    await persist([...list, { user, salt, digest: digest(uid(), salt) }]);
    guideTour.enroll(user.id);
    return session(user);
  },
  async createTeamMembers(ownerId: string, inputs: { memberId: string; name: string; identity: string; password: string; role: 'admin' | 'creator' }[]) {
    const credentials = teamCredentials(ownerId);
    const index = teamIndex();
    const primaryCredentials = await records();
    const seen = new Set<string>();
    for (const input of inputs) {
      validateTeamIdentity(input.identity);
      if (input.password.length < 8) throw new Error('密码至少 8 位');
      const identity = input.identity.toLowerCase();
      if (seen.has(identity) || index[identity] || primaryCredentials.some(item => item.user.identity.toLowerCase() === identity))
        throw new Error('该成员账号已存在或重复');
      seen.add(identity);
    }
    const users = inputs.map(input => ({
      id: `team:${ownerId}:${input.memberId}`, name: input.name.trim(), identity: input.identity.toLowerCase(),
      method: input.identity.startsWith('+') ? 'phone' as const : 'email' as const, bindings: ['team'],
      teamOwnerId: ownerId, teamMemberId: input.memberId, teamRole: input.role,
    } satisfies AuthUser));
    const recordsToSave = inputs.map((input, i) => {
      const salt = uid();
      return { memberId: input.memberId, ownerId, active: true, user: users[i]!, salt, digest: digest(input.password, salt) };
    });
    const nextCredentials = [...credentials, ...recordsToSave];
    const nextIndex = { ...index };
    for (const item of recordsToSave) nextIndex[item.user.identity] = { ownerId, memberId: item.memberId };
    saveTeamCredentials(ownerId, nextCredentials);
    try { saveTeamIndex(nextIndex); }
    catch (error) { saveTeamCredentials(ownerId, credentials); throw error; }
    return users;
  },
  async updateTeamMember(ownerId: string, memberId: string, changes: { name?: string; identity?: string; password?: string; role?: 'admin' | 'creator' }, updates: StorageUpdate[] = []) {
    const primaryCredentials = await records();
    const credentials = teamCredentials(ownerId);
    const item = credentials.find(value => value.memberId === memberId);
    if (!item) throw new Error('成员账号不存在');
    const nextIdentity = (changes.identity?.trim() || item.user.identity).toLowerCase();
    validateTeamIdentity(nextIdentity);
    if (workspaceOwnerProfile.value?.identity.toLowerCase() === nextIdentity) throw new Error('该账号名已被所有者使用');
    if (primaryCredentials.some(value => value.user.identity.toLowerCase() === nextIdentity)) throw new Error('该账号名已被使用');
    const index = teamIndex();
    if (credentials.some(value => value.memberId !== memberId && value.user.identity.toLowerCase() === nextIdentity) || (index[nextIdentity] && (index[nextIdentity].memberId !== memberId || index[nextIdentity].ownerId !== ownerId))) throw new Error('该成员账号已存在');
    delete index[item.user.identity]; index[nextIdentity] = { ownerId, memberId };
    item.user = { ...item.user, name: changes.name?.trim() || item.user.name, identity: nextIdentity, method: nextIdentity.startsWith('+') ? 'phone' : 'email', teamRole: changes.role ?? item.user.teamRole };
    if (changes.password) { if (changes.password.length < 8) throw new Error('密码至少 8 位'); item.salt = uid(); item.digest = digest(changes.password, item.salt); }
    writeJSONBatch([
      { key: TEAM_CREDENTIALS(ownerId), value: credentials },
      { key: TEAM_INDEX, value: index },
      ...updates,
      ...(currentUser.value?.teamOwnerId === ownerId && currentUser.value.teamMemberId === memberId ? [{ key: SESSION, value: item.user }] : []),
    ]);
    if (currentUser.value?.teamOwnerId === ownerId && currentUser.value.teamMemberId === memberId) currentUser.value = item.user;
    return item.user;
  },
  disableTeamMember(ownerId: string, memberId: string, updates: StorageUpdate[] = []) {
    const credentials = teamCredentials(ownerId);
    const item = credentials.find(value => value.memberId === memberId);
    const index = teamIndex();
    if (item) { item.active = false; delete index[item.user.identity]; }
    writeJSONBatch([
      { key: TEAM_CREDENTIALS(ownerId), value: credentials },
      { key: TEAM_INDEX, value: index },
      ...updates,
    ]);
  },
  async updateName(name: string) {
    const user = currentUser.value; if (!user || !name.trim() || name.trim().length > 30) throw new Error('昵称需为 1—30 个字符');
    if (user.id === 'demo' && !writeJSON('chuhai-demo-name', name.trim())) throw new Error('本地保存失败，请重试');
    if (user.id !== 'demo') { const list = await records(); const entry = list.find(x => x.user.id === user.id); if (entry) { entry.user.name = name.trim(); await persist(list); } }
    session({ ...user, name: name.trim() });
  },
  logout() { currentUser.value = null; try { localStorage.removeItem(SESSION); } catch { /* session cleared */ } },
};
