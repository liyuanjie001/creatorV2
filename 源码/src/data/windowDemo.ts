import { projects } from '@/data/mock';
import type { Platform } from '@/data/mock'
import type { BrowserWindow, PlatformAccount, PublishedVideo, RoxyProject } from '@/types/windows';

export const DEMO_TODAY = '2026-10-22';
export const roxyProjects: RoxyProject[] = projects.map((project) => ({
  id: `roxy-${project.id}`,
  name: project.name,
  workspaceProjectId: project.id,
}));

const windowSeeds: { project: string; brand: string; region: string; platforms: Platform[][] }[] = [
  {
    project: 'P1',
    brand: 'GlowUp',
    region: '美国',
    platforms: [['TikTok', 'Instagram', 'YouTube'], ['TikTok', 'Instagram'], []],
  },
  {
    project: 'P2',
    brand: 'TechNova',
    region: '美国',
    platforms: [
      ['YouTube', 'TikTok', 'LinkedIn'],
      ['YouTube', 'TikTok'],
    ],
  },
  {
    project: 'P3',
    brand: 'BlackFriday',
    region: '德国',
    platforms: [
      ['Facebook', 'Instagram', 'X'],
      ['Facebook', 'X'],
    ],
  },
  { project: 'P4', brand: 'Noël', region: '法国', platforms: [['Instagram', 'Facebook'], ['Instagram']] },
  { project: 'P5', brand: 'LinguaVoice', region: '英国', platforms: [['TikTok'], ['TikTok']] },
];

export const demoWindows: BrowserWindow[] = windowSeeds.flatMap((seed) =>
  seed.platforms.map((_, index) => ({
    id: `W-${seed.project}-${index + 1}`,
    name: `${seed.brand} · ${index === 0 ? '品牌主窗口' : index === 1 ? '内容增长窗口' : '备用窗口'}`,
    serial: `${seed.project.slice(1)}0${index + 1}`,
    roxyProjectId: `roxy-${seed.project}`,
    region: seed.region,
  })),
);

const accountSeeds = windowSeeds.flatMap((seed, projectIndex) =>
  seed.platforms.flatMap((platforms, windowIndex) =>
    platforms.map((platform, platformIndex): PlatformAccount & { windowId: string } => ({
      id: `A-${seed.project}-${windowIndex + 1}-${platform}`,
      windowId: `W-${seed.project}-${windowIndex + 1}`,
      platformAccountId: `${seed.brand.toLowerCase()}-${windowIndex + 1}-${platform.toLowerCase()}`,
      platform,
      name: `${seed.brand} ${windowIndex === 0 ? '官方' : '日更号'}`,
      handle: `@${seed.brand.toLowerCase().replace('ë', 'e')}.${windowIndex === 0 ? 'official' : 'daily'}.${platform.toLowerCase()}`,
      followers: 42000 + (projectIndex + 1) * 28000 + windowIndex * 19000 + platformIndex * 13000,
      followerHistory: [
        {
          date: DEMO_TODAY,
          count: 42000 + (projectIndex + 1) * 28000 + windowIndex * 19000 + platformIndex * 13000,
        },
        ...((seed.project === 'P5' && windowIndex === 1) ||
        (seed.project === 'P1' && windowIndex === 1 && platform === 'Instagram')
          ? []
          : [
              {
                date: demoDate(7),
                count:
                  42000 +
                  (projectIndex + 1) * 28000 +
                  windowIndex * 19000 +
                  platformIndex * 13000 -
                  900 -
                  projectIndex * 120 -
                  platformIndex * 40,
              },
            ]),
      ],
      status:
        (seed.project === 'P2' && windowIndex === 1 && platform === 'YouTube') ||
        (seed.project === 'P3' && windowIndex === 0 && platform === 'X')
          ? '登录失效'
          : '正常',
    })),
  ),
);

export const demoAccounts: PlatformAccount[] = accountSeeds.map(
  ({ windowId: _windowId, ...account }) => account,
);
export const demoBindings = [
  ...accountSeeds.map((account) => ({ windowId: account.windowId, accountId: account.id })),
  { windowId: 'W-P1-2', accountId: 'A-P1-1-YouTube' },
];

export function demoDate(daysAgo: number): string {
  const date = new Date(`${DEMO_TODAY}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

const themes = ['开箱实测：第一眼的惊喜', '真实体验：值得分享的细节', '一分钟看懂产品亮点'];
export const demoVideos: PublishedVideo[] = demoAccounts.flatMap((account, accountIndex) =>
  // This normal account intentionally has no published videos, for the empty report flow.
  account.id === 'A-P4-2-Instagram'
    ? []
    : themes.map((theme, index) => {
        const age = (index === 0 ? 1 : index === 1 ? 18 : 64) + (accountIndex % 5);
        return {
          id: `V-${account.id}-${index + 1}`,
          accountId: account.id,
          title: `${account.name} · ${theme}`,
          publishedAt: demoDate(age),
          duration: `00:${25 + index * 12}`,
          collection:
            account.id === 'A-P5-2-TikTok'
              ? { kind: 'uncollected' }
              : account.id === 'A-P3-1-X'
                ? { kind: 'failed', reason: '平台后台未能完成采集，请恢复登录后重试' }
                : {
                    kind: 'ready',
                    since: demoDate(account.id === 'A-P1-2-Instagram' ? 2 : 89),
                    collectedAt: `${DEMO_TODAY}T10:00:00Z`,
                  },
          daily: Array.from({ length: 90 }, (_, dayIndex) => {
            const daysAgo = 89 - dayIndex;
            const views =
              daysAgo > age
                ? 0
                : Math.round(
                    (180 + (accountIndex + 1) * 53 + index * 130) *
                      (1 + ((dayIndex * 7 + accountIndex * 3 + index) % 13) / 10),
                  );
            return {
              date: demoDate(daysAgo),
              views,
              likes: Math.round(views * (0.04 + index * 0.009)),
              comments: Math.round(views * (0.003 + index * 0.001)),
            };
          }),
        };
      }),
);
