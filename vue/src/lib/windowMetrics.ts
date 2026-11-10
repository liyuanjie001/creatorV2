import type { MetricKey, PublishedVideo, ReportDays, VideoMetrics } from '@/types/windows';
import { demoDate } from '@/data/windowDemo';

export const metricOptions: { key: MetricKey; label: string }[] = [
  { key: 'views', label: '播放量' },
  { key: 'likes', label: '点赞' },
  { key: 'comments', label: '评论' },
];
export const formatCount = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

export function sumMetrics(videos: PublishedVideo[], days: ReportDays): VideoMetrics {
  const since = demoDate(days - 1);
  return videos.reduce(
    (total, video) => {
      for (const row of video.daily) {
        if (row.date < since) continue;
        total.views += row.views;
        total.likes += row.likes;
        total.comments += row.comments;
      }
      return total;
    },
    { views: 0, likes: 0, comments: 0 },
  );
}

export function metricTrend(
  groups: { name: string; videos: PublishedVideo[] }[],
  days: ReportDays,
  metric: MetricKey,
) {
  return Array.from({ length: days }, (_, index) => {
    const date = demoDate(days - index - 1);
    const row: Record<string, string | number> = { day: date.slice(5) };
    for (const group of groups) {
      row[group.name] = group.videos.reduce(
        (sum, video) => sum + (video.daily.find((daily) => daily.date === date)?.[metric] ?? 0),
        0,
      );
    }
    return row;
  });
}
