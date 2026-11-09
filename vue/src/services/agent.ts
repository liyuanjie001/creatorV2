import type { AgentCard, AgentField, AgentTask, CardKind } from '@/types/agent';
import type { ExpertSession } from '@/types/studio';
import { studio, startGeneration } from './studio';
import { blankAttributes } from './studio';
import { now, uid, writeJSON, readJSON } from './storage';
import { currentUser } from './identity';
export const agentImage = (kind: string) => `/agent-${kind}.svg`;
const f = (key: string, label: string, value: string, type: AgentField['type'] = 'textarea'): AgentField => ({
  key,
  label,
  value,
  type,
});
function say(t: AgentTask, text: string, cards: AgentCard[] = [], role: 'user' | 'assistant' = 'assistant') {
  t.messages.push({ id: uid(), role, text, cardIds: cards.map((c) => c.id), createdAt: now() });
  t.cards.push(...cards);
  t.updatedAt = now();
}
function card(kind: CardKind, module: string, title: string, fields: AgentField[] = []): AgentCard {
  return { id: uid(), kind, module, title, status: 'pending', version: 1, fields, options: [], selected: [] };
}
function record(t: AgentTask, c: AgentCard) {
  t.versions.push({
    cardId: c.id,
    version: c.version,
    fields: JSON.parse(JSON.stringify(c.fields)),
    selected: [...c.selected],
    at: now(),
  });
}
function check(t: AgentTask) {
  if (studio.value.projects.find((p) => p.id === t.projectId)?.archived) throw new Error('归档项目仅可查看');
}
export function loadAgent(session: ExpertSession): AgentTask | undefined {
  return readJSON<AgentTask | undefined>(
    `chuhai-agent-v1:${currentUser.value?.id}:${session.id}`,
    () => undefined,
  );
}
export function saveAgent(t: AgentTask) {
  if (!writeJSON(`chuhai-agent-v1:${currentUser.value?.id}:${t.sessionId}`, t))
    throw new Error('任务保存失败，当前编辑已保留，请重试保存');
}
export function createAgent(s: ExpertSession, request: string, demo = false, intentFlow = false): AgentTask {
  const product = studio.value.products.find((p) => s.productIds.includes(p.id));
  const t: AgentTask = {
    version: 1,
    id: uid(),
    sessionId: s.id,
    projectId: s.projectId,
    stage: '产品审核',
    revision: 1,
    context: {
      request,
      referenceAssets: [...(s.referenceAssets ?? [])],
      requestedHooks: parseCount(request, /(?:生成|给我|需要)\s*(\d+)\s*(?:种)?\s*(?:不同的)?\s*(?:开头|Hook|hooks)/i, 1),
      requestedCtas: parseCount(request, /(\d+)\s*(?:个|种)?\s*CTA/i, 1),
      facts: { confirmed: [], observable: [], unknown: [], prohibited: [] },
      style: /测评/.test(request) ? '产品测评' : /开箱/.test(request) ? '开箱分享' : '真实生活 UGC',
      audience: 'TikTok 美区年轻职场人群',
      constraints: [],
      product: demo
        ? {
            name: '复古椭圆太阳镜（培训案例 Mock）',
            price: '待核实',
            selling: '椭圆镜框、细镜腿、三种配色（据案例参考图）',
            material: '待核实',
            size: '待核实',
            usage: '日常穿搭配饰（案例策划方向，非产品规格）',
          }
        : {
            name: product?.name ?? '未提供',
            price: product?.price ?? '未提供',
            selling: product?.sellingPoint ?? '未提供',
            material: '未提供',
            size: '未提供',
            usage: product?.desc ?? '未提供',
          },
    },
    messages: [],
    cards: [],
    versions: [],
    confirmations: [],
    demo,
    updatedAt: now(),
  };
  for (const m of s.messages) t.messages.push({ id: uid(), ...m, cardIds: [], createdAt: now() });
  say(t, request, [], 'user');
  if (intentFlow) {
    t.flow = 'intent-product-script';
    t.stage = '第一轮 · 产品与痛点卖点';
    const image = card('review', 'intent-image', '第一轮 · 了解产品');
    image.fields = [f('product', '产品信息', t.context.product.name === '未提供' ? '' : t.context.product.name ?? '', 'text'), f('selling', '已确认卖点', '', 'textarea'), f('pain', '希望解决的用户痛点', '', 'textarea')];
    const existing = s.referenceAssets?.find(asset => asset.type === '图片' && asset.mediaId);
    image.imageMediaId = existing?.mediaId;
    image.imageName = existing?.name;
    say(t, '先了解产品、已确认卖点和用户痛点。已有资料可直接补充，未知信息可以留空。', [image]);
    return t;
  }
  say(t, '任务已创建，请先确认产品资料。未提供的信息不会补全。');
  const p = card(
    'review',
    'product',
    '产品资料确认',
    Object.entries(t.context.product).map(([key, value], i) =>
      f(key, ['产品名称', '售价', '核心卖点', '材质', '尺寸', '使用方式'][i]!, value, 'text'),
    ),
  );
  p.fields.push(
    f('confirmed', '已确认事实及依据', demo ? '产品名称、卖点和使用方式为演示资料' : '待补充依据'),
    f('observable', '图片可观察外观', '待上传参考图后确认'),
    f('unknown', '待核实信息', '材质、尺寸、重量、功能、价格、包装数量'),
    f('prohibited', '当前禁止声明', '未经依据的功能、销量、折扣、长期使用体验和消费者背书'),
  );
  p.options = [{ id: 'product', title: t.context.product.name!, image: agentImage('product') }];
  p.requiresAsset = true;
  p.assetAttached = !!s.referenceAssets?.length;
  say(t, '请确认资料，或直接修改、补充后确认。', [p]);
  if (s.script) {
    say(t, '已保留旧会话脚本，需要重新审核。', [
      card('review', 'legacy', '历史脚本', [f('script', '脚本', s.script)]),
    ]);
  }
  return t;
}
function parseCount(text: string, pattern: RegExp, fallback: number) {
  const value = Number(text.match(pattern)?.[1]);
  return Number.isInteger(value) && value > 0 && value <= 10 ? value : fallback;
}
function hookFields(t: AgentTask, index: number): AgentField[] {
  const types = ['反常识对比', '场景代入', '痛点提问', '实测证明', '结果悬念'];
  const intros = [
    'Your outfit is missing one thing.',
    'A retro touch for your everyday look.',
    'Looking for an easy way to style this?',
    'Here is how this looks in everyday light.',
    'The final detail changes the whole look.',
  ];
  const type = types[index % types.length]!;
  const intro = intros[index % intros.length]!;
  return [
    f('type', 'Hook 类型', type, 'text'),
    f('opening', '英文开头文案', intro),
    f('chinese', '中文释义', index === 0 ? '让日常造型多一点复古感。' : '展示产品如何融入日常场景。'),
    f(
      'vo',
      '口播脚本',
      `${intro} ${t.context.product.name}，以${t.context.style}展示${t.context.product.selling}。`,
    ),
    f(
      'visual',
      '画面设计',
      t.context.style === '产品测评'
        ? '同机位对照与实际操作'
        : t.context.style === '开箱分享'
          ? '拆包装、呈现细节、第一印象'
          : '生活场景第一视角，自然光与手持镜头',
    ),
    f('display', '产品展示方式', '特写展示分格与取用动作'),
    f('proof', '证明点', `实际展示：${t.context.product.selling}；未提供的性能不作承诺`),
    f('cta', 'CTA', Array.from({ length: t.context.requestedCtas ?? 1 }, (_, i) => `CTA ${i + 1}: ${['Pick your color.', 'Choose your everyday look.', 'See the color options.'][i % 3]}`).join('\n')),
  ];
}
function plan(t: AgentTask) {
  for (const c of t.cards)
    if (['direction', 'pain', 'people', 'plan-gate'].includes(c.module) || c.module.startsWith('hook'))
      c.status = 'disabled';
  t.stage = '方案审核';
  const style = t.context.style;
  const cards = [
    card('review', 'direction', '创作方向与目标受众', [
      f('style', '创作风格', style, 'select'),
      f('audience', '目标受众', t.context.audience),
      f('tone', '整体调性', `自然真实、弱营销感、生活化表达。${t.context.constraints.join('；')}`),
      f(
        'expression',
        '表达方式',
        style === '产品测评'
          ? '功能实测、产品特写'
          : style === '开箱分享'
            ? '开箱过程与实际体验'
            : '第一视角生活分享',
      ),
    ]),
    card('review', 'pain', '产品卖点与用户痛点', [
      f(
        'pain',
        '痛点与卖点关联',
        `小物杂乱 → ${t.context.product.selling}\n寻找费时 → 直观取用场景（Mock 推演）`,
      ),
      f('concerns', '购买顾虑与证明', '尺寸是否合适：展示已确认尺寸；使用体验：实际操作演示，不捏造效果'),
    ]),
    ...Array.from({ length: t.context.requestedHooks ?? 1 }, (_, i) =>
      card(
        'review',
        `hook-${i}`,
        `Hook ${i + 1} · ${['反常识对比', '场景代入', '痛点提问', '实测证明', '结果悬念'][i]}`,
        hookFields(t, i),
      ),
    ),
    card('single', 'people', '出镜主体是谁？'),
  ];
  if ((t.context.requestedHooks ?? 1) === 1) {
    const script = card('review', 'script', '完整英文脚本', [
      f('english', '英文口播', 'A retro touch for your everyday look. Oval frames with a vintage-inspired shape. Pick your color.'),
      f('chinese', '中文释义', '给日常造型增加复古感，展示复古椭圆镜框，并引导选择颜色。'),
      f('duration', '预计时长', '18 秒', 'text'),
      f('cta', 'CTA', Array.from({ length: t.context.requestedCtas ?? 1 }, (_, i) => `CTA ${i + 1}: ${['Pick your color.', 'Choose your everyday look.', 'See the color options.'][i % 3]}`).join('\n')),
      f('test', '测试问题', '用户是否愿意继续观看上脸与穿搭对比？'),
    ]);
    cards.splice(2, 0, script);
  }
  cards[0]!.fields[0]!.options = ['真实生活 UGC', '产品测评', '开箱分享'];
  const people = cards.at(-1)!;
  people.fields = [
    f('person', '人物形象', '25 岁左右、自然穿搭的女性（Mock 推荐）'),
    f('scene', '场景', style === '产品测评' ? '明亮桌面，固定机位实测' : style === '开箱分享' ? '桌面开箱区，依次呈现包装、细节和体验' : '居家日常，办公桌收纳'),
    f('placement', '产品位置与氛围', '自然光，产品位于桌面中心，手部取用保持一致'),
  ];
  people.options = [
    { id: 'young-woman', title: '年轻女性', description: '自然穿搭、生活化出镜，适合日常 UGC。', image: agentImage('person') },
    { id: 'young-man', title: '年轻男性', description: '轻松自然的生活场景出镜。', image: agentImage('person') },
    { id: 'custom', title: '自定义描述', description: '由你补充人物外观、年龄印象和身份。' },
  ];
  people.selected = ['young-woman'];
  people.min = 1;
  people.max = 1;
  const gate = card('review', 'plan-gate', '完整创作方案');
  gate.relatedCardIds = cards.map((item) => item.id);
  const count = t.context.requestedHooks ?? 1;
  say(t, count === 1 ? '完整脚本已生成，请审核创作方向、产品卖点、英文口播和人物场景。未知信息保持待核实。' : `方案已生成，请审核方向、痛点、${count} 个 Hook 和人物场景。未知信息保持待核实。`, [...cards, gate]);
}
function task(t: AgentTask, module: string, title: string, auto = false) {
  const c = card('task', module, title);
  c.taskStatus = auto ? '执行中' : '待执行';
  c.progress = 0;
  if (auto) {
    c.dueAt = Date.now() + 1800;
    c.executionVersion = t.revision;
  }
  say(t, `${title}使用前端模拟执行，可在执行时继续补充要求。`, [c]);
}
function storyboards(t: AgentTask) {
  for (const c of t.cards)
    if (c.module.startsWith('shot') || ['versions', 'story-gate'].includes(c.module)) c.status = 'disabled';
  t.stage = '分镜审核';
  const choose = card('multi', 'versions', '选择需要制作的脚本版本');
  const count = t.context.requestedHooks ?? 1;
  choose.options = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    title: count === 1 ? '完整脚本' : `Hook ${i + 1}`,
    description: [...t.cards]
      .reverse()
      .find((c) => c.status !== 'disabled' && c.module === `hook-${i}`)
      ?.fields.find((f) => f.key === 'opening')?.value,
  }));
  choose.selected = Array.from({ length: count }, (_, i) => String(i));
  choose.min = 1;
  choose.max = count;
  say(t, count === 1 ? '已按完整脚本拆解一版分镜，可编辑镜头并调整顺序。' : `已拆解 ${count} 版分镜。选择制作版本，可编辑单个镜头并调整顺序。`, [choose]);
  const shotCards: AgentCard[] = [];
  for (let v = 0; v < count; v++) for (let i = 0; i < 3; i++) shotCards.push(shot(t, v, i));
  say(t, '分镜已整理完成，可通过切换查看和编辑各个镜头。', shotCards);
  say(t, '确认选中版本的分镜后生成关键帧。', [card('review', 'story-gate', '确认脚本与分镜')]);
}
function shot(t: AgentTask, v: number, i: number) {
  return card('review', `shot-${v}-${uid()}`, `版本 ${v + 1} · 镜头 ${i + 1}`, [
    f('shotId', '稳定镜头编号', `V${String(v + 1).padStart(2, '0')}-S${String(i + 1).padStart(2, '0')}`, 'text'),
    f('version', '脚本版本', `V${String(v + 1).padStart(2, '0')}`, 'text'),
    f('duration', '时长（秒）', '5', 'number'),
    f('selling', '关联卖点与事实', t.context.product.selling),
    f('visual', '画面与景别', i === 0 ? '竖屏正面近景，上脸展示' : '近景展示产品细节'),
    f(
      'vo',
      'VO',
      i === 0
        ? ([...t.cards]
            .reverse()
            .find((c) => c.status !== 'disabled' && c.module === `hook-${v}`)
            ?.fields.find((f) => f.key === 'vo')?.value ?? '自然开场')
        : `以${t.context.style}演示${t.context.product.selling}`,
    ),
    ...((t.context.requestedHooks ?? 1) === 1 ? [f('scriptSource', '完整脚本依据', [...t.cards].reverse().find((c) => c.module === 'script' && c.status !== 'disabled')?.fields.find((field) => field.key === 'english')?.value ?? '待审核脚本')] : []),
    f('overlay', 'Overlay', i === 0 ? '整理前的日常' : '取用更直观'),
    f('subtitle', '字幕', i === 0 ? 'A retro touch for your everyday look.' : 'Vintage-inspired style'),
    f('action', '人物动作', '自然拿取并放回产品'),
    f('angle', '镜头视角', '桌面近景'),
    f('display', '产品展示方式', '产品与手部同框'),
    f('proof', '证明点', '展示真实取用过程'),
    f('transition', '转场', '动作匹配切换'),
    f('prompt', 'AI 提示词', `${t.context.style}，${t.context.product.name}，自然光，保持产品与人物一致`),
    f('videoPrompt', '视频提示词', 'One continuous shot. One simple action. Preserve product shape and color. Silent footage; add narration and captions in editing.'),
    f('acceptance', '验收标准', '产品外观与参考一致；动作自然；无未经核实声明。'),
    f('assetVersion', '素材版本 / 实际时间码', '待生成 / 待剪辑填写'),
    f('revisionReason', '修改原因', '首次版本'),
  ]);
}
function frames(t: AgentTask) {
  for (const c of t.cards) if (c.module.startsWith('frame-')) c.status = 'disabled';
  t.stage = '关键帧审核';
  const selected = [...t.cards].reverse().find((c) => c.status !== 'disabled' && c.module === 'versions')
    ?.selected ?? ['0'];
  const frameCards: AgentCard[] = [];
  for (const v of selected) {
    const c = card('image', `frame-${v}`, `版本 ${Number(v) + 1} · 关键帧与 QA`, [
      f(
        'prompt',
        '关键帧提示词',
        `${t.context.style}，${t.context.product.name}，自然光下展示产品，人物与产品保持一致`,
      ),
    ]);
    c.options = [
      {
        id: 'frame',
        title: '关键帧（Mock）',
        description: '可放大预览、编辑提示词并重新生成',
        image: agentImage('scene'),
      },
    ];
    c.selected = ['frame'];
    c.min = 1;
    c.max = 1;
    c.qa = ['产品一致性', '人物一致性', '手部物理关系', '产品接触位置', '光影连续性', '字幕准确性'].map(
      (label, i) => ({ label, status: i === 2 ? '不通过' : i === 4 ? '警告' : '通过' }),
    );
    frameCards.push(c);
  }
  say(t, 'QA 已发现需复核项目，可通过切换查看各个版本；请修复不通过项并明确接受警告。', frameCards);
  say(t, '确认关键帧后进入渲染设置。', [card('review', 'frame-gate', '确认关键帧与 QA')]);
}
function render(t: AgentTask, s: ExpertSession) {
  for (const c of t.cards) if (c.module === 'render') c.status = 'disabled';
  t.stage = '渲染审核';
  const c = card('form', 'render', '确认渲染参数', [
    f('model', '视频模型', s.model ?? 'Cinema Studio 3.5', 'select'),
    f('quality', '分辨率', s.quality ?? '1080P', 'select'),
    f('ratio', '比例', s.ratio ?? '9:16', 'select'),
    f('duration', '视频时长', s.duration ?? '15', 'number'),
    f('count', '每版生成数量', '1', 'number'),
    f('audio', '生成音频', s.audio === false ? '关闭' : '开启', 'select'),
  ]);
  c.fields[0]!.options = ['Cinema Studio 3.5', 'Cinema Studio 3.0', 'Cinema Studio 2.5'];
  c.fields[1]!.options = ['480', '720', '1080P', '4K'];
  c.fields[2]!.options = ['9:16', '16:9', '1:1', '4:5'];
  c.fields[5]!.options = ['开启', '关闭'];
  c.fields.forEach((f) => (f.required = true));
  say(t, '请审核最终参数。每版数量为 1–4，积分仅预估，不实际扣减。', [c]);
}
function reviewAndArchive(t: AgentTask) {
  t.stage = '验收与归档';
  const c = card('review', 'archive-review', '验收、归档与测试记录', [
    f('evidence', '成片 / 截帧', '未提供；当前无法判断完整动作、口播、声音与时间码。'),
    f('check', '验收范围与依据', '待上传实际素材并逐镜填写；结论仅覆盖已检查内容。'),
    f('archive', '归档清单', '产品事实表、分镜 CSV、提示词、素材版本、成片版本、验收记录。'),
    f('testing', '测试计划', '保持商品页和主要拍摄条件一致，首轮只测试一个变量。'),
    f('data', '真实测试数据', '未提供；当前仅提供测试计划，不生成效果结论。'),
  ]);
  c.qa = [
    { label: '产品外观与 SKU', status: '警告' },
    { label: '人物动作与连续性', status: '警告' },
    { label: '口播、字幕与声明', status: '警告' },
    { label: '素材版本与镜头追溯', status: '警告' },
  ];
  say(t, '当前未连接真实生成或剪辑工具，以下为待填写验收记录；不会把规划内容标记为实际通过。上传成片后可按镜头补充结论。', [c]);
}
export function editAgentCard(t: AgentTask, c: AgentCard) {
  check(t);
  record(t, c);
  c.editing = true;
  c.status = 'pending';
  c.version++;
  if (t.flow === 'intent-product-script') {
    if (c.module.startsWith('intent-')) {
      for (const other of t.cards) {
        if (other.module === 'intent-image') other.status = 'pending';
        else if (!other.module.startsWith('intent-') && other.status !== 'disabled') other.status = 'outdated';
      }
      t.revision++;
    } else if (c.module === 'product-draft') {
      for (const other of t.cards) if (!other.module.startsWith('intent-') && other.id !== c.id && other.module !== 'product-analysis' && other.status !== 'disabled') other.status = 'outdated';
      t.revision++;
    } else if (c.module.startsWith('shot-')) {
      for (const other of t.cards) if ((other.module.startsWith('frame-') || ['render', 'video-result', 'archive-review'].includes(other.module)) && other.status !== 'disabled') other.status = 'outdated';
      const gate = latest(t, 'script-gate');
      if (gate) gate.status = 'pending';
      t.revision++;
    }
  }
}
function invalidate(t: AgentTask, module: string) {
  const rank = (m: string) =>
    m === 'product'
      ? 0
      : ['direction', 'pain', 'people', 'script', 'plan-gate'].includes(m) || m.startsWith('hook')
        ? 1
        : m.startsWith('shot') || m === 'versions' || m === 'story-gate'
          ? 2
          : m.startsWith('frame')
            ? 3
            : 4;
  const level = rank(module);
  t.revision++;
  for (const c of t.cards) if (rank(c.module) > level && c.status !== 'disabled') c.status = 'outdated';
}
export function submitAgentCard(t: AgentTask, c: AgentCard, s: ExpertSession) {
  check(t);
  if (t.flow === 'intent-product-script' && submitIntentFlow(t, c, s)) return;
  if (!['pending', 'selected'].includes(c.status)) return;
  if (c.fields.some((f) => f.required && !f.value.trim())) throw new Error('请补充必填信息');
  if (
    ['single', 'multi', 'image'].includes(c.kind) &&
    !c.qa &&
    (c.selected.length < (c.min ?? 1) || c.selected.length > (c.max ?? Infinity))
  )
    throw new Error('请选择符合数量要求的选项');
  if (
    c.module === 'plan-gate' &&
    t.cards.some((x) => c.relatedCardIds?.includes(x.id) && x.status === 'outdated')
  )
    throw new Error('请先确认方案内的所有模块');
  if (c.module === 'story-gate') {
    const versions = [...t.cards].reverse().find((x) => x.status !== 'disabled' && x.module === 'versions');
    if (versions?.status !== 'submitted') throw new Error('请先提交制作版本');
    const selected = new Set(versions.selected);
    const shots = t.cards.filter(
      (x) => x.module.startsWith('shot-') && selected.has(x.module.split('-')[1]!) && x.status !== 'disabled',
    );
    if (shots.some((x) => x.status === 'outdated')) throw new Error('分镜已过期，请重新审核');
    if (shots.some((x) => !['submitted', 'locked'].includes(x.status)))
      throw new Error('请先确认所有选中版本的分镜');
  }
  if (
    c.module === 'frame-gate' &&
    t.cards.some(
      (x) =>
        x.module.startsWith('frame-') &&
        x.module !== 'frame-gate' &&
        !['locked', 'disabled'].includes(x.status),
    )
  )
    throw new Error('请先确认所有关键帧');
  if (
    c.qa &&
    (c.qa.some((q) => q.status === '不通过') ||
      (c.qa.some((q) => q.status === '警告') && !c.acceptedWarnings))
  )
    throw new Error('请修复不通过项，并接受警告后确认');
  if (c.module === 'render') {
    if (t.cards.some((x) => x.status === 'outdated')) throw new Error('存在过期内容，请重新审核');
    for (const key of ['duration', 'count']) {
      const value = Number(c.fields.find((f) => f.key === key)?.value);
      if (!Number.isInteger(value) || value < 1 || value > (key === 'count' ? 4 : 120))
        throw new Error('时长为 1–120 秒，数量为 1–4');
    }
  }
  const modified = c.editing;
  c.editing = false;
  c.status = ['review', 'image'].includes(c.kind) ? 'locked' : 'submitted';
  record(t, c);
  if (c.status === 'locked') {
    t.confirmations.push({ cardId: c.id, version: c.version, at: now() });
  }
  say(
    t,
    `${c.title}：${
      c.selected.length
        ? c.options
            .filter((o) => c.selected.includes(o.id))
            .map((o) => o.title)
            .join('、')
        : '已确认并保存'
    }，版本 ${c.version}`,
    [],
    'user',
  );
  if (c.module === 'product') {
    t.context.product = Object.fromEntries(c.fields.map((f) => [f.key, f.value]));
    t.context.facts = {
      confirmed: (c.fields.find((f) => f.key === 'confirmed')?.value ?? '').split(/[；;]/).filter(Boolean),
      observable: (c.fields.find((f) => f.key === 'observable')?.value ?? '').split(/[；;]/).filter(Boolean),
      unknown: (c.fields.find((f) => f.key === 'unknown')?.value ?? '').split(/[；,，]/).filter(Boolean),
      prohibited: (c.fields.find((f) => f.key === 'prohibited')?.value ?? '').split(/[；,，]/).filter(Boolean),
    };
    if (modified) invalidate(t, 'product');
    task(t, 'plan-task', '分析产品并生成完整创作方案', true);
  } else if (c.module === 'plan-gate') {
    for (const x of t.cards.filter(
      (x) =>
        x.status !== 'disabled' &&
        (['direction', 'pain', 'people'].includes(x.module) || x.module.startsWith('hook')),
    )) {
      x.status = 'locked';
      t.confirmations.push({ cardId: x.id, version: x.version, at: now() });
    }
    task(t, 'story-task', '拆解脚本与分镜', true);
  } else if (c.module === 'story-gate') {
    const selected = new Set(
      [...t.cards].reverse().find((x) => x.status !== 'disabled' && x.module === 'versions')?.selected ?? [],
    );
    for (const x of t.cards.filter((x) => x.module.startsWith('shot-') && x.status !== 'disabled'))
      x.status = selected.has(x.module.split('-')[1]!) ? 'locked' : 'disabled';
    task(t, 'frame-task', '生成关键帧并执行 Visual QA');
  } else if (c.module === 'frame-gate') render(t, s);
  else if (c.module === 'render') {
    const get = (key: string) => c.fields.find((f) => f.key === key)!.value;
    const versions = [...t.cards].reverse().find((x) => x.status !== 'disabled' && x.module === 'versions')
      ?.selected ?? ['0'];
    const jobs = [];
    for (const v of versions)
      for (let i = 0; i < Number(get('count')); i++) {
        const shots = t.messages.flatMap(message => message.cardIds)
          .map(id => t.cards.find(card => card.id === id)!)
          .filter(x => x.module.startsWith(`shot-${v}-`) && x.status !== 'disabled');
        const job = startGeneration(
          {
            projectId: t.projectId,
            sessionId: s.id,
            title: `${t.context.product.name} · ${(t.context.requestedHooks ?? 1) === 1 ? '完整脚本' : `Hook ${Number(v) + 1}`}${Number(get('count')) > 1 ? ` #${i + 1}` : ''}`,
            type: '视频',
            source: '专家创作',
            duration: get('duration'),
            ratio: get('ratio'),
            quality: get('quality'),
            model: get('model'),
            audio: get('audio') === '开启',
            brief: shots.map((x) => x.fields.map((f) => `${f.label}：${f.value}`).join('\n')).join('\n\n'),
            productIds: [...s.productIds],
            referenceAssets: [...(s.referenceAssets ?? [])],
            version: t.revision,
            mediaIds: [],
            inPublishing: false,
            attributes: {
              ...blankAttributes(),
              theme: t.context.style,
              product: t.context.product.name ?? '未分类',
            },
          },
          c.simulateFailure,
        );
        jobs.push(job.id);
      }
    const result = card('result', 'video-result', '视频生成结果');
    result.jobIds = jobs;
    result.status = 'submitted';
    say(
      t,
      '生成任务已加入“任务列表”，这里与作品列表同步展示进度。完成后可查看作品详情；当前为封面与信息演示，没有真实视频媒体。',
      [result],
    );
    t.stage = '视频生成';
    reviewAndArchive(t);
  } else if (c.module === 'conflict') {
    applyChange(t, s, c.selected[0] === 'sync');
  } else if (c.module === 'custom-image') {
    const selected = c.options.filter(option => c.selected.includes(option.id)).map(option => option.title);
    t.context.constraints.push(`视觉参考：${selected.join('、')}`);
    say(t, `已将${selected.join('、')}保存为当前任务的视觉参考。`);
  } else if (c.module === 'custom') {
    t.context.constraints.push(...c.fields.map((f) => f.value));
    say(t, `已加入创作约束：${c.fields.map((f) => f.value).join('；')}。后续脚本将体现此要求。`);
  } else if (c.module === 'style') {
    t.pendingChange = { module: 'direction', instruction: c.selected[0]! };
    applyChange(t, s, true);
  } else if (modified) {
    if (c.module === 'direction') {
      t.context.style = c.fields.find((f) => f.key === 'style')?.value ?? t.context.style;
      t.context.audience = c.fields.find((f) => f.key === 'audience')?.value ?? t.context.audience;
    }
    invalidate(t, c.module);
    say(t, '修改已保存，受影响的下游内容已标记过期。', [conflictCard(t, c.module, '沿用当前修改')]);
  }
}
function conflictCard(t: AgentTask, module: string, instruction: string) {
  t.pendingChange = { module, instruction };
  const c = card('single', 'conflict', '确认修改范围');
  c.options = [
    { id: 'local', title: '仅修改当前内容', description: '保留下游结果并标记过期，重新审核前不能继续' },
    { id: 'sync', title: '同步更新下游', description: '仅重建受影响阶段，保留旧版本与已生成作品' },
  ];
  c.min = 1;
  c.max = 1;
  return c;
}
export function executeAgentTask(t: AgentTask, c: AgentCard) {
  check(t);
  if (c.taskStatus === '执行中' || c.taskStatus === '已完成' || c.status === 'outdated') return;
  c.taskStatus = '执行中';
  c.progress = 0;
  c.dueAt = Date.now() + 1800;
  c.executionVersion = t.revision;
}
export function tickAgent(t: AgentTask, _s: ExpertSession) {
  let changed = false;
  for (const c of [...t.cards])
    if (c.kind === 'task' && c.taskStatus === '执行中' && c.status !== 'outdated') {
      changed = true;
      if (c.executionVersion !== t.revision) {
        c.status = 'outdated';
        delete t.thinkingUntil;
        continue;
      }
      c.progress = Math.min(99, Math.max(0, Math.round((1 - ((c.dueAt ?? 0) - Date.now()) / 1800) * 100)));
      if (Date.now() >= (c.dueAt ?? 0)) {
        if (c.simulateFailure) {
          c.taskStatus = '执行失败';
          c.simulateFailure = false;
          delete t.thinkingUntil;
          continue;
        }
        c.taskStatus = '已完成';
        c.progress = 100;
        c.status = 'locked';
        if (c.module === 'product-analysis') generateProductDraft(t);
        if (c.module === 'script-analysis') generateScriptDraft(t, _s);
        if (c.module === 'plan-task') plan(t);
        if (c.module === 'story-task') storyboards(t);
        if (c.module === 'frame-task') frames(t);
      }
    }
  return changed;
}
export function regenerateAgent(t: AgentTask, c: AgentCard, index?: number) {
  check(t);
  record(t, c);
  const wasConfirmed = ['locked', 'submitted', 'outdated'].includes(c.status);
  c.version++;
  c.status = 'pending';
  c.editing = wasConfirmed;
  if (c.qa) {
    c.qa = c.qa.map((q) => ({ ...q, status: q.status === '不通过' ? '通过' : q.status }));
    c.fields[0]!.value += '；修复手部接触关系';
  } else if (c.module.startsWith('hook')) c.fields = hookFields(t, Number(c.module.split('-')[1]));
  else if (index !== undefined && c.fields[index]) c.fields[index]!.value += '（已优化自然表达）';
  else c.fields = c.fields.map((f) => ({ ...f, value: f.value + '（优化版）' }));
  say(t, `${c.title}已生成新版本 ${c.version}，请重新审核。`);
}
export function addShot(t: AgentTask, base: AgentCard) {
  check(t);
  const v = Number(base.module.split('-')[1] ?? 0);
  const c = shot(
    t,
    v,
    t.cards.filter((x) => x.module.startsWith(`shot-${v}-`) && x.status !== 'disabled').length,
  );
  say(t, '已增加镜头，请审核时长分配。', [c]);
  invalidate(t, base.module);
}
export function moveShot(t: AgentTask, c: AgentCard, delta: number) {
  check(t);
  const m = t.messages.find((x) => x.cardIds.includes(c.id));
  const list = t.messages.filter((x) =>
    x.cardIds.some((id) =>
      t.cards.find((c) => c.id === id)?.module.startsWith(c.module.split('-').slice(0, 2).join('-') + '-'),
    ),
  );
  const i = list.indexOf(m!);
  const target = list[i + delta];
  if (!m || !target) return;
  const a = t.messages.indexOf(m),
    b = t.messages.indexOf(target);
  [t.messages[a], t.messages[b]] = [t.messages[b]!, t.messages[a]!];
  invalidate(t, c.module);
}
export function removeShot(t: AgentTask, c: AgentCard) {
  check(t);
  const prefix = c.module.split('-').slice(0, 2).join('-') + '-';
  if (t.cards.filter((x) => x.module.startsWith(prefix) && x.status !== 'disabled').length <= 1)
    throw new Error('每版至少保留一个镜头');
  c.status = 'disabled';
  invalidate(t, c.module);
}
function applyChange(t: AgentTask, s: ExpertSession, sync: boolean) {
  const change = t.pendingChange;
  if (!change) return;
  const { module, instruction } = change;
  if (/弱|广告|自然|生活化/.test(instruction)) t.context.constraints.push('自然真实、弱营销感、生活化表达');
  if (module === 'direction')
    t.context.style = /测评/.test(instruction)
      ? '产品测评'
      : /开箱/.test(instruction)
        ? '开箱分享'
        : '真实生活 UGC';
  const c = [...t.cards].reverse().find((x) => x.status !== 'disabled' && x.module === module);
  if (c) {
    record(t, c);
    c.version++;
    c.status = 'pending';
    c.editing = true;
    if (module.startsWith('hook')) {
      const field = c.fields.find((f) => f.key === 'opening');
      if (field) field.value = '我原本没在意这个小细节，直到每天都用上它。';
    } else if (module.startsWith('shot')) {
      const duration = instruction.match(/(\d+)\s*秒/);
      if (duration) c.fields.find((f) => f.key === 'duration')!.value = duration[1]!;
      else c.fields.find((f) => f.key === 'vo')!.value = instruction;
    } else if (module === 'people') {
      c.fields.find((f) => f.key === 'person')!.value = instruction;
    } else if (module === 'product') c.fields.push(f(`extra-${uid()}`, '补充产品资料', instruction));
    else {
      if (module === 'direction') {
        const style = c.fields.find((f) => f.key === 'style');
        if (style) style.value = t.context.style;
      }
      c.fields.push(f(`constraint-${uid()}`, '附加创作要求', instruction));
    }
  }
  invalidate(t, module);
  say(
    t,
    `已修改${c?.title ?? module}：${instruction}。${sync ? '正在同步更新受影响内容，仍需重新审核。' : '下游内容保留并标记过期，确认前不能继续。'}`,
  );
  if (sync) {
    for (const x of t.cards) if (x.status === 'outdated') x.status = 'disabled';
    if (module === 'product') {
      const product = [...t.cards].reverse().find((c) => c.module === 'product' && c.status !== 'disabled');
      if (product) t.context.product = Object.fromEntries(product.fields.map((f) => [f.key, f.value]));
    }
    if (module === 'product' || module === 'direction') {
      task(t, 'plan-task', '分析产品并生成完整创作方案', true);
    } else if (module.startsWith('hook') || module === 'pain' || module === 'people') {
      task(t, 'story-task', '拆解脚本与分镜', true);
    } else if (module.startsWith('shot')) task(t, 'frame-task', '生成关键帧并执行 Visual QA');
    else render(t, s);
  }
  delete t.pendingChange;
}
export function sendAgent(t: AgentTask, _s: ExpertSession, text: string) {
  check(t);
  say(t, text, [], 'user');
  let module = '';
  if (/产品资料|售价|材质|尺寸/.test(text)) module = 'product';
  else if (/人物|女性|男性|岁/.test(text)) module = 'people';
  else if (/镜头/.test(text)) {
    const n = Number(
      text
        .match(/第?([一二三四五六七八九\d]+)[个]?镜头/)?.[1]
        ?.replace('三', '3')
        .replace('二', '2')
        .replace('一', '1') ?? 3,
    );
    module =
      t.cards.filter((c) => c.module.startsWith('shot') && c.status !== 'disabled')[n - 1]?.module ?? '';
  } else if (/hook|开头/i.test(text)) {
    const n = Number(text.match(/(?:Hook|hook|第)\s*(\d+)/)?.[1] ?? 1) - 1;
    module = `hook-${Math.min(4, Math.max(0, n))}`;
  } else if (/风格|广告|UGC|测评|开箱|生活化|自然/.test(text)) module = 'direction';
  if (module && t.cards.some((c) => c.module === module)) {
    say(
      t,
      `我将定位修改${module.startsWith('hook') ? '指定 Hook' : module.startsWith('shot') ? '指定镜头' : module === 'people' ? '人物规划' : '当前设定'}，保留其他模块；请确认下游影响范围。`,
      [conflictCard(t, module, text)],
    );
    return;
  }
  if (/风格/.test(text)) {
    const c = card('single', 'style', '选择创作风格');
    c.options = ['真实生活 UGC', '产品测评', '开箱分享'].map((title) => ({ id: title, title }));
    c.min = 1;
    c.max = 1;
    say(t, '请选择要调整的风格，后续内容将采用不同表达方式。', [c]);
    return;
  }
  if (/人物|场景|图片/.test(text)) {
    const c = card('image', 'custom-image', '选择人物与场景参考');
    c.options = ['person', 'scene'].map((id) => ({
      id,
      title: id === 'person' ? '自然人物' : '生活场景',
      image: agentImage(id),
    }));
    c.min = 1;
    c.max = 2;
    say(t, '可选择视觉参考，再确认用于当前任务。', [c]);
    return;
  }
  const c = card('form', 'custom', '确认补充创作要求', [
    { ...f('constraint', '附加要求', text), required: true },
  ]);
  say(t, '已提炼以下补充要求。确认后纳入任务上下文；若要修改某条 Hook 或镜头，请指出编号。', [c]);
}

