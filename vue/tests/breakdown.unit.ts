import { beforeEach, expect, test, vi } from 'vitest';
import { identityService } from '@/services/identity';
import {
  studio,
  createProject,
  blankAttributes,
  startBreakdown,
  tickStudio,
  ensurePublishTask,
  retryGeneration,
} from '@/services/studio';
import { mockBreakdown, breakdownText } from '@/services/breakdown';
import { videoRows, videoActions, workPublishStatus } from '@/services/videoManagement';
beforeEach(() => {
  localStorage.clear();
  identityService.demo();
  studio.value.projects = [];
  studio.value.jobs = [];
  studio.value.films = [];
  studio.value.tasks = [];
  studio.value.content = [];
});
function input() {
  const p = createProject('拆解');
  return {
    projectId: p.id,
    title: '拆解结果',
    reference: {
      id: 'ref',
      title: '原视频',
      url: 'https://example.com/video.mp4',
      source: '链接',
      author: '',
      duration: '',
    },
    type: '视频' as const,
    source: '普通创作' as const,
    duration: '',
    ratio: '',
    quality: '',
    brief: '',
    resultKind: 'script-breakdown' as const,
    breakdownScript: mockBreakdown(),
    productIds: [],
    version: 1,
    mediaIds: [],
    inPublishing: false,
    attributes: blankAttributes(),
  };
}
test('拆解恢复完成，不创建发布任务且禁止发布', async () => {
  const film = input();
  const job = startBreakdown(film);
  expect(JSON.parse(localStorage.getItem('chuhai-studio-v1:demo')!).jobs[0].id).toBe(job.id);
  await tickStudio(Date.now() + 6000);
  const row = videoRows(studio.value, film.projectId, false)[0]!;
  expect(workPublishStatus(row)).toBe('—');
  expect(videoActions(studio.value, row, false).map((x) => x.id)).toEqual(['delete']);
  expect(() => ensurePublishTask(row.film!)).toThrow('不能发布');
  expect(videoRows(studio.value, film.projectId, true)).toEqual([]);
  expect(breakdownText(row.film!)).toContain('口播');
});
test('归档与存储失败不创建任务', () => {
  const film = input();
  studio.value.projects[0]!.archived = true;
  expect(() => startBreakdown(film)).toThrow('归档');
  studio.value.projects[0]!.archived = false;
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => startBreakdown(film)).toThrow('保存失败');
  expect(studio.value.jobs).toHaveLength(0);
  spy.mockRestore();
});

test('失败任务可重试，缺少视频被拒绝，旧结果类别兼容', async () => {
  const film = input();
  expect(() => startBreakdown({ ...film, reference: undefined })).toThrow('上传视频');
  const job = startBreakdown(film);
  job.fail = true;
  await tickStudio(Date.now() + 6000);
  expect(job.status).toBe('生成失败');
  expect(studio.value.films).toHaveLength(0);
  retryGeneration(job.id);
  await tickStudio(Date.now() + 6000);
  expect(studio.value.films).toHaveLength(1);
  const legacy = { ...studio.value.films[0]!, resultKind: undefined };
  expect(workPublishStatus({ ...videoRows(studio.value, film.projectId, false)[0]!, film: legacy })).toBe(
    '未发布',
  );
});
test('结果保存失败不展示完成，恢复存储后继续', async () => {
  const job = startBreakdown(input());
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  await tickStudio(Date.now() + 6000);
  expect(job.status).toBe('生成中');
  expect(studio.value.films).toHaveLength(0);
  spy.mockRestore();
  await tickStudio(Date.now() + 6000);
  expect(job.status).toBe('已完成');
});
