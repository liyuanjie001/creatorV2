import type { SocialPlatform, StudioState, TKAccount } from '@/types/studio';
import { accountVideoRows, metrics, type VideoRow } from './videoManagement';
import { accountPlatform } from './accounts';

export function accountStatistics(state: StudioState, accountId: string) {
  const rows = accountVideoRows(state, accountId);
  const views = rows
    .filter((r) => (r.content?.type || r.film?.type) === '视频')
    .map((r) => metrics(r)?.views)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)
    .sort((a, b) => a - b);
  const middle = Math.floor(views.length / 2);
  return {
    sampleSize: views.length,
    average: views.length ? views.reduce((a, b) => a + b, 0) / views.length : undefined,
    median: views.length
      ? views.length % 2
        ? views[middle]!
        : (views[middle - 1]! + views[middle]!) / 2
      : undefined,
    latestPublishedAt: rows[0]?.date,
  };
}

export function accountViewsTrend(account?: TKAccount, today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 6 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const views = account?.statistics?.dailyViews?.find((p) => p.date === key)?.views;
    return {
      date: key,
      views: typeof views === 'number' && Number.isFinite(views) && views >= 0 ? views : undefined,
    };
  });
}

export const accountTrendMetrics = [
  { key: 'views', label: '7天播放量' },
  { key: 'profileViews', label: '主页浏览量' },
  { key: 'likes', label: '点赞' },
  { key: 'comments', label: '评论' },
  { key: 'shares', label: '分享' },
  { key: 'followers', label: '粉丝' },
] as const;
export type AccountTrendMetric = typeof accountTrendMetrics[number]['key'];
const validCount = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
export function accountMetricTrend(account: TKAccount, metric: AccountTrendMetric, today = new Date()) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 13 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const daily = account.statistics?.dailyMetrics?.find((p) => p.date === key);
    const value = daily?.[metric] ?? (metric === 'views'
      ? account.statistics?.dailyViews?.find((p) => p.date === key)?.views : undefined);
    return { date: key, value: validCount(value) };
  });
  const sum = (points: typeof days) => points.every((p) => p.value !== undefined)
    ? points.reduce((total, p) => total + p.value!, 0) : undefined;
  const points = days.slice(7);
  const current = metric === 'followers' ? validCount(account.statistics?.followers) : sum(points);
  const previous = metric === 'followers' ? days[6]?.value : sum(days.slice(0, 7));
  const change = current !== undefined && previous !== undefined ? current - previous : undefined;
  return { points, current, previous, change,
    percent: change !== undefined && previous ? change / previous * 100 : undefined };
}

// A publish-record dialog only represents that record. A work dialog includes its successful history.
export function publishedVideoPlatforms(state: StudioState, row: VideoRow): SocialPlatform[] {
  if (row.film?.resultKind === 'script-breakdown' || (row.content?.type || row.film?.type) !== '视频')
    return [];
  const accounts = new Set<string>();
  if (row.film && row.id === row.film.id) {
    state.tasks
      .filter((t) => t.filmId === row.film!.id && t.status === '发布成功')
      .forEach((t) => accounts.add(t.accountId));
    state.content.filter((c) => c.filmId === row.film!.id).forEach((c) => accounts.add(c.accountId));
  } else if (row.publishStatus === '发布成功') {
    const id = row.task?.accountId || row.content?.accountId;
    if (id) accounts.add(id);
  }
  return [
    ...new Set(
      [...accounts]
        .map((id) => state.accounts.find((a) => a.id === id))
        .filter((a): a is TKAccount => !!a)
        .map(accountPlatform),
    ),
  ];
}
