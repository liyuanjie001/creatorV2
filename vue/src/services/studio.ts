import { ref, watch } from 'vue';
import { projects as legacyProjects, products as legacyProducts } from '@/data/mock';
import type { ContentAttributes, Film, GenerationJob, PlatformContent, PublishTask, Reference, StudioProject, StudioState } from '@/types/studio';
import { currentUser } from './identity';
import { now, readJSON, uid, writeJSON } from './storage';
import { getMedia, saveMedia } from './media';
export const blankAttributes = (): ContentAttributes => ({ theme: '商品种草', product: '未分类', hook: '问题开场', scene: '日常生活', format: '产品展示', confirmed: false });
function seed(owner: string): StudioState {
  const demo = owner === 'demo';
  const state: StudioState = { version: 1, projects: demo ? legacyProjects.filter(p => !p.id.startsWith('P-')).map(p => ({ id: p.id, name: p.name, desc: p.desc, color: p.color, accountIds: ['tk-glow'], archived: false })) : [], accounts: demo ? [{ id: 'tk-glow', name: 'GlowUp Official', handle: '@glowup.official', region: '美国（运营填写）', groupId: 'group-brand', note: '品牌主帐号', status: '已授权', authorizedAt: now() }, { id: 'tk-life', name: 'Daily Life', handle: '@daily.life', region: '未提供', groupId: 'ungrouped', note: '', status: '授权过期', authorizedAt: now() }] : [], groups: [{ id: 'ungrouped', name: '未分组' }, ...(demo ? [{ id: 'group-brand', name: '品牌帐号' }] : [])], films: [], tasks: [], content: [], sessions: [], jobs: [], favorites: [], references: [], products: demo ? structuredClone(legacyProducts) : [], hiddenHot: false };
  if (demo) {
    for (let i = 0; i < 8; i++) {
      const attributes = { ...blankAttributes(), theme: i % 2 ? '使用测评' : '商品种草', hook: i % 2 ? '对比反差' : '问题开场', confirmed: true };
      const publishedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      const snapshots = Array.from({ length: i + 2 }, (_, j) => ({ date: new Date(new Date(publishedAt).getTime() + j * 86400000).toISOString().slice(0, 10), views: (j + 1) * (731 + i * 216), likes: (j + 1) * (32 + i * 7), comments: (j + 1) * (3 + i), shares: (j + 1) * (7 + i) }));
      state.content.push({ id: `external-${i}`, accountId: 'tk-glow', projectIds: i < 2 ? ['P1'] : [], title: ['晨间护肤的正确打开方式', '7 天实测，记录真实变化', '你的精华用对了吗', '一瓶精华的旅行日记'][i % 4]!, type: i === 3 ? '图文' : '视频', publishedAt, attributes, snapshots, collection: i === 7 ? '采集失败' : '可用' });
    }
    state.films.push({ id: 'film-demo', projectId: 'P1', title: 'GlowUp 晨间护肤日记 · 三分钟打造自然透亮的日常好气色', type: '视频', source: '普通创作', createdAt: now(), duration: '15', ratio: '9:16', quality: '1080P', brief: '以晨间护肤场景展现产品卖点', productIds: [], version: 1, mediaIds: [], inPublishing: true, attributes: blankAttributes() });
  }
  return state;
}
// Upgrade demo workspaces once; existing creations and user edits remain intact.
function addCreationExamples(state: StudioState) {
  if (state.creationExamplesAdded || !state.projects.some(p => p.id === 'P1')) return;
  const reference: Reference = { id: 'reference-demo-remake', url: 'https://www.tiktok.com/@creator.demo/video/1234567890', title: '三秒抓住注意力 · 护肤好物实测（演示）', author: '@creator.demo', duration: '00:24', source: 'TikTok' };
  if (!state.references.some(r => r.id === reference.id)) state.references.push(reference);
  const examples: Film[] = [
    { id: 'film-example-free', title: '晨间护肤故事 · 从洁面到精华的轻松护肤流程与真实使用体验', source: '普通创作', ratio: '9:16', duration: '15', quality: '1080P', brief: '以晨间护肤场景展现产品卖点。' },
    { id: 'film-example-expert', title: '精华成分深度解析 · 烟酰胺与玻尿酸如何搭配打造水润透亮肌肤', source: '专家创作', ratio: '4:3', duration: '30', quality: '720P', brief: '通过成分讲解、使用分镜与效果总结，呈现产品价值。' },
    { id: 'film-example-remake', title: '三秒吸睛开场 · 换季护肤常见误区与 GlowUp 精华七天实测分享', source: '普通创作', ratio: '9:16', duration: '24', quality: '1080P', brief: '参考爆款的 Hook 和节奏，创作新的产品测评视频。', reference },
    { id: 'film-example-upload', title: 'GlowUp 精华产品实拍 · 包装细节、质地展示与上脸使用全记录', source: '本地上传', ratio: '4:3', duration: '45', quality: '720P', brief: '本地上传来源的演示记录，未附带真实媒体文件。' },
  ].map((item, index) => ({ ...item, projectId: 'P1', type: '视频' as const, source: item.source as Film['source'], createdAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(), productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: blankAttributes() }));
  state.films.push(...examples.filter(f => !state.films.some(existing => existing.id === f.id)));
  state.creationExamplesAdded = true;
}
function addCreationStatusExamples(state: StudioState) {
  if (state.creationStatusExamplesAdded || !state.projects.some(p => p.id === 'P1')) return;
  const statuses = ['生成中', '等待中', '生成失败'] as const;
  const examples: GenerationJob[] = statuses.map((status, index) => ({
    id: `job-status-example-${index}`, projectId: 'P1', demoPreview: true,
    status, createdAt: new Date(Date.now() - index * 60000).toISOString(), dueAt: 0, fail: status === '生成失败',
    film: { projectId: 'P1', title: ['产品展示短片 · 生成中（演示）', '品牌故事视频 · 等待中（演示）', '好物测评视频 · 失败（演示）'][index]!, source: index === 1 ? '专家创作' : '普通创作', type: '视频', ratio: index === 1 ? '4:3' : '9:16', duration: index === 1 ? '30' : '15', quality: '1080P', brief: '创作状态展示示例，失败后可重试体验任务操作。', productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: blankAttributes() },
  }));
  state.jobs.unshift(...examples.filter(job => !state.jobs.some(existing => existing.id === job.id)));
  state.creationStatusExamplesAdded = true;
}
function load(owner: string) {
  const value = readJSON<StudioState>(`chuhai-studio-v1:${owner}`, () => seed(owner));
  const state = value?.version === 1 && Array.isArray(value.projects) && Array.isArray(value.tasks) ? value : seed(owner);
  for (const task of state.tasks) {
    const content = state.content.find(c => c.id === task.platformId);
    if (!task.publishedAt && content) task.publishedAt = content.publishedAt;
  }
  if (owner === 'demo') {
    addCreationExamples(state);
    addCreationStatusExamples(state);
    const exampleTitles: Record<string, [string, string]> = {
      'film-demo': ['GlowUp · 晨间护肤短片', 'GlowUp 晨间护肤日记 · 三分钟打造自然透亮的日常好气色'],
      'film-example-free': ['自由创作 · 晨间护肤故事', '晨间护肤故事 · 从洁面到精华的轻松护肤流程与真实使用体验'],
      'film-example-expert': ['专家模式 · 精华成分解析', '精华成分深度解析 · 烟酰胺与玻尿酸如何搭配打造水润透亮肌肤'],
      'film-example-remake': ['爆款复刻 · 三秒吸睛开场', '三秒吸睛开场 · 换季护肤常见误区与 GlowUp 精华七天实测分享'],
      'film-example-upload': ['本地上传 · 产品实拍（演示记录）', 'GlowUp 精华产品实拍 · 包装细节、质地展示与上脸使用全记录'],
    };
    for (const film of state.films) {
      const titles = exampleTitles[film.id];
      if (titles && film.title === titles[0]) film.title = titles[1];
    }
    writeJSON(`chuhai-studio-v1:${owner}`, state);
  }
  return state;
}
export const studio = ref<StudioState>(load(currentUser.value?.id ?? 'guest'));
export const storageError = ref('');
watch(currentUser, user => { studio.value = load(user?.id ?? 'guest'); }, { flush: 'sync' });
watch(studio, value => { if (!writeJSON(`chuhai-studio-v1:${currentUser.value?.id ?? 'guest'}`, value)) storageError.value = '本地存储不可用，当前修改只能保留在本次会话'; else storageError.value = ''; }, { deep: true, flush: 'sync' });
export function createProject(name: string, desc = '', color = '#11a3fd'): StudioProject {
  if (!name.trim()) throw new Error('请填写项目名称');
  const project = { id: `P-${uid()}`, name: name.trim(), desc, color, accountIds: [], archived: false };
  studio.value.projects.unshift(project); return project;
}
export async function ensureDemoProjectContent(projectId: string) {
  if (currentUser.value?.id !== 'demo' || projectId !== 'P1' || studio.value.videoExamplesVersion === 2) return;
  const state = studio.value;
  const project = state.projects.find(p => p.id === projectId);
  const account = state.accounts.find(a => !a.deleted && a.status === '已授权');
  if (!project || !account) return;
  if (!project.accountIds.includes(account.id)) project.accountIds.push(account.id);
  // Retire only untouched legacy fixtures; preserve submitted retries and user edits.
  state.jobs = state.jobs.filter(j => !(j.id.startsWith('job-status-example-') && j.demoPreview));
  const titles = ['晨间护肤故事', '品牌成分解读', '精华使用日记', '产品细节展示', '好物生活分享', '换季护肤心得', '自然光产品实拍', '水润肌肤图集', '护肤旅行记录', '精华质地特写', '生活里的护肤灵感'];
  const statuses: (PublishTask['status'] | null)[] = [null,'待发布','已排期','发布中','发布成功','发布失败','已取消','发布成功','发布失败','已取消','发布成功'];
  const at = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
  for (let i = 0; i < titles.length; i++) {
    const id = `video-v2-${i}`;
    if (state.films.some(f => f.id === id)) continue;
    const film: Film = { id, projectId, title: `${titles[i]}（演示）`, type: i === 7 ? '图文' : '视频', source: i === 6 ? '本地上传' : i % 2 ? '专家创作' : '普通创作', createdAt: at(48+i), duration: '15', ratio: '9:16', quality: '1080P', brief: '以自然生活场景展示产品特点与真实使用体验。', productIds: [], version: 1, mediaIds: [], inPublishing: false, attributes: blankAttributes() };
    if (i === 2) film.reference = state.references[0];
    state.films.push(film);
    const makeTask = (suffix: string, status: PublishTask['status'], hours: number): PublishTask => ({ id: `${id}-${suffix}`, filmId: id, projectId, batchId: id, accountId: account.id, title: film.title, tags: '#护肤', privacy: 'PUBLIC_TO_EVERYONE', comments: true, duet: true, stitch: true, ai: false, commercial: false, cover: '首帧', photoMusic: false, scheduledAt: status === '已排期' ? new Date(Date.now()+86400000).toISOString() : '', status, createdAt: at(hours), submittedAt: status === '待配置' ? undefined : at(hours), updatedAt: at(hours), dueAt: Date.now()+86400000, attempt: status === '待配置' ? 0 : 1, simulateFailure: false, demoPreview: true, error: status === '发布失败' ? '平台暂时繁忙，请重新配置后重试（演示）' : undefined });
    const add = (task: PublishTask, zero = false, uncollected = false) => {
      if (task.status === '发布成功') {
        task.publishedAt = task.submittedAt; task.platformId = `${task.id}-content`;
        state.content.push({ id: task.platformId, accountId: account.id, filmId: id, projectIds: [projectId], title: film.title, type: film.type, publishedAt: task.publishedAt!, attributes: blankAttributes(), snapshots: uncollected ? [] : [{date: at(1).slice(0,10),views:zero?0:1462,likes:zero?0:64,comments:zero?0:6,shares:zero?0:8}], collection: uncollected ? '未采集' : '可用' });
      }
      state.tasks.push(task);
    };
    if ([8,9].includes(i)) add(makeTask('history','发布成功',36));
    if (i === 10) add(makeTask('cancelled','已取消',36));
    if (statuses[i]) add(makeTask('latest',statuses[i]!,24), i === 7, i === 10);
    if (i === 7) add(makeTask('draft','待配置',1));
  }
  for (const [i,status] of (['生成中','等待中','生成失败'] as const).entries()) {
    const film = state.films.find(f=>f.id===`video-v2-${i}`)!;
    const {id: _id,createdAt: _createdAt,...fields} = film; void _id; void _createdAt;
    state.jobs.push({id:`video-v2-job-${i}`,projectId,demoPreview:true,status,createdAt:at(1+i),dueAt:0,fail:status==='生成失败',film:{...fields,title:`${['护肤场景短片','品牌创意短片','产品测评短片'][i]}（演示）`}});
  }
  state.videoExamplesVersion = 2;
  // Store a real local gallery so the demo includes usable media as well as missing-media examples.
  try {
    const images = await Promise.all(['#e0f2fe', '#fce7f3'].map((color, i) => saveMedia('demo', new File([
      `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="720"><rect width="540" height="720" fill="${color}"/><rect x="200" y="210" width="140" height="280" rx="24" fill="#0284c7"/><text x="270" y="560" text-anchor="middle" font-size="28" fill="#0f172a">GlowUp ${i+1}</text></svg>`
    ], `glowup-${i+1}.svg`, {type:'image/svg+xml'}))));
    const gallery = state.films.find(f=>f.id==='video-v2-7');
    if (gallery) gallery.mediaIds = images;
    for (const task of state.tasks.filter(t=>t.filmId===gallery?.id)) task.imageMediaIds = images;
  } catch { /* Browsers without IndexedDB retain the explicit missing-media state. */ }
}
export function authorize(handle: string, groupId: string, scenario: string) {
  if (scenario === '拒绝') throw new Error('用户拒绝授权，可重新发起');
  if (scenario === '取消') throw new Error('授权已取消，帐号未发生变更');
  const normalized = '@' + handle.trim().replace(/^@/, '').toLowerCase();
  if (!/^@[a-z0-9_.]{2,24}$/.test(normalized)) throw new Error('用户名需为 2–24 位字母、数字、下划线或点');
  const existing = studio.value.accounts.find(a => a.handle === normalized);
  const account = { id: existing?.id ?? uid(), name: normalized.slice(1), handle: normalized, region: existing?.region ?? '未提供', groupId, note: existing?.note ?? '', status: (scenario === '权限不足' ? '权限不足' : scenario === '过期' ? '授权过期' : '已授权') as '已授权' | '授权过期' | '权限不足', authorizedAt: now(), deleted: false };
  if (existing) Object.assign(existing, account); else studio.value.accounts.unshift(account);
  return account;
}
export function disconnectAccount(id: string) {
  const account = studio.value.accounts.find(a => a.id === id); if (!account) return;
  account.status = '已解绑';
  studio.value.tasks.filter(t => t.accountId === id && ['待发布', '已排期'].includes(t.status)).forEach(t => { t.status = '发布失败'; t.error = '帐号已解绑，任务已暂停；重新授权后可重试'; });
}
export function parseReference(raw: string, scenario = '成功'): Reference {
  let url: URL; try { url = new URL(raw.trim()); } catch { throw new Error('请输入完整的 TK 或 FastMoss 视频链接'); }
  const host = url.hostname.toLowerCase();
  const tk = host === 'tiktok.com' || host.endsWith('.tiktok.com');
  const fm = host === 'fastmoss.com' || host.endsWith('.fastmoss.com');
  if (url.protocol !== 'https:' || (!tk && !fm)) throw new Error('仅支持 HTTPS 的 TikTok 或 FastMoss 视频链接');
  const short = ['vm.tiktok.com', 'vt.tiktok.com'].includes(host) || url.pathname.startsWith('/t/');
  if (!(short ? url.pathname.length > 3 : /\/(video|detail|media|v)\//.test(url.pathname))) throw new Error('请使用视频详情链接，而非帐号或首页链接');
  if (scenario !== '成功') throw new Error(scenario === '内容失效' ? '内容不存在或已设为私密，请换一个链接或上传参考素材' : '解析失败，请重试或上传参考素材');
  url.search = ''; url.hash = '';
  const existing = studio.value.references.find(r => r.url === url.href); if (existing) return existing;
  const reference = { id: uid(), url: url.href, title: '好物实测 · 三秒抓住注意力', author: tk ? '@creator.demo' : 'FastMoss 视频参考', duration: '00:24', source: tk ? 'TikTok' : 'FastMoss' };
  studio.value.references.unshift(reference); return reference;
}
export function startGeneration(film: GenerationJob['film'], fail = false) {
  const job: GenerationJob = { id: uid(), projectId: film.projectId, sessionId: film.sessionId, createdAt: now(), status: studio.value.jobs.some(j => !j.demoPreview && j.projectId === film.projectId && j.status === '生成中') ? '等待中' : '生成中', dueAt: Date.now() + 5000, fail, film };
  studio.value.jobs.unshift(job); return job;
}
export function cancelGeneration(id: string) { const job = studio.value.jobs.find(j => j.id === id); if (job && ['生成中', '等待中'].includes(job.status)) job.status = '已取消'; }
export function retryGeneration(id: string) { const job = studio.value.jobs.find(j => j.id === id); if (job && !['生成中', '等待中', '已完成'].includes(job.status)) { job.demoPreview = false; job.status = studio.value.jobs.some(j => !j.demoPreview && j.projectId === job.projectId && j.status === '生成中') ? '等待中' : '生成中'; job.dueAt = Date.now() + 5000; job.fail = false; } }
export function ensurePublishTask(film: Film, retryTaskId?: string): PublishTask {
  const tasks = studio.value.tasks.filter(t => t.filmId === film.id);
  const active = tasks.find(t => ['待发布','已排期','发布中'].includes(t.status));
  if (active) return active;
  const latest = tasks.filter(t=>t.status !== '待配置').sort((a,b)=>(b.submittedAt||b.createdAt).localeCompare(a.submittedAt||a.createdAt))[0];
  const failed = retryTaskId ? tasks.find(t=>t.id===retryTaskId&&t.status==='发布失败') : retryTaskId === undefined && latest?.status === '发布失败' ? latest : undefined;
  const existing = failed || tasks.find(t=>t.status==='待配置');
  if (existing) return existing;
  const task: PublishTask = { id: uid(), batchId: '', filmId: film.id, projectId: film.projectId, accountId: '', title: film.title, tags: '', privacy: 'PUBLIC_TO_EVERYONE', comments: true, duet: true, stitch: true, ai: false, commercial: false, audienceControl: false, cover: '首帧', photoMusic: false, imageMediaIds: film.type === '图文' ? [...film.mediaIds] : undefined, scheduledAt: '', status: '待配置', createdAt: now(), dueAt: 0, simulateFailure: false, attempt: 0 };
  film.inPublishing = true; studio.value.tasks.unshift(task); return task;
}
export function validatePublish(task: PublishTask) {
  const account = studio.value.accounts.find(a => a.id === task.accountId);
  const project = studio.value.projects.find(p => p.id === task.projectId);
  const film = studio.value.films.find(f => f.id === task.filmId);
  if (!project || project.archived) throw new Error('项目不存在或已归档');
  if (!account || account.deleted || account.status !== '已授权' || !project.accountIds.includes(account.id)) throw new Error('请选择项目关联且授权有效的帐号');
  if (!film) throw new Error('成片已不存在');
  if (film.source === '本地上传' && film.type === '视频' && !film.mediaIds.length) throw new Error('本地媒体已丢失，请重新上传');
  if (film.type === '图文' && !(task.imageMediaIds ?? film.mediaIds).length) throw new Error('图文作品至少需要一张图片');
  if (!['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'].includes(task.privacy)) throw new Error('请主动选择可见范围');
  if (task.scheduledAt && (!Number.isFinite(new Date(task.scheduledAt).getTime()) || new Date(task.scheduledAt).getTime() <= Date.now())) throw new Error('定时时间必须晚于当前时间');
}
export async function submitPublish(tasks: PublishTask[]) {
  if (!tasks.length) throw new Error('请选择成片');
  for (const task of tasks) {
    if (!['待配置', '发布失败', '已取消'].includes(studio.value.tasks.find(t=>t.id===task.id)?.status ?? '') || !['待配置', '发布失败', '已取消'].includes(task.status)) throw new Error('部分任务已提交，请勿重复发布');
    if (tasks.filter(t => t.filmId === task.filmId).length > 1 || studio.value.tasks.some(t => t.id !== task.id && t.filmId === task.filmId && ['待发布', '已排期', '发布中'].includes(t.status))) throw new Error('该视频已有执行中的发布任务');
    validatePublish(task);
    const film = studio.value.films.find(f => f.id === task.filmId)!;
    if (film.source === '本地上传' && film.type === '视频') for (const id of film.mediaIds) if (!await getMedia(currentUser.value!.id, id)) throw new Error(`「${film.title}」的本地媒体已丢失，请重新上传`);
    if (film.type === '图文') {
      const imageIds = task.imageMediaIds ?? film.mediaIds;
      if (!(await Promise.all(imageIds.map(id => getMedia(currentUser.value!.id, id)))).every(Boolean)) throw new Error(`「${film.title}」的图文图片已丢失，请移除缺失图片或重新上传`);
      if (task.bgm?.source === 'local' && (!task.bgm.mediaId || !await getMedia(currentUser.value!.id, task.bgm.mediaId))) throw new Error(`「${film.title}」的本地 BGM 已丢失，请重新上传`);
    }
  }
  const batchId = uid();
  for (const task of tasks) {
    // Recheck the stored task after asynchronous media validation.
    if (!['待配置', '发布失败', '已取消'].includes(studio.value.tasks.find(t=>t.id===task.id)?.status ?? '')) throw new Error('任务已提交，请勿重复发布');
    if (studio.value.tasks.some(t => t.id !== task.id && t.filmId === task.filmId && ['待发布', '已排期', '发布中'].includes(t.status))) throw new Error('该视频已有执行中的发布任务');
    task.demoPreview = false; task.submittedAt = now(); task.updatedAt = now(); task.publishedAt = undefined;
    task.batchId = batchId; task.status = task.scheduledAt ? '已排期' : '待发布'; task.dueAt = task.scheduledAt ? new Date(task.scheduledAt).getTime() : Date.now() + 1000; task.error = ''; task.attempt++;
    const stored = studio.value.tasks.find(t=>t.id===task.id); if (stored && stored !== task) Object.assign(stored, task);
  }
}
export async function tickStudio(clock = Date.now()) {
  for (const job of studio.value.jobs) {
    if (job.demoPreview || job.status !== '生成中' || job.dueAt > clock) continue;
    if (job.fail) { job.status = '生成失败'; continue; }
    job.status = '已完成'; studio.value.films.unshift({ ...structuredClonePlain(job.film), id: job.id, createdAt: now() });
  }
  for (const job of [...studio.value.jobs].reverse()) {
    if (!job.demoPreview && job.status === '等待中' && !studio.value.jobs.some(j => !j.demoPreview && j.projectId === job.projectId && j.status === '生成中')) { job.status = '生成中'; job.dueAt = clock + 5000; }
  }
  for (const task of studio.value.tasks) {
    if (task.demoPreview || !['已排期', '待发布', '发布中'].includes(task.status) || task.dueAt > clock) continue;
    try {
      // Scheduled time has passed: validate the remaining conditions without the future-time check.
      validatePublish({ ...task, scheduledAt: '' });
      const film = studio.value.films.find(f => f.id === task.filmId)!;
      if (film.source === '本地上传' && film.type === '视频') for (const id of film.mediaIds) if (!await getMedia(currentUser.value!.id, id)) throw new Error('本地媒体已丢失');
      if (film.type === '图文') {
        const imageIds = task.imageMediaIds ?? film.mediaIds;
        if (!(await Promise.all(imageIds.map(id => getMedia(currentUser.value!.id, id)))).every(Boolean)) throw new Error('图文图片已丢失');
        if (task.bgm?.source === 'local' && (!task.bgm.mediaId || !await getMedia(currentUser.value!.id, task.bgm.mediaId))) throw new Error('本地 BGM 已丢失');
      }
      if (task.status !== '发布中') { task.status = '发布中'; task.updatedAt = now(); task.dueAt = clock + 4000; continue; }
      if (task.simulateFailure && task.attempt === 1) throw new Error('平台暂时繁忙，请重试此任务');
      task.status = '发布成功'; task.publishedAt = now(); task.updatedAt = now(); task.platformId = `demo-${task.id}`;
      if (!studio.value.content.some(c => c.id === task.platformId)) studio.value.content.unshift({ id: task.platformId, accountId: task.accountId, filmId: film.id, projectIds: [task.projectId], title: task.title, type: film.type, publishedAt: now(), ...(film.type === '图文' ? { imageMediaIds: [...(task.imageMediaIds ?? film.mediaIds)], bgm: task.bgm ? { ...task.bgm } : undefined } : {}), attributes: { ...film.attributes }, snapshots: [], collection: '未采集' });
    } catch (e) { task.status = '发布失败'; task.updatedAt = now(); task.error = (e as Error).message; }
  }
}
function structuredClonePlain<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function contentMetrics(content: PlatformContent, days: number, cumulative = true) {
  if (content.collection !== '可用') return { reason: content.collection, metrics: null };
  const latest = content.snapshots.at(-1); if (!latest) return { reason: '未采集', metrics: null };
  if (cumulative) return { reason: '', metrics: latest };
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const baseline = content.snapshots.filter(s => s.date <= cutoff).at(-1);
  if (!baseline) return { reason: '历史不足', metrics: null };
  return { reason: '', metrics: { date: latest.date, views: latest.views - baseline.views, likes: latest.likes - baseline.likes, comments: latest.comments - baseline.comments, shares: latest.shares - baseline.shares } };
}
export function saveProduct(id: string, fields: Partial<import('@/types/domain').Product>) { const product = studio.value.products.find(p => p.id === id); if (!product) throw new Error('产品卡不存在'); Object.assign(product, fields); return product; }

export function cancelPublishTask(id: string) {
  const task = studio.value.tasks.find(t => t.id === id);
  if (!task || !['已排期', '待发布'].includes(task.status)) throw new Error('只能取消尚未执行的发布任务');
  task.demoPreview = false; task.status = '已取消'; task.updatedAt = now();
}
export function reschedulePublishTask(id: string, scheduledAt: string) {
  const task = studio.value.tasks.find(t => t.id === id);
  if (!task || task.status !== '已排期') throw new Error('仅已排期任务可以改期');
  validatePublish({ ...task, scheduledAt });
  task.demoPreview = false; task.scheduledAt = scheduledAt; task.dueAt = new Date(scheduledAt).getTime(); task.updatedAt = now();
}

export function accountDeleteReason(id: string) {
  return studio.value.tasks.some((t) => t.accountId === id && t.status === '发布中')
    ? '该帐号正在发布，请等待发布完成'
    : '';
}
export function deleteAccount(id: string) {
  const reason = accountDeleteReason(id);
  if (reason) throw new Error(reason);
  const account = studio.value.accounts.find((a) => a.id === id);
  if (!account || account.deleted) return;
  for (const task of studio.value.tasks.filter(
    (t) => t.accountId === id && ['待发布', '已排期'].includes(t.status),
  ))
    cancelPublishTask(task.id);
  account.deleted = true;
  for (const project of studio.value.projects)
    project.accountIds = project.accountIds.filter((accountId) => accountId !== id);
}
export function reorderGroup(id: string, targetId: string) {
  const groups = [...studio.value.groups];
  const from = groups.findIndex((g) => g.id === id),
    to = groups.findIndex((g) => g.id === targetId);
  if (from < 0 || to < 0 || from === to) return;
  groups.splice(to, 0, groups.splice(from, 1)[0]!);
  studio.value.groups = groups;
}
