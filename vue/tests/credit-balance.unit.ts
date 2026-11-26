import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import CreditBalance from '@/layout/CreditBalance.vue';
import { creditsBalance } from '@/services/credits';
import { currentUser } from '@/services/identity';
import { animateCreditClaim, prefersReducedMotion } from '@/lib/animateCreditClaim';
import { toast } from 'vue-sonner';

vi.mock('@/services/credits', async () => {
  const { ref } = await import('vue');
  return { creditsBalance: ref(50) };
});
vi.mock('@/services/identity', async () => {
  const { ref } = await import('vue');
  return { currentUser: ref({ id: 'first' }) };
});
vi.mock('@/lib/animateCreditClaim', () => ({
  animateCreditClaim: vi.fn(),
  prefersReducedMotion: vi.fn(() => false),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('@/components/shared', () => ({ CreditsIcon: { template: '<svg />' } }));

let wrapper: VueWrapper<InstanceType<typeof CreditBalance>>;
const cancelled = vi.fn();
function setBalance(value: number) {
  (creditsBalance as unknown as { value: number }).value = value;
}
async function claim() {
  setBalance(60);
  wrapper.vm.claimed({ source: wrapper.element as HTMLElement, before: 50, after: 60 });
  await nextTick();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.mocked(prefersReducedMotion).mockReturnValue(false);
  vi.mocked(animateCreditClaim).mockReturnValue(cancelled);
  setBalance(50);
  currentUser.value = { id: 'first' } as typeof currentUser.value;
  wrapper = mount(CreditBalance, { attachTo: document.body });
});
afterEach(() => {
  wrapper.unmount();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

test('钱包先到账、飞行中保留旧数字、抵达后递增到真实余额', async () => {
  await claim();
  expect(wrapper.get('[aria-label="积分余额"]').text()).toBe('50');
  expect(document.querySelector('[data-credit-balance-feedback]')).not.toBeNull();
  vi.mocked(animateCreditClaim).mock.calls[0]![2]();
  await vi.advanceTimersByTimeAsync(200);
  const intermediate = Number(wrapper.get('[aria-label="积分余额"]').text());
  expect(intermediate).toBeGreaterThan(50);
  expect(intermediate).toBeLessThan(60);
  await vi.advanceTimersByTimeAsync(800);
  expect(wrapper.get('[aria-label="积分余额"]').text()).toBe('60');
  expect(document.querySelector('[data-credit-balance-feedback]')).toBeNull();
  expect(toast.success).toHaveBeenCalledOnce();
});

test.each(['cancel', 'resize', 'account', 'balance', 'unmount'])(
  '%s 中断清理动画并同步权威余额，旧回调不再产生效果',
  async (kind) => {
    await claim();
    const arrive = vi.mocked(animateCreditClaim).mock.calls[0]![2];
    if (kind === 'cancel') wrapper.vm.cancel();
    else if (kind === 'resize') window.dispatchEvent(new Event('resize'));
    else if (kind === 'account') {
      currentUser.value = { id: 'second' } as typeof currentUser.value;
      setBalance(35);
    } else if (kind === 'balance') setBalance(55);
    else wrapper.unmount();
    await nextTick();
    expect(cancelled).toHaveBeenCalledOnce();
    expect(document.querySelector('[data-credit-balance-feedback]')).toBeNull();
    arrive();
    await vi.advanceTimersByTimeAsync(1000);
    expect(toast.success).not.toHaveBeenCalled();
    if (kind !== 'unmount')
      expect(wrapper.get('[aria-label="积分余额"]').text()).toBe(String(creditsBalance.value));
  },
);

test('减少动态效果直接显示新余额，不创建飞行层', async () => {
  vi.mocked(prefersReducedMotion).mockReturnValue(true);
  await claim();
  expect(wrapper.get('[aria-label="积分余额"]').text()).toBe('60');
  expect(animateCreditClaim).not.toHaveBeenCalled();
  expect(document.querySelector('[data-credit-balance-feedback]')).toBeNull();
  expect(toast.success).toHaveBeenCalledOnce();
});

test('动画执行异常不会改变已到账余额，也不会残留反馈层', async () => {
  vi.mocked(animateCreditClaim).mockImplementationOnce(() => {
    throw new Error('animation unavailable');
  });
  await claim();
  expect(wrapper.get('[aria-label="积分余额"]').text()).toBe('60');
  expect(document.querySelector('[data-credit-balance-feedback]')).toBeNull();
  expect(toast.success).toHaveBeenCalledOnce();
});
