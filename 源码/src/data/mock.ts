export type Platform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'X' | 'LinkedIn'

export const platformColors: Record<Platform, string> = {
  TikTok: '#22d3ee',
  Instagram: '#e879f9',
  YouTube: '#f87171',
  Facebook: '#60a5fa',
  X: '#e4e4e7',
  LinkedIn: '#38bdf8',
}

export const platforms: Platform[] = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'X', 'LinkedIn']

export const kpis = [
  { label: '今日发布内容', value: '48', delta: '+12.5%', up: true, hint: '较昨日 +6 条' },
  { label: '总曝光量', value: '2.48M', delta: '+34.2%', up: true, hint: '近 30 天累计' },
  { label: '平均互动率', value: '6.8%', delta: '+1.2pt', up: true, hint: '高于行业均值 2.1pt' },
  { label: '活跃账号', value: '12 / 15', delta: '3 个待授权', up: false, hint: '覆盖 6 个平台' },
]

/** 近 30 天曝光趋势（千次） */
export const exposureTrend = Array.from({ length: 30 }, (_, i) => {
  const base = 42 + Math.sin(i / 4) * 14 + i * 1.1
  return {
    day: `${i + 1}日`,
    曝光: Math.round(base * 10) / 10,
    互动: Math.round((base * 0.09 + Math.random() * 3) * 10) / 10,
  }
})

export const platformShare = [
  { name: 'TikTok', value: 38 },
  { name: 'Instagram', value: 24 },
  { name: 'YouTube', value: 18 },
  { name: 'Facebook', value: 10 },
  { name: 'X', value: 6 },
  { name: 'LinkedIn', value: 4 },
]

export type TaskStatus = '待发布' | '发布中' | '已完成' | '已失败'

export interface Task {
  id: string
  title: string
  project: string
  platforms: Platform[]
  status: TaskStatus
  progress: number
  schedule: string
  owner: string
}

export const tasks: Task[] = [
  { id: 'T-1024', title: '秋季新品开箱视频 × 欧美市场', project: 'GlowUp 美妆出海', platforms: ['TikTok', 'Instagram'], status: '发布中', progress: 68, schedule: '今天 14:00', owner: '林悦' },
  { id: 'T-1023', title: '3C 配件测评矩阵投放', project: 'TechNova 北美', platforms: ['YouTube', 'TikTok'], status: '发布中', progress: 35, schedule: '今天 18:30', owner: '陈默' },
  { id: 'T-1022', title: '黑五预热 Coupon 内容批量分发', project: 'BlackFriday 大促', platforms: ['Facebook', 'X', 'Instagram'], status: '待发布', progress: 0, schedule: '明天 09:00', owner: '林悦' },
  { id: 'T-1021', title: 'AI 数字人口播 · 东南亚六国本地化', project: 'LinguaVoice 多语言', platforms: ['TikTok'], status: '发布中', progress: 82, schedule: '今天 20:00', owner: '苏航' },
  { id: 'T-1018', title: '品牌故事纪录片二创切片', project: 'TechNova 北美', platforms: ['YouTube', 'LinkedIn'], status: '已完成', progress: 100, schedule: '昨天 10:00', owner: '陈默' },
  { id: 'T-1016', title: 'KOL 合拍挑战赛第二波', project: 'GlowUp 美妆出海', platforms: ['TikTok'], status: '已完成', progress: 100, schedule: '10-15 12:00', owner: '苏航' },
  { id: 'T-1015', title: '圣诞礼盒场景图文 × 德法市场', project: 'Noël 欧洲站', platforms: ['Instagram', 'Facebook'], status: '已失败', progress: 40, schedule: '10-14 09:00', owner: '林悦' },
]

export interface Inspiration {
  id: string
  title: string
  platform: Platform
  views: string
  likes: string
  duration: string
  tags: string[]
  author: string
  heat: number
}

