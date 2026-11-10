import type { BreakdownScript, Film } from '@/types/studio';
export function mockBreakdown(): BreakdownScript {
  return {
    summary: 'Mock 拆解示例：问题开场 → 细节展示 → 行动引导。未实际解析视频。',
    hook: '以日常问题吸引注意，再展示产品细节。',
    shots: ['0–3 秒', '3–10 秒', '10–15 秒'].map((time, i) => ({
      time,
      visual: ['问题场景', '产品特写', '产品全景'][i]!,
      scene: '日常场景（模拟）',
      action: ['提出问题', '展示细节', '引导了解'][i]!,
      voice: ['Have you noticed this?', 'Take a closer look.', 'Explore the details.'][i]!,
      subtitle: ['日常问题', '产品细节', '了解更多'][i]!,
    })),
  };
}
export function breakdownText(film: Pick<Film, 'breakdownScript'>) {
  const s = film.breakdownScript;
  return s
    ? [
        s.summary,
        `Hook：${s.hook}`,
        ...s.shots.map(
          (x) =>
            `时间：${x.time}\n画面：${x.visual}\n场景：${x.scene}\n人物动作：${x.action}\n口播：${x.voice}\n字幕：${x.subtitle}`,
        ),
      ].join('\n\n')
    : '';
}
