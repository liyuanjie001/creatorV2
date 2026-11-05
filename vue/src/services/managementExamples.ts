import type { Film, PublishStatus, PublishTask, StudioState } from '@/types/studio';
import { saveMedia } from './media';
const attributes = () => ({
  theme: '商品种草',
  product: '精华',
  hook: '问题开场',
  scene: '日常生活',
  format: '产品展示',
  confirmed: true,
});
export const MANAGEMENT_EXAMPLES_VERSION = 1;
export function upgradeManagementExamples(state: StudioState, clock = Date.now()) {
  if (
    (state.managementExamplesVersion ?? 0) >= MANAGEMENT_EXAMPLES_VERSION ||
    !state.projects.some((p) => p.id === 'P1')
  )
    return;
  const stamp = (hours: number) => new Date(clock - hours * 3600000).toISOString();
  function film(
    key: string,
    title: string,
    source: Film['source'] = '普通创作',
    type: Film['type'] = '视频',
  ) {
    const value: Film = {
      id: `management-${key}`,
      projectId: 'P1',
      title,
      type,
      source,
      createdAt: stamp(2),
      duration: '15',
      ratio: '9:16',
      quality: '1080P',
      brief: '展示产品质地与日常使用场景，突出核心卖点。',
      productIds: [],
      version: 1,
      mediaIds: [],
      inPublishing: false,
      attributes: attributes(),
    };
    if (!state.films.some((f) => f.id === value.id)) state.films.push(value);
    return state.films.find((f) => f.id === value.id)!;
  }
  function task(f: Film, status: PublishStatus, suffix = '', hours = 1): PublishTask {
    const value: PublishTask = {
      id: `${f.id}-task${suffix}`,
      projectId: 'P1',
      filmId: f.id,
      batchId: 'management-examples',
      accountId: 'tk-glow',
      title: f.title,
      tags: '#护肤',
      privacy: 'PUBLIC_TO_EVERYONE',
      comments: true,
      duet: true,
      stitch: true,
      ai: true,
      commercial: false,
      cover: '首帧',
      photoMusic: false,
      scheduledAt: status === '已排期' ? new Date(clock + 86400000).toISOString() : '',
      status,
      createdAt: stamp(hours + 1),
      submittedAt: status === '待配置' ? undefined : stamp(hours),
      updatedAt: stamp(hours),
      dueAt: clock + 1000,
      simulateFailure: false,
      attempt: status === '待配置' ? 0 : 1,
      demoPreview: ['待发布', '已排期', '发布中'].includes(status),
    };
    if (status === '发布失败') value.error = '平台暂时繁忙，请重新配置后重试（演示）';
    if (status === '发布成功') {
      value.publishedAt = stamp(hours);
      value.platformId = `${value.id}-content`;
      if (!state.content.some((c) => c.id === value.platformId))
        state.content.push({
          id: value.platformId,
          filmId: f.id,
          accountId: value.accountId,
          projectIds: ['P1'],
          title: f.title,
          type: f.type,
          publishedAt: stamp(hours),
          attributes: attributes(),
          snapshots: [{ date: stamp(hours).slice(0, 10), views: 0, likes: 0, comments: 0, shares: 0 }],
          collection: '可用',
        });
    }
    if (!state.tasks.some((t) => t.id === value.id)) state.tasks.push(value);
    return value;
  }
  for (const [key, title, status] of [
    ['pending', '产品故事 · 待发布（演示）', '待发布'],
    ['scheduled', '品牌日记 · 已排期（演示）', '已排期'],
    ['publishing', '好物分享 · 发布中（演示）', '发布中'],
    ['failed', '日常测评 · 发布失败（演示）', '发布失败'],
    ['cancelled', '品牌短片 · 已取消（演示）', '已取消'],
  ] as const)
    task(film(key, title), status);
  const drafted = film('success-draft', '护肤实测 · 成功后创建草稿（演示）', '专家创作');
  task(drafted, '发布成功', '-success', 4);
  task(drafted, '待配置', '-draft', 1);
  const failed = film('success-failed', '精华推荐 · 再次发布失败（演示）');
  task(failed, '发布成功', '-success', 5);
  task(failed, '发布失败', '-failed', 1);
  const cancelled = film('success-cancelled', '护肤心得 · 再次发布取消（演示）');
  task(cancelled, '发布成功', '-success', 5);
  task(cancelled, '发布成功', '-success-2', 3);
  task(cancelled, '已取消', '-cancelled', 1);
  film('photo', '产品图集 · 图片可用（演示）', '本地上传', '图文');
  film('photo-missing', '产品图集 · 媒体缺失（演示）', '本地上传', '图文');
  const cancelledJob = {
    id: 'management-generation-cancelled',
    projectId: 'P1',
    demoPreview: true,
    status: '已取消' as const,
    dueAt: 0,
    fail: false,
    createdAt: stamp(1),
    film: { ...drafted, title: '创意短片 · 生成已取消（演示）' },
  };
  if (!state.jobs.some((j) => j.id === cancelledJob.id)) state.jobs.push(cancelledJob);
  const reference = state.content.find((c) => !c.filmId);
  if (reference)
    for (const collection of ['未采集', '采集失败'] as const) {
      const id = `management-external-${collection}`;
      if (!state.content.some((c) => c.id === id))
        state.content.push({
          ...reference,
          attributes: { ...reference.attributes },
          id,
          projectIds: ['P1'],
          title: `历史内容 · ${collection}（演示）`,
          snapshots: [],
          collection,
        });
    }
  state.managementExamplesVersion = MANAGEMENT_EXAMPLES_VERSION;
}
// Bundled images exercise the same IndexedDB path as user uploads.
export async function initializeExampleMedia(state: StudioState) {
  const f = state.films.find((f) => f.id === 'management-photo');
  if (!f || state.managementMediaInitialized) return;
  const ids: string[] = [];
  for (const n of [1, 2]) {
    const response = await fetch(`${import.meta.env.BASE_URL}images/creation-covers/cover-${n}.jpg`);
    if (!response.ok) throw new Error('无法加载演示图片');
    ids.push(
      await saveMedia('demo', new File([await response.blob()], `example-${n}.jpg`, { type: 'image/jpeg' })),
    );
  }
  f.mediaIds = ids;
  state.managementMediaInitialized = true;
}
