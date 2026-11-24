import type { StudioState, TKAccount } from '@/types/studio';
import { accountPlatform } from './accounts';
import { accountVideoRows, metrics } from './videoManagement';

export const authorizationStatuses = ['已授权', '授权过期', '权限不足', '已解绑'] as const;
export function matchesAuthorization(account: TKAccount, filter: string) {
  if (filter === '在线') return account.status === '已授权';
  if (filter === '登录过期') return account.status !== '已授权';
  return !filter || account.status === filter;
}

export function accountOverview(state: StudioState, id: string) {
  const seen = new Set<string>();
  const rows = accountVideoRows(state, id).filter((row) => {
    const key = row.content?.id || row.task?.platformId || row.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const snapshots = rows.map(metrics);
  const available = snapshots.filter((snapshot) => snapshot !== undefined);
  return {
    works: rows.length,
    latest: rows[0]?.date,
    views: available.length ? available.reduce((sum, snapshot) => sum + snapshot.views, 0) : undefined,
    partial: available.length > 0 && available.length < rows.length,
  };
}

export function accountHomepage(account: TKAccount) {
  const handle = encodeURIComponent(account.handle.replace(/^@/, ''));
  switch (accountPlatform(account)) {
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}/`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    default:
      return `https://www.tiktok.com/@${handle}`;
  }
}

// Stable demo values: synchronizing again never increments metrics or creates content.
export function synchronizedDemoAccount(account: TKAccount, time: string): TKAccount {
  const seed = [...account.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return {
    ...account,
    statistics: {
      ...account.statistics,
      following: account.statistics?.following ?? seed % 300,
      followers: account.statistics?.followers ?? seed * 13,
      likes: account.statistics?.likes ?? seed * 29,
      mock: true,
    },
    dataUpdatedAt: time,
  };
}

export function addYouTubeExample(state: StudioState, owner: string) {
  if (owner !== 'demo' || state.youtubeExampleAdded) return;
  if (!state.accounts.some((account) => account.id === 'demo-youtube')) {
    state.accounts.push({
      id: 'demo-youtube',
      platform: 'youtube',
      name: 'GlowUp YouTube',
      handle: '@glowup.demo',
      region: '美国（演示）',
      groupId: 'ungrouped',
      note: '演示账号，暂不支持发布',
      status: '已授权',
      authorizedAt: new Date().toISOString(),
      statistics: { following: 0, followers: 2380, likes: 12600, mock: true },
    });
  }
  state.youtubeExampleAdded = true;
}