export const inspirations: Inspiration[] = [
  { id: 'V-01', title: 'ASMR 开箱：10 美元小物的仪式感', platform: 'TikTok', views: '4.2M', likes: '612K', duration: '00:32', tags: ['开箱', 'ASMR', '平价好物'], author: '@unbox.daily', heat: 98 },
  { id: 'V-02', title: 'GRWM · 5 分钟通勤妆容挑战', platform: 'TikTok', views: '2.8M', likes: '341K', duration: '00:58', tags: ['美妆', 'GRWM', '挑战'], author: '@mia.glow', heat: 93 },
  { id: 'V-03', title: 'POV：第一次用便携投影仪露营', platform: 'Instagram', views: '1.9M', likes: '228K', duration: '00:45', tags: ['3C', '户外', 'POV'], author: '@tech.wander', heat: 88 },
  { id: 'V-04', title: '测评：100 美元 vs 1000 美元降噪耳机', platform: 'YouTube', views: '3.5M', likes: '402K', duration: '08:12', tags: ['测评', '3C', '对比'], author: '@SoundLab', heat: 91 },
  { id: 'V-05', title: '一分钟看懂：智能家居布线避坑', platform: 'YouTube', views: '1.2M', likes: '156K', duration: '06:40', tags: ['教程', '家居', '干货'], author: '@HomeHacker', heat: 79 },
  { id: 'V-06', title: 'Before/After：租房厨房大改造', platform: 'Instagram', views: '2.2M', likes: '297K', duration: '00:38', tags: ['家居', '改造', 'BeforeAfter'], author: '@rent.hacks', heat: 85 },
  { id: 'V-07', title: '办公室暗语：实习生第一天 VS 一年后', platform: 'X', views: '986K', likes: '88K', duration: '图文', tags: ['职场', '幽默'], author: '@desk.life', heat: 72 },
  { id: 'V-08', title: 'AI 帮我写周报？ LinkedIn 大佬实测', platform: 'LinkedIn', views: '456K', likes: '32K', duration: '图文', tags: ['AI', '职场', '效率'], author: '@FutureOfWork', heat: 66 },
  { id: 'V-09', title: '黑五清单：跨境买家必抢 TOP10', platform: 'Facebook', views: '1.5M', likes: '173K', duration: '01:20', tags: ['电商', '黑五', '清单'], author: '@DealHunter', heat: 81 },
]

export interface TrendItem {
  rank: number
  keyword: string
  platform: Platform
  region: string
  heat: number
  change: number
  category: string
}

export const trends: TrendItem[] = [
  { rank: 1, keyword: '#CozyAutumn', platform: 'TikTok', region: '美国', heat: 96, change: 42, category: '生活方式' },
  { rank: 2, keyword: 'GRWM routine', platform: 'Instagram', region: '英国', heat: 92, change: 18, category: '美妆' },
  { rank: 3, keyword: 'mini projector', platform: 'YouTube', region: '美国', heat: 89, change: 35, category: '3C 数码' },
  { rank: 4, keyword: '#DeskSetupTour', platform: 'X', region: '日本', heat: 85, change: 9, category: '职场' },
  { rank: 5, keyword: 'Black Friday deals', platform: 'Facebook', region: '德国', heat: 83, change: 61, category: '电商' },
  { rank: 6, keyword: 'AI voiceover', platform: 'TikTok', region: '东南亚', heat: 80, change: 27, category: 'AI 工具' },
  { rank: 7, keyword: 'sourdough starter', platform: 'Instagram', region: '法国', heat: 74, change: -6, category: '美食' },
  { rank: 8, keyword: '#VanLifeEurope', platform: 'YouTube', region: '欧洲', heat: 71, change: 12, category: '旅行' },
]

/** 分平台近 7 天互动量（千次） */
export const engagement7d = [
  { day: '周一', TikTok: 18, Instagram: 11, YouTube: 8 },
  { day: '周二', TikTok: 22, Instagram: 13, YouTube: 9 },
  { day: '周三', TikTok: 19, Instagram: 15, YouTube: 12 },
  { day: '周四', TikTok: 26, Instagram: 14, YouTube: 11 },
  { day: '周五', TikTok: 31, Instagram: 18, YouTube: 14 },
  { day: '周六', TikTok: 38, Instagram: 24, YouTube: 17 },
  { day: '周日', TikTok: 33, Instagram: 21, YouTube: 15 },
]

export const audienceAge = [
  { name: '18-24', value: 32 },
  { name: '25-34', value: 41 },
  { name: '35-44', value: 17 },
  { name: '45-54', value: 7 },
  { name: '55+', value: 3 },
]

export interface Account {
  id: string
  platform: Platform
  handle: string
  name: string
  followers: string
  region: string
  status: '正常' | '待授权' | '风控预警'
  group: string
  lastActive: string
}

