export const loginStatus = (value: string) => (value === '已授权' || value === '在线' ? '在线' : '登录过期');

import type { SocialPlatform, TKAccount, StudioState } from '@/types/studio';
export const platforms: { value: SocialPlatform; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
];
export const accountAvailableInProject = (account: TKAccount, project?: StudioState['projects'][number]) => !!project && !account.deleted && (account.source === 'recharge' || project.accountIds.includes(account.id));
export const accountPlatform = (account?: TKAccount): SocialPlatform => account?.platform ?? 'tiktok';
export const platformName = (platform?: SocialPlatform) =>
  platforms.find((p) => p.value === (platform ?? 'tiktok'))!.label;
export function publishedForAccount(state: StudioState, accountId: string) {
  return state.content
    .filter((c) => c.accountId === accountId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function publishCaption(task: { caption?: string; title: string; tags: string }) {
  return task.caption ?? [task.title, task.tags].filter(Boolean).join('\n');
}
export function migratePublishing(state: StudioState) {
  for (const account of state.accounts) account.platform ??= 'tiktok';
  for (const task of state.tasks) {
    task.caption ??= publishCaption(task);
    task.timeZone ??= 'Asia/Shanghai';
  }
}
export function addPlatformExamples(state: StudioState, owner: string) {
  if (owner !== 'demo' || state.platformExamplesAdded) return;
  const project = state.projects.find((p) => p.id === 'P1');
  if (!project) return;
  for (const platform of ['facebook', 'instagram'] as const) {
    const id = 'demo-' + platform;
    if (!state.accounts.some((a) => a.id === id))
      state.accounts.push({
        id,
        platform,
        name: 'GlowUp ' + platformName(platform),
        handle: '@glowup.official',
        region: '美国（演示）',
        groupId: 'group-brand',
        note: '多平台演示帐号',
        status: '已授权',
        authorizedAt: new Date().toISOString(),
      });
    if (!project.accountIds.includes(id)) project.accountIds.push(id);
    if (!state.content.some((c) => c.id === id + '-content'))
      state.content.push({
        id: id + '-content',
        accountId: id,
        projectIds: [project.id],
        title: 'GlowUp 日常护肤分享（' + platformName(platform) + ' 演示）',
        type: platform === 'instagram' ? '图文' : '视频',
        publishedAt: new Date().toISOString(),
        attributes: {
          theme: '商品种草',
          product: 'GlowUp',
          hook: '日常分享',
          scene: '居家',
          format: '产品展示',
          confirmed: false,
        },
        snapshots: [],
        collection: '未采集',
      });
  }
  state.platformExamplesAdded = true;
}

// One-time demo upgrade: do not restore removed accounts or overwrite edited metrics.
export function addAccountStatisticsExamples(state: StudioState, owner: string) {
  if (owner !== 'demo' || state.accountStatisticsAdded) return;
  const ids = ['tk-glow', 'tk-life', 'demo-facebook', 'demo-instagram'];
  for (const [index, id] of ids.entries()) {
    const account = state.accounts.find(a => a.id === id && !a.deleted);
    if (!account || account.statistics) continue;
    account.statistics = {
      following: 128 + index * 31, followers: 12480 + index * 2190,
      likes: 96800 + index * 8700, mock: true,
      dailyViews: [2460, 3120, 0, 4680, 3950, 6200, 5480].map((views, day) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - day));
        return { date: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`, views: views + (views ? index * 320 : 0) };
      }),
    };
  }
  state.accountStatisticsAdded = true;
}

// Upgrade existing local demo data without changing populated snapshots or true zero values.
export function completeDemoAccountMetrics(state: StudioState, owner: string) {
  if (owner !== 'demo' || state.accountMetricsVersion === 1) return;
  const today = new Date();
  const dayKey = (offset: number) => {
    const date = new Date(today); date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  for (const [index, account] of state.accounts.filter(a => !a.deleted).entries()) {
    const stats = account.statistics ??= {};
    stats.following ??= 128 + index * 31;
    stats.followers ??= 12480 + index * 2190;
    stats.likes ??= 96800 + index * 8700;
    stats.mock = true;
    stats.dailyViews ??= Array.from({ length: 7 }, (_, i) => ({ date: dayKey(i - 6), views: 2460 + index * 320 + i * 510 }));
  }
  for (const [index, content] of state.content.entries()) {
    if (content.snapshots.length || !state.accounts.some(a => a.id === content.accountId && !a.deleted)) continue;
    content.snapshots = [{ date: dayKey(0), views: 4280 + index * 830, likes: 216 + index * 37, comments: 18 + index * 3, shares: 12 + index * 2 }];
    content.collection = '可用';
  }
  state.accountMetricsVersion = 1;
}

// Independently stored daily Mock metrics; cumulative content snapshots are never used here.
export function upgradeDemoAccountTrends(state: StudioState, owner: string, today = new Date()) {
  if (owner !== 'demo' || (state.accountTrendVersion ?? 0) >= 1) return;
  for (const [index, account] of state.accounts.filter((a) => !a.deleted).entries()) {
    const stats = account.statistics ??= {};
    stats.mock = true;
    const daily = stats.dailyMetrics ??= [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today); date.setDate(date.getDate() - 13 + i);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      let point = daily.find((p) => p.date === key);
      if (!point) { point = { date: key }; daily.push(point); }
      point.views ??= stats.dailyViews?.find((p) => p.date === key)?.views ?? [820, 1360, 0, 2130, 1940, 3200, 1720][i % 7]! + index * 140 + (i >= 7 ? 420 : 0);
      point.profileViews ??= 20 + index * 3 + i * 2;
      point.likes ??= 48 + index * 6 + i * 4;
      point.comments ??= 3 + (i % 5) + index;
      point.shares ??= i % 4 === 0 ? 0 : 5 + index + (i % 3);
      point.followers ??= Math.max(0, (stats.followers ?? 0) - (13 - i) * 12);
    }
  }
  state.accountTrendVersion = 1;
}
