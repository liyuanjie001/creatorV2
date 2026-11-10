import { describe, expect, test } from 'vitest';
import { accountStatistics, accountViewsTrend, accountMetricTrend, accountTrendMetrics, publishedVideoPlatforms } from '@/services/accountStatistics';
import { addAccountStatisticsExamples, completeDemoAccountMetrics, upgradeDemoAccountTrends } from '@/services/accounts';
import { blankAttributes } from '@/services/studio';
import type { PlatformContent, StudioState, TKAccount } from '@/types/studio';
import type { VideoRow } from '@/services/videoManagement';
const account = (id = 'a'): TKAccount => ({
  id,
  name: '帐号',
  handle: '@brand',
  platform: 'facebook',
  region: '',
  groupId: '',
  note: '',
  status: '已授权',
  authorizedAt: '',
});
function state(): StudioState {
  return {
    version: 1,
    projects: [],
    accounts: [account()],
    groups: [],
    films: [],
    tasks: [],
    content: [],
    sessions: [],
    jobs: [],
    favorites: [],
    references: [],
    products: [],
    hiddenHot: false,
  };
}
function content(id: string, views: number, extra: Partial<PlatformContent> = {}): PlatformContent {
  return {
    id,
    accountId: 'a',
    title: id,
    projectIds: [],
    type: '视频',
    publishedAt: '2026-11-01T00:00:00Z',
    attributes: blankAttributes(),
    collection: '可用',
    snapshots: [{ date: '2026-11-01', views, likes: 0, comments: 0, shares: 0 }],
    ...extra,
  };
}
function row(c: PlatformContent): VideoRow {
  return {
    id: c.id,
    content: c,
    title: c.title,
    date: c.publishedAt,
    generation: '未提供',
    source: '外部历史',
    publishStatus: '发布成功',
  } as VideoRow;
}
describe('帐号统计', () => {
  test('平均和中位数包含零，排除图文、未采集、失败、其他帐号与无快照', () => {
    const s = state();
    s.content = [
      content('zero', 0),
      content('normal', 20),
      content('gallery', 999, { type: '图文' }),
      content('missing', 999, { collection: '未采集' }),
      content('failed', 999, { collection: '采集失败' }),
      content('other', 999, { accountId: 'b' }),
      content('empty', 999, { snapshots: [] }),
    ];
    expect(accountStatistics(s, 'a')).toMatchObject({ average: 10, median: 10, sampleSize: 2 });
    s.content.push(content('third', 100));
    expect(accountStatistics(s, 'a')).toMatchObject({ average: 40, median: 20, sampleSize: 3 });
  });
  test('读取最新快照，最近发布包含图文，空帐号不伪造零', () => {
    const s = state();
    s.content = [
      content('video', 0, {
        snapshots: [
          { date: '2026-11-02', views: 60, likes: 0, comments: 0, shares: 0 },
          { date: '2026-11-01', views: 20, likes: 0, comments: 0, shares: 0 },
        ],
      }),
      content('gallery', 10, { type: '图文', publishedAt: '2026-11-03T00:00:00Z' }),
    ];
    expect(accountStatistics(s, 'a')).toEqual({
      sampleSize: 1,
      average: 60,
      median: 60,
      latestPublishedAt: '2026-11-03T00:00:00Z',
    });
    expect(accountStatistics(s, 'b')).toEqual({
      sampleSize: 0,
      average: undefined,
      median: undefined,
      latestPublishedAt: undefined,
    });
  });
  test('七天趋势使用每日统计，缺失不补零，跨月日期正确', () => {
    const a = account();
    a.statistics = {
      dailyViews: [
        { date: '2026-10-31', views: 0 },
        { date: '2026-11-01', views: 12 },
      ],
    };
    const result = accountViewsTrend(a, new Date(2026, 10, 2));
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ date: '2026-10-27', views: undefined });
    expect(result[4]?.views).toBe(0);
    expect(result[5]?.views).toBe(12);
    expect(result[6]?.views).toBeUndefined();
  });
  test('示例升级仅补固定演示帐号，保留已有统计且幂等', () => {
    const s = state();
    s.accounts = [account('tk-glow'), account('demo-facebook'), account('user-account')];
    s.accounts[0]!.statistics = { followers: 0 };
    addAccountStatisticsExamples(s, 'regular');
    expect(s.accountStatisticsAdded).toBeUndefined();
    addAccountStatisticsExamples(s, 'demo');
    expect(s.accounts[0]!.statistics).toEqual({ followers: 0 });
    expect(s.accounts[1]!.statistics?.dailyViews).toHaveLength(7);
    expect(s.accounts[2]!.statistics).toBeUndefined();
    const saved = JSON.stringify(s);
    addAccountStatisticsExamples(s, 'demo');
    expect(JSON.stringify(s)).toBe(saved);
    s.accounts = [];
    addAccountStatisticsExamples(s, 'demo');
    expect(s.accounts).toHaveLength(0);
  });
  test('统计和升级标记可经持久化恢复', () => {
    const s = state();
    s.accounts = [account('tk-glow')];
    addAccountStatisticsExamples(s, 'demo');
    const restored = JSON.parse(JSON.stringify(s)) as StudioState;
    expect(restored.accounts[0]!.statistics).toEqual(s.accounts[0]!.statistics);
    expect(restored.accountStatisticsAdded).toBe(true);
  });
});
describe('已发布平台入口', () => {
  test('记录只展示自身平台，图文和未发布不展示', () => {
    const s = state(),
      c = content('one', 0);
    expect(publishedVideoPlatforms(s, row(c))).toEqual(['facebook']);
    expect(publishedVideoPlatforms(s, { ...row(c), publishStatus: '未发布' })).toEqual([]);
    expect(publishedVideoPlatforms(s, row({ ...c, type: '图文' }))).toEqual([]);
  });
  test('作品展示成功历史的多个平台并去重，即使最近发布失败', () => {
    const s = state(),
      c = content('one', 0, { filmId: 'film' });
    s.accounts.push({ ...account('b'), platform: 'instagram' }, { ...account('c'), platform: 'tiktok' });
    s.content = [
      c,
      { ...c, id: 'two', accountId: 'b' },
      { ...c, id: 'three', accountId: 'b' },
      { ...c, id: 'four', accountId: 'c' },
    ];
    const work = {
      ...row(c),
      id: 'film',
      film: { id: 'film', type: '视频' },
      publishStatus: '发布失败',
    } as VideoRow;
    expect(publishedVideoPlatforms(s, work)).toEqual(['facebook', 'instagram', 'tiktok']);
    expect(
      publishedVideoPlatforms(s, { ...work, film: { ...work.film!, resultKind: 'script-breakdown' } }),
    ).toEqual([]);
  });
});