export const accounts: Account[] = [
  { id: 'A-01', platform: 'TikTok', handle: '@glowup.official', name: 'GlowUp 官方', followers: '486K', region: '美国', status: '正常', group: '美妆矩阵', lastActive: '10 分钟前' },
  { id: 'A-02', platform: 'TikTok', handle: '@glowup.daily', name: 'GlowUp 日更号', followers: '210K', region: '美国', status: '正常', group: '美妆矩阵', lastActive: '1 小时前' },
  { id: 'A-03', platform: 'Instagram', handle: '@glowup.beauty', name: 'GlowUp Beauty', followers: '358K', region: '英国', status: '正常', group: '美妆矩阵', lastActive: '26 分钟前' },
  { id: 'A-04', platform: 'YouTube', handle: '@TechNovaLab', name: 'TechNova Lab', followers: '124K', region: '美国', status: '正常', group: '3C 矩阵', lastActive: '2 小时前' },
  { id: 'A-05', platform: 'YouTube', handle: '@TechNovaShorts', name: 'TechNova Shorts', followers: '89K', region: '美国', status: '待授权', group: '3C 矩阵', lastActive: '3 天前' },
  { id: 'A-06', platform: 'Facebook', handle: 'DealHunter EU', name: 'DealHunter 欧洲', followers: '176K', region: '德国', status: '正常', group: '电商矩阵', lastActive: '40 分钟前' },
  { id: 'A-07', platform: 'X', handle: '@desk_life_us', name: 'DeskLife 职场', followers: '95K', region: '美国', status: '风控预警', group: '内容矩阵', lastActive: '5 小时前' },
  { id: 'A-08', platform: 'LinkedIn', handle: 'Future of Work', name: 'FoW 官方', followers: '62K', region: '全球', status: '正常', group: 'B2B 矩阵', lastActive: '3 小时前' },
]

export interface TopPost {
  id: string
  title: string
  platform: Platform
  views: string
  engagement: string
  roas?: string
  publishedAt: string
}

export const topPosts: TopPost[] = [
  { id: 'P-1', title: 'GlowUp 精华 14 天实测（ before/after ）', platform: 'TikTok', views: '1.2M', engagement: '9.4%', roas: '4.8x', publishedAt: '10-18' },
  { id: 'P-2', title: '便携投影仪露营合集 · 三平台同步', platform: 'Instagram', views: '860K', engagement: '8.1%', roas: '3.2x', publishedAt: '10-17' },
  { id: 'P-3', title: '100 vs 1000 美元耳机盲测', platform: 'YouTube', views: '740K', engagement: '7.6%', roas: '2.9x', publishedAt: '10-15' },
  { id: 'P-4', title: '黑五 Coupon 预告 · 德法双语版', platform: 'Facebook', views: '520K', engagement: '5.2%', publishedAt: '10-16' },
  { id: 'P-5', title: 'AI 周报工具实测 · LinkedIn 长文', platform: 'LinkedIn', views: '210K', engagement: '6.8%', publishedAt: '10-14' },
]

export interface TrashItem {
  id: string
  name: string
  type: '项目' | '任务' | '素材' | '账号'
  deletedAt: string
  size?: string
}

export const trashItems: TrashItem[] = [
  { id: 'R-01', name: '夏季清仓促销（旧版）', type: '项目', deletedAt: '10-12 14:22' },
  { id: 'R-02', name: '未通过审核的口播视频_v3.mp4', type: '素材', deletedAt: '10-11 09:40', size: '128 MB' },
  { id: 'R-03', name: '万圣节预热任务 × 废弃排期', type: '任务', deletedAt: '10-09 18:05' },
  { id: 'R-04', name: '@old_brand_handle（已迁移）', type: '账号', deletedAt: '10-02 11:30' },
  { id: 'R-05', name: '品牌 KV 设计稿_final_v9.fig', type: '素材', deletedAt: '09-28 16:47', size: '64 MB' },
]

export const notifications = [
  { id: 'N-1', text: '@glowup.daily 视频进入 TikTok 热门榜 TOP50', time: '5 分钟前', unread: true },
  { id: 'N-2', text: '@TechNovaShorts 授权即将过期，请重新连接', time: '1 小时前', unread: true },
  { id: 'N-3', text: '「黑五预热」任务已完成 3/5 平台分发', time: '2 小时前', unread: false },
  { id: 'N-4', text: 'AI 洞察：#CozyAutumn 热度持续上升，建议跟进', time: '昨天', unread: false },
]

