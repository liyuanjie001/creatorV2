export type Platform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'X' | 'LinkedIn';

export type TaskStatus = '待发布' | '发布中' | '已完成' | '已失败';

export interface Task {
  id: string;
  title: string;
  project: string;
  platforms: Platform[];
  status: TaskStatus;
  progress: number;
  schedule: string;
  owner: string;
}

export interface Inspiration {
  id: string;
  title: string;
  platform: Platform;
  views: string;
  likes: string;
  duration: string;
  tags: string[];
  author: string;
  heat: number;
}

export interface TrendItem {
  rank: number;
  keyword: string;
  platform: Platform;
  region: string;
  heat: number;
  change: number;
  category: string;
}

export interface TopPost {
  id: string;
  title: string;
  platform: Platform;
  views: string;
  engagement: string;
  roas?: string;
  publishedAt: string;
}

export interface TrashItem {
  id: string;
  name: string;
  type: '项目' | '任务' | '素材' | '账号';
  deletedAt: string;
  size?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: '视频' | '图片' | '文案' | '音频';
  size: string;
  duration?: string;
  updatedAt: string;
  project: string;
  day: '今天' | '昨天' | '近7天';
  favorite?: boolean;
  enhanced?: boolean;
}

export interface AssetElement {
  id: string;
  name: string;
  kind: '角色' | '地点' | '道具' | '模板' | '配音';
  used: number;
}

export interface Generation {
  id: string;
  projectId: string;
  title: string;
  type: '视频' | '图片' | '图文';
  duration?: string;
  platform: Platform;
  day: '今天' | '昨天' | '近7天';
  status: '已发布' | '待发布' | '草稿';
}

export interface Product {
  id: string;
  projectId: string;
  name: string;
  price: string;
  sellingPoint: string;
  sales: string;
  desc?: string;
  link?: string;
  points?: string[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  desc: string;
  status: '进行中' | '未开始' | '已结束';
  progress: number;
  start: string;
  end: string;
  owner: string;
  platforms: Platform[];
  exposure: string;
  engagement: string;
  contentCount: number;
}

export interface IdeaNote {
  id: string;
  title: string;
  summary: string;
  time: string;
  platforms: string[];
  messages: {
    role: 'user' | 'ai';
    text: string;
  }[];
}

export interface ConsoleDraft {
  platform: Platform;
  title: string;
  tag: string;
}

export interface OrganizedIdea {
  title: string;
  positioning: string;
  sellingPoints: string[];
  recommendPlatforms: Platform[];
  format: string;
  hooks: string[];
  tags: string[];
  insight: string;
}
