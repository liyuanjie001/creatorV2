import type { Platform } from '@/data/mock'

export interface RoxyProject {
  id: string;
  name: string;
  workspaceProjectId: string;
}

export interface BrowserWindow {
  id: string;
  name: string;
  serial: string;
  roxyProjectId: string;
  region: string;
}

export interface PlatformAccount {
  id: string;
  platformAccountId: string;
  platform: Platform;
  name: string;
  handle: string;
  followers: number;
  followerHistory: { date: string; count: number }[];
  status: '正常' | '登录失效';
}

export interface WindowAccountBinding {
  windowId: string;
  accountId: string;
}

export type CollectionState =
  | { kind: 'ready'; since: string; collectedAt: string }
  | { kind: 'uncollected' }
  | { kind: 'failed'; reason: string };

export type MetricDatum =
  | { kind: 'available'; value: number; source: string; collectedAt: string; included: number; total: number }
  | {
      kind: 'unavailable';
      reason: '未采集' | '历史不足' | '当前平台不支持' | '采集能力未验证' | '采集失败' | '无可用样本';
      detail: string;
    };

export const operationStages = ['未分阶段', '测试期', '放量期', '暂停'] as const;
export type OperationStage = (typeof operationStages)[number];

export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
}

export interface PublishedVideo {
  id: string;
  accountId: string;
  title: string;
  publishedAt: string;
  duration: string;
  collection: CollectionState;
  daily: (VideoMetrics & { date: string })[];
}

export type ReportDays = 7 | 30 | 90;
export type MetricKey = keyof VideoMetrics;