export const aiSuggestions = [
  'TikTok 美区 #CozyAutumn 话题 48 小时内热度上涨 42%，建议为 GlowUp 系列追加 2 条秋冬氛围短片。',
  '@glowup.daily 前 3 秒完播率低于矩阵均值 18%，建议下批视频以产品特写开场。',
  '黑五 Coupon 内容在 Facebook 德区的互动成本最低（$0.03/次），建议加大该渠道预算。',
]

export interface Asset {
  id: string
  name: string
  type: '视频' | '图片' | '文案' | '音频'
  size: string
  /** 分辨率 / 尺寸，如 1080×1920；音频与文档可为 — */
  dimensions: string
  duration?: string
  /** 上传时间 */
  updatedAt: string
  project: string
  day: '今天' | '昨天' | '近7天'
  favorite?: boolean
  enhanced?: boolean
}

export const assets: Asset[] = [
  { id: 'M-01', name: 'GlowUp_精华实测_before_after.mp4', type: '视频', size: '86 MB', dimensions: '1080×1920', duration: '00:32', updatedAt: '今天 14:20', project: 'GlowUp 美妆出海', day: '今天', favorite: true },
  { id: 'M-02', name: '便携投影仪_露营场景_v3.mp4', type: '视频', size: '142 MB', dimensions: '1920×1080', duration: '00:45', updatedAt: '今天 11:02', project: 'TechNova 北美', day: '今天', enhanced: true },
  { id: 'M-09', name: '精华质地特写_微距.mp4', type: '视频', size: '96 MB', dimensions: '1080×1920', duration: '00:18', updatedAt: '今天 16:05', project: 'GlowUp 美妆出海', day: '今天' },
  { id: 'M-10', name: 'ins风_开箱构图参考.png', type: '图片', size: '3.4 MB', dimensions: '1080×1350', updatedAt: '今天 10:47', project: 'GlowUp 美妆出海', day: '今天', enhanced: true },
  { id: 'M-11', name: '投影仪_星空顶实投.jpg', type: '图片', size: '6.1 MB', dimensions: '4096×2304', updatedAt: '今天 09:30', project: 'TechNova 北美', day: '今天' },
  { id: 'M-03', name: '黑五coupon_德法双语文案.docx', type: '文案', size: '24 KB', dimensions: '—', updatedAt: '昨天 16:40', project: 'BlackFriday 大促', day: '昨天' },
  { id: 'M-04', name: '品牌KV_主视觉_蓝白版.png', type: '图片', size: '4.8 MB', dimensions: '2400×2400', updatedAt: '昨天 09:15', project: 'GlowUp 美妆出海', day: '昨天' },
  { id: 'M-12', name: '黑五_倒计时海报文案.txt', type: '文案', size: '8 KB', dimensions: '—', updatedAt: '昨天 20:12', project: 'BlackFriday 大促', day: '昨天' },
  { id: 'M-13', name: '露营B-roll_篝火夜景.mp4', type: '视频', size: '204 MB', dimensions: '1920×1080', duration: '01:05', updatedAt: '昨天 15:26', project: 'TechNova 北美', day: '昨天', favorite: true },
  { id: 'M-14', name: '圣诞_礼盒平铺图.png', type: '图片', size: '4.2 MB', dimensions: '2000×2000', updatedAt: '昨天 11:38', project: 'Noël 欧洲站', day: '昨天' },
  { id: 'M-15', name: '德语_促销口播_男声B.mp3', type: '音频', size: '2.8 MB', dimensions: '—', duration: '00:58', updatedAt: '昨天 14:02', project: 'Noël 欧洲站', day: '昨天' },
  { id: 'M-05', name: 'AI口播_美式英语配音_女声A.mp3', type: '音频', size: '3.2 MB', dimensions: '—', duration: '01:12', updatedAt: '近7天 20:33', project: 'LinguaVoice 多语言', day: '近7天' },
  { id: 'M-06', name: '产品白底图_精华30ml.png', type: '图片', size: '2.1 MB', dimensions: '1600×1600', updatedAt: '近7天 15:08', project: 'GlowUp 美妆出海', day: '近7天' },
  { id: 'M-07', name: '3C配件测评_B-roll素材.mp4', type: '视频', size: '310 MB', dimensions: '3840×2160', duration: '02:18', updatedAt: '近7天 18:26', project: 'TechNova 北美', day: '近7天' },
  { id: 'M-08', name: '圣诞礼盒_场景图_初稿.png', type: '图片', size: '5.6 MB', dimensions: '3000×2000', updatedAt: '近7天 10:44', project: 'Noël 欧洲站', day: '近7天', favorite: true },
  { id: 'M-16', name: '红人合作_授权截图.png', type: '图片', size: '1.9 MB', dimensions: '1280×720', updatedAt: '近7天 17:55', project: 'GlowUp 美妆出海', day: '近7天' },
  { id: 'M-17', name: '短视频钩子_50条合集.md', type: '文案', size: '36 KB', dimensions: '—', updatedAt: '近7天 13:20', project: 'BlackFriday 大促', day: '近7天', favorite: true },
  { id: 'M-18', name: '降噪耳机_佩戴展示.mp4', type: '视频', size: '168 MB', dimensions: '1080×1920', duration: '00:52', updatedAt: '近7天 12:11', project: 'TechNova 北美', day: '近7天', enhanced: true },
]

