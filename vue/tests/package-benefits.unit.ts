import { expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
import PackageBenefits from '@/components/PackageBenefits.vue';
import { getRechargeBenefits, rechargePacks, type RechargePackKey, type RechargeBenefit } from '@/services/credits';

const rows = [
  ['AI 创作', '快速创作', [true, true, true, true]],
  ['AI 创作', '智能创作', [true, true, true, true]],
  ['AI 创作', '多任务并行', ['10个', '20个', '无限并行任务', '高级加速通道']],
  ['AI 创作', '爆款视频复刻', [false, true, true, true]],
  ['AI 创作', '项目管理（不限制项目个数）', [true, true, true, true]],
  ['AI 创作', '产品卡创建', [true, true, true, true]],
  ['AI 创作', '素材库管理', [true, true, true, true]],
  ['AI 创作', '批量生成视频', [false, false, true, true]],
  ['账号与发布', '视频一键发布', [true, true, true, true]],
  ['账号与发布', '图文一键发布', [false, true, true, true]],
  ['账号与发布', '配置视频/图文 BGM', [false, true, true, true]],
  ['账号与发布', '批量发布视频', [false, false, true, true]],
  ['账号与发布', '定时发布', [false, true, true, true]],
  ['账号与发布', '可绑定发布账号的个数', [2, 5, 10, 30]],
  ['账号与发布', '可发布平台', ['全部平台', '全部平台', '全部平台', '全部平台']],
  ['账号与发布', '账号数据同步', [true, true, true, true]],
  ['数据分析', '发布结果统计', [true, true, true, true]],
  ['数据分析', '内容数据分析', [false, false, true, true]],
] as const;
const teamLabels = ['团队协作成员', '项目权限管理', '项目资源共享', '团队席位管理', '积分用量管理'];
const tiers: RechargePackKey[] = ['p500', 'p1000', 'p2000', 'p5000'];

test.each(tiers)('%s 个人版和团队版权益逐项与参考表一致', tier => {
  const index = tiers.indexOf(tier);
  for (const edition of ['personal', 'team'] as const) {
    const result = getRechargeBenefits(rechargePacks[tier], { edition, accountCount: 0, seats: edition === 'team' ? 2 : 0 });
    const expected: RechargeBenefit[] = rows.map(([category, label, values]) => ({ category, label, value: values[index]! }));
    if (edition === 'team') expected.push(...teamLabels.map(label => ({ category: '团队协作' as const, label, value: true })));
    expect(result).toEqual(expected);
  }
});

test('分类组件展示支持与不支持，团队切换增加五项，个人版不显示空分类', async () => {
  const personal = getRechargeBenefits(rechargePacks.p500, { edition: 'personal', accountCount: 0, seats: 0 });
  const wrapper = mount(PackageBenefits, { props: { benefits: personal } });
  expect(wrapper.findAll('h4').map(heading => heading.text())).toEqual(['AI 创作', '账号与发布', '数据分析']);
  expect(wrapper.findAll('li')).toHaveLength(18);
  expect(wrapper.findAll('[data-supported="false"]')).toHaveLength(7);
  expect(wrapper.text()).toContain('10个');
  expect(wrapper.findAll('li').find(row => row.text().startsWith('可绑定发布账号的个数'))!.text())
    .toContain('可绑定发布账号的个数（2个）');
  expect(wrapper.findAll('li').find(row => row.text().startsWith('可发布平台'))!.text())
    .toContain('可发布平台（全部平台）');
  await wrapper.setProps({ benefits: getRechargeBenefits(rechargePacks.p500, { edition: 'team', accountCount: 100, seats: 100 }) });
  expect(wrapper.findAll('h4').map(heading => heading.text())).toEqual(['团队协作', 'AI 创作', '账号与发布', '数据分析']);
  expect(wrapper.findAll('li')).toHaveLength(23);
  expect(wrapper.find('section[aria-label="团队协作"]').findAll('[data-supported="true"]')).toHaveLength(5);
  wrapper.unmount();
});
