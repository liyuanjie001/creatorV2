import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { currentUser, identityService } from '@/services/identity';
import { feedbackRecords, feedbackReadError, saveFeedback } from '@/services/feedback';
import { notifications, notificationError, markNotificationsRead } from '@/services/notifications';
import { createRechargeOrder, completeRecharge, creditsBalance } from '@/services/credits';
import { completePurchase, PurchaseSyncError } from '@/services/purchasedAccounts';
import { studio } from '@/services/studio';
async function login(id: string) {
  currentUser.value = { id, name: id, identity: `${id}@test.com`, method: 'email', bindings: ['email'] };
  await nextTick();
}
beforeEach(async () => {
  vi.restoreAllMocks();
  currentUser.value = null;
  await nextTick();
  localStorage.clear();
  await login('settings-buyer');
});

test('feedback validates, deduplicates and survives per-user restoration', async () => {
  expect(() => saveFeedback('其他', '太短', '')).toThrow('10—2,000');
  expect(() => saveFeedback('未知', '这是一条需要保存的功能建议', '')).toThrow('问题类型');
  const record = saveFeedback('功能建议', '  希望帮助中心可以添加更多操作示例  ', ' test@example.com ');
  expect(record.description).toBe('希望帮助中心可以添加更多操作示例');
  expect(() => saveFeedback('功能建议', record.description, record.contact)).toThrow('相同反馈');
  await login('other');
  expect(feedbackRecords.value).toHaveLength(0);
  await login('settings-buyer');
  expect(feedbackRecords.value[0]).toEqual(record);
});
test('feedback write failure leaves records unchanged', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(() => saveFeedback('其他', '这是一条有足够长度的问题描述', '')).toThrow('保存失败');
  expect(feedbackRecords.value).toHaveLength(0);
});

test('feedback attachments are snapshots, restore per user and distinguish duplicate reports', async () => {
  const images = [{ name: '截图.png', dataUrl: 'data:image/png;base64,aGVsbG8=' }];
  const record = saveFeedback('其他', '这是一条有截图的问题描述', '', images);
  images[0]!.name = 'changed.png';
  expect(record.images?.[0]?.name).toBe('截图.png');
  expect(() => saveFeedback('其他', record.description, '', record.images)).toThrow('相同反馈');
  const textOnly = saveFeedback('其他', record.description, '');
  expect(textOnly.images).toBeUndefined();
  await login('other');
  expect(feedbackRecords.value).toHaveLength(0);
  await login('settings-buyer');
  expect(feedbackRecords.value).toEqual([textOnly, record]);
});

test('feedback rejects excess, oversized or unsupported attachments without saving', () => {
  const image = { name: '截图.png', dataUrl: 'data:image/png;base64,aGVsbG8=' };
  expect(() => saveFeedback('其他', '这是一条有截图的问题描述', '', Array(4).fill(image))).toThrow(
    '最多添加',
  );
  for (const dataUrl of [
    'https://example.com/image.png',
    'data:image/svg+xml;base64,aGVsbG8=',
    'data:image/png;base64,' + 'a'.repeat(700000),
  ])
    expect(() => saveFeedback('其他', '这是一条有截图的问题描述', '', [{ ...image, dataUrl }])).toThrow(
      '图片无效',
    );
  expect(feedbackRecords.value).toHaveLength(0);
});