export interface AssetElement {
  id: string
  name: string
  kind: '角色' | '地点' | '道具' | '模板' | '配音'
  used: number
}

export const assetElements: AssetElement[] = [
  { id: 'E1', name: '数字人艾米', kind: '角色', used: 12 },
  { id: 'E2', name: '实验室场景', kind: '地点', used: 7 },
  { id: 'E3', name: '产品展示台', kind: '道具', used: 15 },
  { id: 'E4', name: 'Coupon 模板', kind: '模板', used: 9 },
  { id: 'E5', name: '美式英语女声 A', kind: '配音', used: 21 },
  { id: 'E6', name: '露营基地外景', kind: '地点', used: 4 },
]

export const deletedAssets: Asset[] = [
  { id: 'D-1', name: '旧版KV_绿色调.png', type: '图片', size: '3.3 MB', dimensions: '2400×2400', updatedAt: '10-12 11:20', project: 'GlowUp 美妆出海', day: '近7天' },
  { id: 'D-2', name: '测试配音_草稿.mp3', type: '音频', size: '1.1 MB', dimensions: '—', updatedAt: '10-10 09:41', project: 'LinguaVoice 多语言', day: '近7天' },
  { id: 'D-3', name: '过时_黑五初版文案.docx', type: '文案', size: '18 KB', dimensions: '—', updatedAt: '10-08 16:02', project: 'BlackFriday 大促', day: '近7天' },
]

/* ---------------- 项目产出（全部生成） ---------------- */

export interface Generation {
  id: string
  projectId: string
  title: string
  type: '视频' | '图片' | '图文'
  duration?: string
  platform: Platform
  day: '今天' | '昨天' | '近7天'
  status: '已发布' | '待发布' | '草稿'
}

export const generations: Generation[] = [
  { id: 'G-01', projectId: 'P1', title: '精华实测 before/after · 悬念版', type: '视频', duration: '00:32', platform: 'TikTok', day: '今天', status: '待发布' },
  { id: 'G-02', projectId: 'P1', title: '质地微距特写 · 蒸汽氛围', type: '视频', duration: '00:18', platform: 'Instagram', day: '今天', status: '草稿' },
  { id: 'G-03', projectId: 'P1', title: '品牌 KV · 蓝白主视觉', type: '图片', platform: 'Instagram', day: '昨天', status: '已发布' },
  { id: 'G-04', projectId: 'P1', title: '成分党科普图文 · 烟酰胺', type: '图文', platform: 'X', day: '近7天', status: '已发布' },
  { id: 'G-05', projectId: 'P2', title: '露营投影实拍 · 星空顶', type: '视频', duration: '00:45', platform: 'YouTube', day: '今天', status: '待发布' },
  { id: 'G-06', projectId: 'P2', title: '篝火夜景 B-roll', type: '视频', duration: '01:05', platform: 'TikTok', day: '昨天', status: '草稿' },
  { id: 'G-07', projectId: 'P2', title: '降噪耳机佩戴展示', type: '视频', duration: '00:52', platform: 'TikTok', day: '近7天', status: '已发布' },
  { id: 'G-08', projectId: 'P3', title: '黑五倒计时海报', type: '图片', platform: 'Instagram', day: '昨天', status: '草稿' },
  { id: 'G-09', projectId: 'P4', title: '圣诞礼盒平铺图', type: '图片', platform: 'Instagram', day: '今天', status: '待发布' },
  { id: 'G-10', projectId: 'P4', title: '德法双语促销口播', type: '视频', duration: '00:58', platform: 'Facebook', day: '近7天', status: '已发布' },
  { id: 'G-11', projectId: 'P5', title: '数字人口播 · 泰语版', type: '视频', duration: '01:12', platform: 'TikTok', day: '近7天', status: '已发布' },
  { id: 'G-12', projectId: 'P5', title: '数字人口播 · 越南语版', type: '视频', duration: '01:10', platform: 'TikTok', day: '近7天', status: '已发布' },
]