test('演示指标升级补齐缺失快照，保留零值且不影响普通用户', () => {
  const s = state();
  s.content = [content('zero', 0), content('missing', 0, { snapshots: [], collection: '未采集' })];
  completeDemoAccountMetrics(s, 'regular');
  expect(s.content[1]!.snapshots).toHaveLength(0);
  completeDemoAccountMetrics(s, 'demo');
  expect(s.content[0]!.snapshots[0]!.views).toBe(0);
  expect(s.content[1]!.snapshots[0]!.views).toBeGreaterThan(0);
  expect(s.content[1]!.collection).toBe('可用');
  expect(s.accounts[0]!.statistics?.dailyViews).toHaveLength(7);
  const saved = JSON.stringify(s);
  completeDemoAccountMetrics(s, 'demo');
  expect(JSON.stringify(s)).toBe(saved);
});


test('六项趋势按独立日统计汇总，粉丝读取当前总数并比较7天前', () => {
  const s = state();
  s.accounts[0]!.statistics = { followers: 1000, dailyViews: [{ date: '2026-11-10', views: 0 }] };
  upgradeDemoAccountTrends(s, 'demo', new Date(2026, 10, 10));
  const a = s.accounts[0]!;
  const daily = a.statistics!.dailyMetrics!;
  expect(daily).toHaveLength(14);
  expect(daily.at(-1)!.views).toBe(0);
  for (const item of accountTrendMetrics) {
    const result = accountMetricTrend(a, item.key, new Date(2026, 10, 10));
    expect(result.points).toHaveLength(7);
    expect(result.current).toBe(item.key === 'followers' ? 1000 : daily.slice(7).reduce((sum, p) => sum + p[item.key]!, 0));
    expect(result.change).toBe(result.current! - result.previous!);
  }
  const followers = accountMetricTrend(a, 'followers', new Date(2026, 10, 10));
  expect(followers.previous).toBe(916);
  expect(followers.points.at(-1)!.value).toBe(1000);
  const saved = JSON.stringify(s);
  const restored = JSON.parse(saved) as StudioState;
  upgradeDemoAccountTrends(restored, 'demo', new Date(2026, 10, 11));
  expect(JSON.stringify(restored)).toBe(saved);
});
test('趋势兼容旧播放，缺失不计零，无效值和零基数不产生百分比', () => {
  const a = account();
  a.statistics = { followers: 0, dailyViews: [{ date: '2026-11-01', views: 0 }],
    dailyMetrics: [{ date: '2026-10-31', likes: -1 }, { date: '2026-11-01', likes: NaN }] };
  const result = accountMetricTrend(a, 'views', new Date(2026, 10, 2));
  expect(result.points[0]!.date).toBe('2026-10-27');
  expect(result.points[5]!.value).toBe(0);
  expect(result.current).toBeUndefined();
  expect(result.change).toBeUndefined();
  expect(accountMetricTrend(a, 'likes', new Date(2026, 10, 2)).points.every((p) => p.value === undefined)).toBe(true);
  a.statistics.dailyMetrics = [{ date: '2026-10-26', followers: 0 }];
  expect(accountMetricTrend(a, 'followers', new Date(2026, 10, 2))).toMatchObject({ current: 0, previous: 0, change: 0, percent: undefined });
});
test('趋势升级保留用户字段、旧日期、零值，普通用户及已删除帐号不补数据', () => {
  const s = state();
  s.accounts[0]!.statistics = { dailyMetrics: [{ date: '2026-11-10', likes: 0 }, { date: '2020-01-01', views: 4 }] };
  s.accounts.push({ ...account('deleted'), deleted: true });
  const saved = JSON.stringify(s);
  upgradeDemoAccountTrends(s, 'regular');
  expect(JSON.stringify(s)).toBe(saved);
  upgradeDemoAccountTrends(s, 'demo', new Date(2026, 10, 10));
  expect(s.accounts[0]!.statistics!.dailyMetrics!.find((p) => p.date === '2026-11-10')!.likes).toBe(0);
  expect(s.accounts[0]!.statistics!.dailyMetrics!.find((p) => p.date === '2020-01-01')!.views).toBe(4);
  expect(s.accounts[1]!.statistics).toBeUndefined();
});
