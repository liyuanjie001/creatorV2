import type { Film, GenerationJob, PlatformContent, PublishTask, StudioState } from '@/types/studio';
export type VideoRow = {
  id: string;
  film?: Film;
  job?: GenerationJob;
  task?: PublishTask;
  content?: PlatformContent;
  title: string;
  date: string;
  generation: GenerationDisplay;
  source: string;
  publishStatus: string;
};
export const activePublish = ['待发布', '已排期', '发布中'];
export function sourceName(film?: Film) {
  if (film?.resultKind === 'script-breakdown') return '脚本拆解';
  return !film
    ? 'TK 历史内容'
    : film.source === '本地上传'
      ? '本地上传'
      : film.reference
        ? '爆款复刻'
        : film.source === '专家创作'
          ? '专家模式'
          : '自由创作';
}
export function dateTime(value?: string) {
  return value
    ? new Date(value).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '—';
}
export function scheduledDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'shortOffset',
  }).format(date);
  return `${formatted} Los Angeles`;
}
export function publishStatusLabel(value: string) {
  return value === '已排期' ? '定时发布' : value;
}
export type GenerationDisplay = '生成中' | '生成成功' | '生成失败' | '未提供';
export type PublishDisplay = '未发布' | '待发布' | '定时发布' | '发布中' | '发布成功' | '发布失败' | '已取消';
export function workPublishStatus(row: VideoRow): PublishDisplay | '—' {
  if (row.film?.resultKind === 'script-breakdown') return '—';
  return (row.publishStatus === '待配置' ? '未发布' : publishStatusLabel(row.publishStatus)) as PublishDisplay;
}
export function isSubmittedTask(t: PublishTask) { return t.status !== '待配置' && (t.status !== '已取消' || !!t.submittedAt || t.attempt > 0); }
export function latestSubmittedTask(tasks: PublishTask[]) {
  return tasks.filter(isSubmittedTask)
    .sort((a, b) => (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt))[0];
}
export type VideoAction = { id: 'publish' | 'retry' | 'download' | 'regenerate' | 'modify' | 'analytics' | 'reschedule' | 'cancel' | 'delete'; label: string; reason: string; primary?: boolean };
export function videoActions(state: StudioState, row: VideoRow, published: boolean, missing = false): VideoAction[] {
  const archived = !!state.projects.find(p => p.id === row.film?.projectId || p.id === row.task?.projectId || row.content?.projectIds.includes(p.id))?.archived;
  const locked = archived ? '项目已归档' : '';
  const running = !!row.job && ['等待中', '生成中'].includes(row.job.status);
  const active = state.tasks.some(t => t.filmId === row.film?.id && activePublish.includes(t.status));
  const success = state.tasks.some(t => t.filmId === row.film?.id && t.status === '发布成功');
  const ai = !!row.film && row.film.source !== '本地上传';
  const mediaMissing = missing || !!row.film && (row.film.type === '图文' || row.film.source === '本地上传') && !row.film.mediaIds.length;
  const actions: VideoAction[] = [];
  if (row.film?.resultKind === 'script-breakdown') {
    if (row.job && !running) actions.push({ id: 'retry', label: '重试拆解', reason: locked, primary: true });
    if (!published) actions.push({ id: 'delete', label: '删除', reason: locked || (running ? '拆解中不可删除' : '') });
    return actions;
  }
  if (row.job) {
    if (!running) actions.push({ id: 'retry', label: '重试生成', reason: locked, primary: true });
  } else {
    if (row.task?.status === '已排期') actions.push({id:'reschedule',label:'改期',reason:locked,primary:true},{id:'cancel',label:'取消排期',reason:locked});
    actions.push({ id:'publish', label: row.publishStatus === '发布失败' ? '重新配置' : row.publishStatus === '发布成功' || success ? '再次发布' : '去发布', reason: locked || (mediaMissing ? '本地媒体已丢失，请重新上传' : publishReason(state,row,archived)), primary: !active });
    actions.push({ id:'download',label:'下载',reason: !row.film ? '没有可下载的本地成片' : mediaMissing ? '本地媒体已丢失，请重新上传' : '' });
    if (ai) actions.push({id:'regenerate',label:'重新生成',reason:locked});
  }
  if (ai && !running) actions.push({id:'modify',label:row.job?'修改后生成':row.film?.type==='图文'?'修改图文':'修改视频',reason:locked});
  if (row.content) actions.push({id:'analytics',label:'查看数据',reason:''});
  if (!published) actions.push({id:'delete',label:'删除',reason:locked || (running ? '生成中的任务不可删除' : state.tasks.some(t=>t.filmId===row.film?.id&&t.status==='发布中') ? '正在发布，请等待平台确认' : '')});
  return actions;
}
export function duration(value?: string) {
  const n = Number(value);
  return value && Number.isFinite(n)
    ? `${Math.floor(n / 60)
        .toString()
        .padStart(2, '0')}:${Math.floor(n % 60)
        .toString()
        .padStart(2, '0')}`
    : '—';
}
export function cover(id: string) {
  return `/images/creation-covers/cover-${([...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3) + 1}.jpg`;
}
export function privacyName(value?: string) {
  return (
    (
      {
        PUBLIC_TO_EVERYONE: '所有人',
        MUTUAL_FOLLOW_FRIENDS: '互相关注的好友',
        SELF_ONLY: '仅自己',
      } as Record<string, string>
    )[value || ''] || '未提供'
  );
}
export function metrics(row: VideoRow) {
  return row.publishStatus === '发布成功' && row.content?.collection === '可用'
    ? [...row.content.snapshots].sort((a, b) => b.date.localeCompare(a.date))[0]
    : undefined;
}
export function mediaTypeName(row: VideoRow) {
  if (row.film?.resultKind === 'script-breakdown') return '脚本拆解';
  return row.film?.type === '图文' || row.content?.type === '图文' ? '图集' : '视频';
}
export function metricReason(row: VideoRow) {
  return row.publishStatus !== '发布成功'
    ? '尚未发布，无统计数据'
    : row.content?.collection === '可用' && !metrics(row)
      ? '暂无指标快照'
      : row.content?.collection || '未采集';
}
export function videoRows(state: StudioState, projectId: string, published: boolean): VideoRow[] {
  const contents = state.content.filter((c) => c.projectIds.includes(projectId));
  const tasks = state.tasks.filter((t) => t.projectId === projectId);
  const local = state.films.filter((f) => f.projectId === projectId);
  const rowFor = (
    film?: Film,
    job?: GenerationJob,
    task?: PublishTask,
    content?: PlatformContent,
  ): VideoRow => ({
    id: (published ? task?.id : film?.id) || content?.id || task?.id || job!.id,
    film,
    job,
    task,
    content,
    title: published
      ? [task?.title ?? content?.title ?? film?.title, task?.tags].filter(Boolean).join(' ')
      : (film?.title ?? content?.title ?? job!.film.title),
    date: published
      ? task?.publishedAt ||
        content?.publishedAt ||
        task?.updatedAt ||
        task?.submittedAt ||
        task?.createdAt ||
        ''
      : job?.createdAt || film?.createdAt || content?.publishedAt || '',
    generation: job ? ['等待中','生成中'].includes(job.status) ? '生成中' : '生成失败' : film ? '生成成功' : '未提供',
    source: sourceName(film),
    publishStatus: task?.status || (content ? '发布成功' : '未发布'),
  });
  if (published) {
    const rows = tasks
      .filter(t => isSubmittedTask(t) && !local.some(f => f.id === t.filmId && f.resultKind === 'script-breakdown'))
      .map((t) =>
        rowFor(
          local.find((f) => f.id === t.filmId),
          undefined,
          t,
          state.content.find((c) => c.id === t.platformId),
        ),
      );
    for (const content of contents)
      if (!local.some(f => f.id === content.filmId && f.resultKind === 'script-breakdown') && !rows.some((r) => r.content?.id === content.id))
        rows.push(
          rowFor(
            local.find((f) => f.id === content.filmId),
            undefined,
            undefined,
            content,
          ),
        );
    return rows;
  }
  const rows = local.map((f) => {
    const task = latestSubmittedTask(tasks.filter(t => t.filmId === f.id));
    return rowFor(
      f,
      undefined,
      task,
      contents.find((c) => c.id === task?.platformId) ||
        (!task ? contents.find((c) => c.filmId === f.id) : undefined),
    );
  });
  for (const job of state.jobs.filter(
    (j) => j.projectId === projectId && j.status !== '已完成' && !local.some((f) => f.id === j.id),
  ))
    rows.push(rowFor({ ...job.film, id: job.id, createdAt: job.createdAt || '' }, job));
  for (const content of contents)
    if (
      !rows.some((r) => (!!content.filmId && r.film?.id === content.filmId) || r.content?.id === content.id)
    )
      rows.push(rowFor(undefined, undefined, undefined, content));
  return rows;
}
export function publishReason(state: StudioState, row: VideoRow, archived: boolean) {
  if (row.film?.resultKind === 'script-breakdown') return '脚本拆解不能发布';
  if (archived) return '项目已归档';
  if (!row.film || row.job) return '需要可用的本地成片';
  if (row.film.source === '本地上传' && row.film.type === '视频' && !row.film.mediaIds.length) return '本机没有可用媒体，请重新上传';
  return state.tasks.some((t) => t.filmId === row.film!.id && activePublish.includes(t.status))
    ? '已有执行中的发布任务'
    : '';
}