/* ---------------- 项目商品 ---------------- */

export interface Product {
  id: string
  projectId: string
  name: string
  price: string
  sellingPoint: string
  sales: string
  desc?: string
  link?: string
  points?: string[]
}

export const products: Product[] = [
  {
    id: 'PR-1', projectId: 'P1', name: '烟酰胺焕肤精华 30ml', price: '$29.9', sellingPoint: '28 天提亮一个度', sales: '月销 4.2w',
    desc: '10% 高浓度烟酰胺复配神经酰胺，主打提亮肤色与屏障修护，质地清爽不粘腻，适合北美秋季干燥气候下的日常护肤场景。',
    link: 'https://glowupbeauty.com/products/niacinamide-serum',
    points: ['10% 烟酰胺 + 神经酰胺，提亮修护双效合一', '清爽水润质地，叠涂不搓泥', '通过皮肤科测试，敏感肌可用', '28 天实测提亮一个色阶，附对比报告'],
  },
  {
    id: 'PR-2', projectId: 'P1', name: '透明质酸保湿面霜', price: '$24.9', sellingPoint: '72h 长效锁水', sales: '月销 2.8w',
    desc: '三重分子量透明质酸分层补水，72 小时长效锁水，冰淇淋质地一抹化水，秋冬妆前打底不卡粉。',
    link: 'https://glowupbeauty.com/products/ha-moisture-cream',
    points: ['三重 HA 分层渗透，补水直达肌底', '72h 锁水力实测认证', '妆前打底不搓泥不卡粉', '无香精无酒精，敏感肌友好'],
  },
  {
    id: 'PR-3', projectId: 'P2', name: '便携迷你投影仪', price: '$199', sellingPoint: '680g 随身巨幕', sales: '月销 1.5w',
    desc: '680g 掌心大小的便携投影仪，1080P 物理分辨率，自动对焦 + 自动梯形校正，露营、宿舍、出差随处投出 120 英寸巨幕。',
    link: 'https://technova.store/products/mini-projector-x1',
    points: ['680g 便携机身，口袋里的电影院', '1080P 物理分辨率，支持 4K 解码', '自动对焦 + 梯形校正，开机即看', '内置电池续航 2.5h，露营可用'],
  },
  {
    id: 'PR-4', projectId: 'P2', name: '主动降噪耳机', price: '$89', sellingPoint: '-42dB 深度降噪', sales: '月销 3.1w',
    desc: '旗舰级 -42dB 混合主动降噪，40mm 复合振膜单元，60 小时超长续航，支持双设备连接与通透模式。',
    link: 'https://technova.store/products/anc-headphones-pro',
    points: ['-42dB 深度降噪，通勤地铁瞬间安静', '40mm 复合振膜，Hi-Res 金标认证', '60h 超长续航，充电 10 分钟听 5 小时', '双设备无缝切换，办公娱乐两不误'],
  },
  {
    id: 'PR-5', projectId: 'P4', name: '圣诞倒数礼盒', price: '€49.9', sellingPoint: '12 格盲盒惊喜', sales: '月销 9k',
    desc: '12 格盲盒式圣诞倒数礼盒，内含香薰、手作皂、迷你蜡烛等节日好物，德法双语包装，节日送礼与自用皆宜。',
    link: 'https://noel-market.eu/products/advent-gift-box',
    points: ['12 格盲盒设计，每天一个节日惊喜', '内含香薰蜡烛等 12 件手作好物', '德法双语包装，本地化送礼首选', '限量编号款，附赠祝福贺卡'],
  },
]

