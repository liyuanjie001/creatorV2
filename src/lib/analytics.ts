import { DEMO_TODAY, demoDate } from '@/data/windowDemo';
import type { MetricDatum, MetricKey, PlatformAccount, PublishedVideo, ReportDays } from '@/types/windows';
import { sumMetrics } from './windowMetrics';

export const collectedAt = `${DEMO_TODAY}T10:00:00Z`;
export function available(
  value: number,
  source = '演示数据 · 平台后台示例',
  included = 1,
  total = 1,
): MetricDatum {
  return { kind: 'available', value, source, collectedAt, included, total };
}
export function unavailable(
  reason: Extract<MetricDatum, { kind: 'unavailable' }>['reason'],
  detail: string,
): MetricDatum {
  return { kind: 'unavailable', reason, detail };
}
export function uniqueVideos(videos: PublishedVideo[]) {
  return [...new Map(videos.map((video) => [video.id, video])).values()];
}
export function videoAvailability(video: PublishedVideo, days: ReportDays): MetricDatum {
  if (video.collection.kind === 'uncollected')
    return unavailable('未采集', '首次识别到内容，尚未采集表现数据');
  if (video.collection.kind === 'failed') return unavailable('采集失败', video.collection.reason);
  const needed = [demoDate(days - 1), video.publishedAt].sort().at(-1) ?? demoDate(days - 1);
  if (video.collection.since > needed)
    return unavailable('历史不足', `仅有 ${video.collection.since} 起的记录，无法补齐所选范围`);
  return available(0);
}
export function summarizeVideos(videos: PublishedVideo[], days: ReportDays) {
  const unique = uniqueVideos(videos);
  const included = unique.filter((video) => videoAvailability(video, days).kind === 'available');
  const sums = sumMetrics(included, days);
  const firstMissing = unique.find((video) => videoAvailability(video, days).kind === 'unavailable');
  const missing = firstMissing ? videoAvailability(firstMissing, days) : undefined;
  function datum(metric: MetricKey): MetricDatum {
    if (unique.length > 0 && included.length === 0 && missing) return missing;
    return available(sums[metric], '演示数据 · 已覆盖内容的区间增量', included.length, unique.length);
  }
  return {
    metrics: { views: datum('views'), likes: datum('likes'), comments: datum('comments') },
    videos: included,
    included: included.length,
    total: unique.length,
    complete: included.length === unique.length,
  };
}
export function videoDiagnostics(video: PublishedVideo, account: PlatformAccount) {
  const unsupported = unavailable('采集能力未验证', '本演示没有该平台对应指标的已验证采集来源');
  const missing = videoAvailability(video, 7);
  const ready = missing.kind === 'available';
  const index = Number(video.id.slice(-1)) || 1;
  const value = (number: number) => (ready ? available(number) : missing);
  return {
    completion: account.platform === 'TikTok' ? value(29 + index * 3.4) : unsupported,
    retention: account.platform === 'TikTok' ? value(51 + index * 4.2) : unsupported,
    averageWatch: ['TikTok', 'Instagram', 'YouTube', 'Facebook'].includes(account.platform)
      ? value(12 + index * 3.5)
      : unsupported,
    firstHour:
      account.id === 'A-P1-1-TikTok'
        ? value(300 + index * 120)
        : unavailable('未采集', '未记录发布后 1 小时时点快照，不能从当前播放倒推'),
  };
}
export function growthMetric(account: PlatformAccount): MetricDatum {
  const current = account.followerHistory.find((sample) => sample.date === DEMO_TODAY);
  const previous = account.followerHistory.find((sample) => sample.date === demoDate(7));
  if (!current || !previous) return unavailable('历史不足', '缺少完整的 7 天粉丝快照');
  return available(current.count - previous.count, '演示数据 · 7 天粉丝快照差值');
}
