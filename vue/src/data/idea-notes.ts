import type { IdeaNote } from '@/types/domain';
export const seedNotes: IdeaNote[] = [
  {
    id: 'N-1',
    title: '便携咖啡机 · 露营场景宣发',
    time: '10-20 15:42',
    summary: '面向北美户外爱好者的露营咖啡内容系列，短视频 + 图文组合，主打便携与仪式感，黑五前 3 周蓄水。',
    platforms: ['TikTok', 'Instagram'],
    messages: [
      {
        role: 'user',
        text: '便携咖啡机、露营场景、北美年轻人、黑五前预热，预算不高',
      },
      {
        role: 'ai',
        text: '已整理为「户外移动咖啡馆」露营场景系列：主打 3 分钟现磨 + 680g 便携 + 出片属性，推荐 TikTok / Instagram 短视频，附 3 条钩子文案与 #CampingCoffee 话题。',
      },
    ],
  },
  {
    id: 'N-2',
    title: '桌面氛围好物 · 打工人系列',
    time: '10-18 11:05',
    summary: '都市白领工位改造剧情向内容，单场景可批量产出，适合日更账号，周四周五发布互动更高。',
    platforms: ['TikTok', 'X'],
    messages: [
      {
        role: 'user',
        text: '办公桌改造、治愈系、预算不高、想日更',
      },
      {
        role: 'ai',
        text: '已整理为「办公室第三空间」桌面氛围系列：用一天时间线带出 3 个使用 moment，推荐 TikTok 剧情短片 + X Thread 长帖组合。',
      },
    ],
  },
];