export interface Project {
  id: string
  name: string
  color: string
  desc: string
  status: '进行中' | '未开始' | '已结束'
  progress: number
  start: string
  end: string
  owner: string
  platforms: Platform[]
  exposure: string
  engagement: string
  contentCount: number
  pinned?: boolean
}

export const projects: Project[] = [
  { id: 'P1', name: 'GlowUp 美妆出海', color: '#f472b6', desc: '烟酰胺焕肤精华北美秋季宣发，主打成分实测与 before/after 内容', status: '进行中', progress: 68, start: '10-08', end: '11-15', owner: '林悦', platforms: ['TikTok', 'Instagram', 'YouTube'], exposure: '1.2M', engagement: '8.4%', contentCount: 46 },
  { id: 'P2', name: 'TechNova 北美', color: '#11a3fd', desc: '便携投影仪与降噪耳机测评矩阵，YouTube 长视频 + Shorts 组合', status: '进行中', progress: 42, start: '10-12', end: '12-01', owner: '陈默', platforms: ['YouTube', 'TikTok'], exposure: '860K', engagement: '7.1%', contentCount: 28 },
  { id: 'P3', name: 'BlackFriday 大促', color: '#f59e0b', desc: '黑五 Coupon 批量分发，覆盖德法美三市场，倒计时冲刺节奏', status: '未开始', progress: 0, start: '11-01', end: '11-29', owner: '林悦', platforms: ['Facebook', 'Instagram', 'X'], exposure: '—', engagement: '—', contentCount: 0 },
  { id: 'P4', name: 'Noël 欧洲站', color: '#10b981', desc: '圣诞礼盒场景图文与短视频，德法双语本地化', status: '进行中', progress: 25, start: '10-15', end: '12-20', owner: '苏航', platforms: ['Instagram', 'Facebook'], exposure: '210K', engagement: '5.9%', contentCount: 15 },
  { id: 'P5', name: 'LinguaVoice 多语言', color: '#8b5cf6', desc: 'AI 数字人口播东南亚六国本地化测试', status: '已结束', progress: 100, start: '09-01', end: '10-10', owner: '苏航', platforms: ['TikTok'], exposure: '640K', engagement: '6.2%', contentCount: 32 },
]

const PROJECTS_KEY = 'chuhai-extra-projects'
const PROJECT_META_KEY = 'chuhai-project-meta'
const PROJECT_COLORS = ['#11a3fd', '#f472b6', '#f59e0b', '#10b981', '#8b5cf6', '#1769ff', '#06b6d4']

interface ProjectMeta {
  deletedIds: string[]
  pinnedIds: string[]
  nameOverrides: Record<string, string>
}

const emptyMeta = (): ProjectMeta => ({ deletedIds: [], pinnedIds: [], nameOverrides: {} })

function loadExtraProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (raw) return JSON.parse(raw) as Project[]
  } catch { /* 忽略解析失败 */ }
  return []
}

function saveExtraProjects(extras: Project[]) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(extras)) } catch { /* 忽略 */ }
}

function loadMeta(): ProjectMeta {
  try {
    const raw = localStorage.getItem(PROJECT_META_KEY)
    if (raw) return { ...emptyMeta(), ...(JSON.parse(raw) as ProjectMeta) }
  } catch { /* 忽略 */ }
  return emptyMeta()
}

function saveMeta(meta: ProjectMeta) {
  try { localStorage.setItem(PROJECT_META_KEY, JSON.stringify(meta)) } catch { /* 忽略 */ }
}

function notifyProjectsChanged() {
  try { window.dispatchEvent(new Event('chuhai-projects-changed')) } catch { /* SSR */ }
}