test('invalid stored attachment prevents overwriting feedback history', async () => {
  const original = JSON.stringify([
    {
      id: 'old',
      type: '其他',
      description: '原有反馈内容需要保留',
      contact: '',
      createdAt: new Date().toISOString(),
      images: [{ name: 'bad', dataUrl: 'javascript:alert(1)' }],
    },
  ]);
  localStorage.setItem('chuhai-feedback-v1:broken-images', original);
  await login('broken-images');
  expect(feedbackReadError.value).toContain('读取失败');
  expect(feedbackRecords.value).toHaveLength(0);
  expect(localStorage.getItem('chuhai-feedback-v1:broken-images')).toBe(original);
});
test('malformed feedback is shown as empty and preserved instead of overwritten', async () => {
  localStorage.setItem('chuhai-feedback-v1:broken', '{');
  await login('broken');
  expect(feedbackRecords.value).toHaveLength(0);
  expect(feedbackReadError.value).toContain('读取失败');
  expect(() => saveFeedback('其他', '这是一条有足够长度的问题描述', '')).toThrow('读取失败');
  expect(localStorage.getItem('chuhai-feedback-v1:broken')).toBe('{');
});
test('unpaid orders emit nothing, payment and delivery are separate and idempotent', async () => {
  const order = createRechargeOrder('p500');
  await nextTick();
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(0);
  completeRecharge(order.id, 'alipay');
  await nextTick();
  expect(
    notifications.value.filter((item) => item.category === 'purchase').map((item) => item.title),
  ).toEqual(['支付成功']);
  completePurchase(order.id, 'alipay');
  await nextTick();
  completePurchase(order.id, 'wechat');
  await nextTick();
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(2);
  expect(studio.value.accounts).toHaveLength(2);
  expect(creditsBalance.value).toBe(1033);
  markNotificationsRead();
  await login('other');
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(0);
  await login('settings-buyer');
  expect(notifications.value.every((item) => item.read)).toBe(true);
});
test('pure credits orders never emit account delivery', async () => {
  for (const pack of ['credit500', 'p1000'] as const)
    completePurchase(createRechargeOrder(pack, { includeAccounts: false }).id, 'alipay');
  await nextTick();
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(2);
  expect(notifications.value.filter((item) => item.title === '账号已到账')).toHaveLength(0);
});
test('sync failure and recovery produce truthful, deduplicated events', async () => {
  const order = createRechargeOrder('p500');
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'chuhai-studio-v1:settings-buyer') throw new Error('blocked');
    original.call(this, key, value);
  });
  expect(() => completePurchase(order.id, 'alipay')).toThrow(PurchaseSyncError);
  await nextTick();
  expect(notifications.value.some((item) => item.title === '账号同步失败')).toBe(true);
  expect(notifications.value.some((item) => item.title === '账号已到账')).toBe(false);
  vi.restoreAllMocks();
  completePurchase(order.id, 'alipay');
  await nextTick();
  expect(notifications.value.some((item) => item.title === '账号同步已恢复')).toBe(true);
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(4);
  expect(creditsBalance.value).toBe(1033);
});
test('notification write failure never rolls back payment, reconciliation restores messages', async () => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key.startsWith('chuhai-notifications')) throw new Error('blocked');
    original.call(this, key, value);
  });
  const order = completePurchase(createRechargeOrder('p500').id, 'alipay');
  await nextTick();
  expect(order.status).toBe('completed');
  expect(creditsBalance.value).toBe(1033);
  expect(notificationError.value).toContain('保存失败');
  expect(() => markNotificationsRead()).toThrow('保存失败');
  vi.restoreAllMocks();
  await login('other');
  await login('settings-buyer');
  expect(notifications.value.filter((item) => item.category === 'purchase')).toHaveLength(2);
  expect(creditsBalance.value).toBe(1033);
});
test('existing completed orders are first displayed as read', async () => {
  currentUser.value = null;
  await nextTick();
  localStorage.removeItem('chuhai-notifications-v1:settings-buyer');
  localStorage.setItem(
    'chuhai-credits-v1:settings-buyer',
    JSON.stringify({
      balance: 600,
      total: 600,
      claims: [],
      orders: [
        {
          id: 'legacy',
          userId: 'settings-buyer',
          pack: 'p490',
          amount: 490,
          credits: 500,
          accountCount: 2,
          status: 'completed',
          channel: 'alipay',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    }),
  );
  await login('settings-buyer');
  expect(notifications.value.find((item) => item.id === 'legacy:payment')?.read).toBe(true);
  expect(notifications.value.some((item) => item.id === 'legacy:delivery')).toBe(false);
});
test('malformed notification storage stays empty and is not overwritten', async () => {
  localStorage.setItem('chuhai-notifications-v1:broken', '{}');
  await login('broken');
  expect(notifications.value).toEqual([]);
  expect(notificationError.value).toContain('读取失败');
  expect(localStorage.getItem('chuhai-notifications-v1:broken')).toBe('{}');
});
test('nickname validation and demo relogin persistence', async () => {
  identityService.demo();
  await nextTick();
  await expect(identityService.updateName(' ')).rejects.toThrow('1—30');
  await expect(identityService.updateName('x'.repeat(31))).rejects.toThrow('1—30');
  await identityService.updateName('  创作用户  ');
  expect(currentUser.value?.name).toBe('创作用户');
  identityService.logout();
  identityService.demo();
  expect(currentUser.value?.name).toBe('创作用户');
});

test('verification cooldown uses elapsed time rather than interval counts', async () => {
  const { sendCode, codeResendSeconds } = await import('@/services/identity');
  vi.useFakeTimers();
  try {
    sendCode('cooldown-settings@example.com', 'email');
    expect(codeResendSeconds('cooldown-settings@example.com')).toBe(60);
    vi.setSystemTime(Date.now() + 61000);
    expect(codeResendSeconds('cooldown-settings@example.com')).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
