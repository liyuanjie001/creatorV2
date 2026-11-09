import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import AccountPicker from '@/components/studio/AccountPicker.vue';
import type { TKAccount } from '@/types/studio';
const online: TKAccount = {
  id: 'online',
  name: 'Brand',
  handle: '@brand',
  groupId: 'brand',
  note: '主帐号',
  status: '已授权',
  authorizedAt: '2026-11-01T00:00:00Z',
  region: 'US',
};
const expired: TKAccount = {
  ...online,
  id: 'expired',
  name: 'Expired',
  handle: '@expired',
  status: '授权过期',
  groupId: '',
  note: '',
};
const options = {
  props: { accounts: [online, expired], groups: [{ id: 'brand', name: '品牌分组' }], modelValue: '' },
  global: {
    stubs: {
      PopoverRoot: { template: '<div><slot /></div>' },
      PopoverTrigger: { template: '<div><slot /></div>' },
      PopoverPortal: { template: '<div><slot /></div>' },
      PopoverContent: { template: '<div><slot /></div>' },
    },
  },
};
test('帐号搜索覆盖名称、用户名、分组、备注，支持空值及大小写', async () => {
  const wrapper = mount(AccountPicker, options);
  for (const keyword of [' BRAND ', '@brand', '品牌分组', '主帐号']) {
    await wrapper.get('input').setValue(keyword);
    expect(wrapper.findAll('[data-account-action]')).toHaveLength(1);
  }
  await wrapper.get('input').setValue('unknown');
  expect(wrapper.text()).toContain('没有匹配');
  wrapper.unmount();
});
test('过期帐号不可选，授权事件独立，已选失效及移除显示提示', async () => {
  const wrapper = mount(AccountPicker, options);
  const button = (label: string) =>
    wrapper.findAll('button').find((b) => b.attributes('aria-label') === label)!;
  expect(button('选择 @expired').attributes('disabled')).toBeDefined();
  await button('立即登录授权 @expired').trigger('click');
  expect(wrapper.emitted('authorize')?.[0]).toEqual([expired]);
  expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  await button('选择 @brand').trigger('click');
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['online']);
  await wrapper.setProps({ modelValue: 'expired', selectedAccount: expired });
  expect(wrapper.get('[role=alert]').text()).toContain('登录过期');
  await wrapper.setProps({ accounts: [online] });
  expect(wrapper.get('[role=alert]').text()).toContain('不再关联');
  wrapper.unmount();
});