/** 置顶在前，其余：用户新建在前、种子项目在后 */
export function loadProjects(): Project[] {
  const meta = loadMeta()
  const deleted = new Set(meta.deletedIds)
  const extras = loadExtraProjects().filter((p) => !deleted.has(p.id))
  const seed = projects.filter((p) => !deleted.has(p.id))
  const seen = new Set<string>()
  const merged: Project[] = []
  for (const p of [...extras, ...seed]) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    merged.push({
      ...p,
      name: meta.nameOverrides[p.id] ?? p.name,
      pinned: meta.pinnedIds.includes(p.id),
    })
  }
  merged.sort((a, b) => {
    const ai = meta.pinnedIds.indexOf(a.id)
    const bi = meta.pinnedIds.indexOf(b.id)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  return merged
}

export function addProject(project: Project) {
  const extras = loadExtraProjects().filter((p) => p.id !== project.id)
  extras.unshift(project)
  saveExtraProjects(extras)
  notifyProjectsChanged()
}

export function renameProject(id: string, name: string) {
  const next = name.trim()
  if (!next) return
  const extras = loadExtraProjects()
  const idx = extras.findIndex((p) => p.id === id)
  if (idx >= 0) {
    extras[idx] = { ...extras[idx], name: next }
    saveExtraProjects(extras)
  }
  const meta = loadMeta()
  meta.nameOverrides[id] = next
  saveMeta(meta)
  notifyProjectsChanged()
}

export function togglePinProject(id: string) {
  const meta = loadMeta()
  const i = meta.pinnedIds.indexOf(id)
  if (i >= 0) meta.pinnedIds.splice(i, 1)
  else meta.pinnedIds.unshift(id)
  saveMeta(meta)
  notifyProjectsChanged()
}

export function deleteProject(id: string) {
  saveExtraProjects(loadExtraProjects().filter((p) => p.id !== id))
  const meta = loadMeta()
  if (!meta.deletedIds.includes(id)) meta.deletedIds.push(id)
  meta.pinnedIds = meta.pinnedIds.filter((x) => x !== id)
  delete meta.nameOverrides[id]
  saveMeta(meta)
  notifyProjectsChanged()
}

export function createNamedProject(name: string): Project {
  return createProjectFromBrief(name)
}

export function createProjectFromBrief(brief: string): Project {
  const trimmed = brief.trim()
  const now = new Date()
  const stamp = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const name = trimmed
    ? (trimmed.length > 18 ? `${trimmed.slice(0, 18)}…` : trimmed)
    : '未命名'
  const extras = loadExtraProjects()
  return {
    id: `P-${Date.now()}`,
    name,
    color: PROJECT_COLORS[extras.length % PROJECT_COLORS.length],
    desc: trimmed || '从自由创作发起的视频生成项目',
    status: '进行中',
    progress: 5,
    start: stamp.slice(0, 5),
    end: '—',
    owner: '林悦',
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    exposure: '—',
    engagement: '—',
    contentCount: 0,
  }
}

/* ---------------- 妙记（AI 灵感对话自动保存） ---------------- */

export interface IdeaNote {
  id: string
  title: string
  summary: string
  time: string
  platforms: string[]
  messages: { role: 'user' | 'ai'; text: string }[]
}

const NOTES_KEY = 'chuhai-idea-notes'

const seedNotes: IdeaNote[] = [
  {
    id: 'N-1', title: '便携咖啡机 · 露营场景宣发', time: '10-20 15:42',
    summary: '面向北美户外爱好者的露营咖啡内容系列，短视频 + 图文组合，主打便携与仪式感，黑五前 3 周蓄水。',
    platforms: ['TikTok', 'Instagram'],
    messages: [
      { role: 'user', text: '便携咖啡机、露营场景、北美年轻人、黑五前预热，预算不高' },
      { role: 'ai', text: '已整理为「户外移动咖啡馆」露营场景系列：主打 3 分钟现磨 + 680g 便携 + 出片属性，推荐 TikTok / Instagram 短视频，附 3 条钩子文案与 #CampingCoffee 话题。' },
    ],
  },
  {
    id: 'N-2', title: '桌面氛围好物 · 打工人系列', time: '10-18 11:05',
    summary: '都市白领工位改造剧情向内容，单场景可批量产出，适合日更账号，周四周五发布互动更高。',
    platforms: ['TikTok', 'X'],
    messages: [
      { role: 'user', text: '办公桌改造、治愈系、预算不高、想日更' },
      { role: 'ai', text: '已整理为「办公室第三空间」桌面氛围系列：用一天时间线带出 3 个使用 moment，推荐 TikTok 剧情短片 + X Thread 长帖组合。' },
    ],
  },
]

export function loadIdeaNotes(): IdeaNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (raw) return JSON.parse(raw) as IdeaNote[]
  } catch { /* 忽略解析失败 */ }
  return seedNotes
}

export function addIdeaNote(note: IdeaNote) {
  const notes = loadIdeaNotes().filter((n) => n.id !== note.id)
  notes.unshift(note)
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)) } catch { /* 忽略写入失败 */ }
}