function latest(t: AgentTask, module: string) {
  return [...t.cards].reverse().find(c => c.module === module && c.status !== 'disabled');
}
function value(c: AgentCard, key: string) {
  return c.fields.find(field => field.key === key)?.value ?? '';
}
function startFlowTask(t: AgentTask, module: string, title: string) {
  task(t, module, title, true);
  const c = latest(t, module)!;
  c.dueAt = Date.now() + 3000;
  t.thinkingUntil = c.dueAt;
}
function lockFlow(t: AgentTask, c: AgentCard) {
  record(t, c);
  c.status = 'locked';
  t.confirmations.push({ cardId: c.id, version: c.version, at: now() });
}
function submitIntentFlow(t: AgentTask, c: AgentCard, _s: ExpertSession) {
  const handled = c.module.startsWith('intent-') || ['product-draft', 'creative-direction', 'script-gate'].includes(c.module);
  if (!handled) return false;
  if (!['pending', 'selected'].includes(c.status)) return true;
  if (c.module === 'intent-style' || c.module === 'intent-market') {
    if (!c.selected.length || (c.selected[0] === '手动输入' && !c.customValue?.trim())) throw new Error('请选择选项或填写自定义内容');
    c.status = 'submitted';
    return true;
  }
  if (c.module === 'intent-image') {
    if (!c.imageMediaId) throw new Error('请上传产品图片');
    t.context.product.name = value(c, 'product').trim() || t.context.product.name;
    t.context.product.selling = value(c, 'selling').trim();
    t.context.product.market ||= '欧美';
    lockFlow(t, c);
    say(t, `产品资料已提交；卖点：${value(c, 'selling') || '待确认'}；痛点：${value(c, 'pain') || '由 Agent 提出假设后确认'}。`, [], 'user');
    for (const other of t.cards) if (!other.module.startsWith('intent-') && other.kind !== 'task' && other.status !== 'disabled') other.status = 'outdated';
    t.revision++;
    startFlowTask(t, 'product-analysis', '模拟分析产品资料');
    return true;
  }
  if (c.module === 'product-draft') {
    if (!value(c, 'name').trim() || !value(c, 'market').trim()) throw new Error('请填写产品名和目标市场');
    if (!c.selected.length) throw new Error('请至少选择一个产品卖点');
    t.context.product = { ...t.context.product, name: value(c, 'name').trim(), market: value(c, 'market').trim(), selling: c.options.filter(o => c.selected.includes(o.id)).map(o => o.title).join('；') };
    lockFlow(t, c);
    say(t, `已确认产品资料：${t.context.product.name}，${t.context.product.market}，${t.context.product.selling}。`, [], 'user');
    t.revision++;
    for (const other of t.cards) if (other.id !== c.id && !other.module.startsWith('intent-') && other.module !== 'product-analysis' && other.status !== 'disabled') other.status = 'outdated';
    generateCreativeDirection(t);
    return true;
  }
  if (c.module === 'creative-direction') {
    if (!c.selected.length) throw new Error('请选择创作方向');
    t.context.style = c.selected[0]!;
    lockFlow(t, c);
    say(t, `第二轮已确认：${t.context.style}；${c.fields.map(x => `${x.label}：${x.value}`).join('；')}`, [], 'user');
    t.revision++;
    startFlowTask(t, 'script-analysis', '第三轮 · 生成脚本与关键帧规划');
    return true;
  }
  const shots = t.cards.filter(x => x.module.startsWith('shot-') && x.status !== 'disabled');
  if (!shots.length || shots.some(x => x.status === 'outdated')) throw new Error('脚本需要重新生成后再确认');
  if (shots.some(x => x.editingContent)) throw new Error('请先保存脚本修改');
  for (const x of t.cards) if (x.status === 'outdated' && (x.module.startsWith('frame-') || ['render', 'archive-review', 'video-result'].includes(x.module))) x.status = 'disabled';
  for (const x of shots) lockFlow(t, x);
  lockFlow(t, c);
  say(t, '已确认脚本与分镜，开始准备关键帧审核。', [], 'user');
  task(t, 'frame-task', '生成关键帧并执行 Visual QA');
  return true;
}
function generateCreativeDirection(t: AgentTask) {
  const c = card('single', 'creative-direction', '第二轮 · 风格、切入角度与钩子', [
    f('angle', '画面切入角度', `从日常场景展示${t.context.product.name}，突出${t.context.product.selling || '已确认的外观细节'}`),
    f('hook', '视频钩子', '从一个真实使用问题切入，再用产品细节回应'),
  ]);
  c.options = ['痛点', '开箱测评', '剧情植入'].map(title => ({ id: title, title }));
  c.min = c.max = 1;
  c.selected = [t.context.request.includes('开箱') ? '开箱测评' : t.context.request.includes('剧情') ? '剧情植入' : '痛点'];
  t.stage = '第二轮 · 创作方向';
  say(t, `根据${t.context.product.name}及已确认卖点，建议先验证这个创作方向。可调整风格、切入角度和钩子。`, [c]);
}
function generateProductDraft(t: AgentTask) {
  for (const c of t.cards) if (c.module === 'product-draft' && c.status !== 'disabled') c.status = 'disabled';
  for (const c of t.cards) if (c.status === 'outdated') c.status = 'disabled';
  const image = latest(t, 'intent-image')!;
  const stem = (image.imageName ?? '').replace(/\.[^.]+$/, '');
  const name = t.demo ? '复古椭圆太阳镜（Mock 草稿）' : `${stem || '待命名产品'}（Mock 草稿）`;
  const c = card('review', 'product-draft', '产品资料确认', [f('name', '产品名', value(image, 'product').trim() || name, 'text'), f('market', '目标市场', t.context.product.market ?? '欧美', 'text')]);
  c.imageMediaId = image.imageMediaId;
  c.imageName = image.imageName;
  c.options = (t.demo ? ['椭圆镜框造型（待确认）', '细镜腿设计（待确认）', '配色选择（待确认）'] : ['外观设计（请根据产品确认）', '使用场景（请根据产品确认）', '细节展示（请根据产品确认）']).map((title, i) => ({ id: `selling-${i}`, title }));
  c.selected = c.options.map(o => o.id);
  say(t, '模拟分析，请确认。名称与卖点是可修改草稿，不代表真实图片识别；未核实功能不进入脚本。', [c]);
  t.stage = '产品资料确认';
  delete t.thinkingUntil;
}
function generateScriptDraft(t: AgentTask, s: ExpertSession) {
  for (const c of t.cards) if ((c.module.startsWith('shot-') || ['versions', 'script-gate'].includes(c.module)) && c.status !== 'disabled') c.status = 'disabled';
  for (const c of t.cards) if (c.status === 'outdated') c.status = 'disabled';
  const count = t.context.requestedHooks ?? 1;
  const market = t.context.product.market ?? '欧美';
  const style = t.context.style;
  const opening = style === '痛点' ? 'Still looking for the right finishing touch?' : style === '开箱测评' ? 'Let’s take a closer look at this.' : style === '剧情植入' ? 'One small detail before heading out.' : `Here is a look at the product. ${style}`;
  const direction = latest(t, 'creative-direction');
  const scene = direction ? value(direction, 'angle') : style === '开箱测评' ? '明亮桌面开箱区，固定近景' : style === '剧情植入' ? '出门准备场景，以自然情节带出产品' : style === '痛点' ? '日常使用场景，用问题与展示进行对比' : `生活场景；${style}`;
  const versions = card('multi', 'versions', '脚本版本');
  versions.options = Array.from({ length: count }, (_, i) => ({ id: String(i), title: count === 1 ? '完整脚本' : `Hook ${i + 1}` }));
  versions.selected = versions.options.map(o => o.id);
  versions.status = 'submitted';
  t.cards.push(versions);
  const shots: AgentCard[] = [];
  for (let v = 0; v < count; v++) {
    for (let i = 0; i < 3; i++) {
      const c = shot(t, v, i);
      c.editingContent = false;
      const en = i === 0 ? `${opening}${v ? ` Take ${v + 1}: a different everyday moment.` : ''}` : i === 1 ? 'Take a closer look at the shape and details.' : 'Explore the options and choose your style.';
      const set = (key: string, text: string) => { const field = c.fields.find(x => x.key === key); if (field) field.value = text; };
      set('duration', String(Number(s.duration ?? 15) / 3));
      set('vo', market === '欧美' ? en : `${en}\n${market === '东南亚' ? '东南亚市场草稿：英语口播，具体国家与语言待确认。' : market === '全球通用' ? '全球通用版本：使用简短英语，减少地域表达。' : `目标市场：${market}，本地语言待确认。`}`);
      set('visual', i === 0 ? '产品与人物同框，呈现开头问题或情节' : i === 1 ? '产品细节近景，逐项展示已确认卖点' : '产品稳定展示，预留 CTA 字幕区域');
      set('action', i === 0 ? '看向产品，开始一个自然动作' : i === 1 ? '缓慢转动产品后保持稳定' : '将产品放稳，结束动作');
      if (i === 0 && direction) c.fields.push(f('hook', '确认的视频钩子', value(direction, 'hook')));
      set('overlay', i === 0 ? 'Everyday details' : i === 1 ? 'A closer look' : 'Choose your style');
      set('subtitle', en);
      c.fields.splice(3, 0, f('scene', '场景', scene), f('time', '分镜时间', `${Number(s.duration ?? 15) * i / 3}–${Number(s.duration ?? 15) * (i + 1) / 3} 秒`, 'text'));
      c.fields.push(f('market', '目标市场', market, 'text'), f('cta', 'CTA 备选', Array.from({ length: t.context.requestedCtas ?? 1 }, (_, n) => `${n + 1}. ${['Explore the options.', 'Choose your style.', 'Take a closer look.'][n % 3]}`).join('\n')));
      shots.push(c);
    }
  }
  const gate = card('review', 'script-gate', '脚本审核');
  gate.relatedCardIds = shots.map(c => c.id);
  say(t, '脚本已生成，可切换镜头查看，修改后再生成视频。口播需实际试听，当前不含真实视频素材。', [...shots, gate]);
  t.stage = '第三轮 · 脚本与关键帧';
  delete t.thinkingUntil;
}
export function saveAgentProduct(t: AgentTask, c: AgentCard, s: ExpertSession) {
  check(t);
  if (c.module !== 'product-draft' || c.status === 'outdated') throw new Error('请先更新产品资料');
  const name = value(c, 'name').trim();
  const points = c.options.filter(o => c.selected.includes(o.id)).map(o => o.title);
  if (!name || !value(c, 'market').trim() || !points.length) throw new Error('请补充产品名、目标市场并至少选择一个卖点');
  const id = t.savedProductId ?? uid();
  const existing = studio.value.products.find(p => p.id === id);
  const product = { ...existing, id, projectId: t.projectId, name, price: existing?.price ?? '待核实', sales: existing?.sales ?? '未采集', sellingPoint: points.join('；'), points, imageMediaId: c.imageMediaId, targetMarket: value(c, 'market'), desc: 'Agent 模拟分析草稿，产品事实需人工核实。' };
  const products = [...studio.value.products.filter(p => p.id !== id), product];
  if (!writeJSON(`chuhai-studio-v1:${currentUser.value?.id ?? 'guest'}`, { ...studio.value, products })) throw new Error('产品卡保存失败，请重试');
  studio.value.products = products;
  t.savedProductId = id;
  if (!s.productIds.includes(id)) s.productIds.push(id);
  saveAgent(t);
  return id;
}
