import { beforeEach, expect, test, vi } from 'vitest';
import { identityService } from '@/services/identity';
import { studio } from '@/services/studio';
import {
  createAgent,
  submitAgentCard,
  tickAgent,
  executeAgentTask,
  sendAgent,
  saveAgent,
  loadAgent,
  editAgentCard,
  regenerateAgent,
} from '@/services/agent';
import type { ExpertSession } from '@/types/studio';
import type { AgentTask } from '@/types/agent';
let session: ExpertSession;
beforeEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  identityService.demo();
  session = {
    id: 'agent-test',
    projectId: 'P1',
    title: '测试',
    stage: 0,
    brief: '',
    direction: '',
    script: '',
    version: 1,
    messages: [],
    updatedAt: new Date().toISOString(),
    productIds: [],
  };
  studio.value.projects = [
    { id: 'P1', name: '测试项目', desc: '', color: '#fff', accountIds: [], archived: false },
  ];
  studio.value.jobs = [];
  studio.value.films = [];
});
function find(t: AgentTask, module: string) {
  return t.cards.filter((c) => c.module === module).at(-1)!;
}
function finish(t: AgentTask) {
  vi.useFakeTimers();
  vi.advanceTimersByTime(2000);
  tickAgent(t, session);
  vi.useRealTimers();
}
function plan() {
  const t = createAgent(session, 'UGC 收纳用品', true);
  submitAgentCard(t, find(t, 'product'), session);
  finish(t);
  return t;
}
test('未知产品不编造、示例独立、旧脚本保留待审核', () => {
  session.script = '旧脚本';
  const t = createAgent(session, '需求');
  expect(t.context.product.price).toBe('未提供');
  expect(find(t, 'legacy').status).toBe('pending');
  expect(studio.value.products.some((p) => p.id === 'mock-agent')).toBe(false);
});
test('产品确认和任务完成只推进一次', () => {
  const t = createAgent(session, '需求', true);
  const p = find(t, 'product');
  submitAgentCard(t, p, session);
  submitAgentCard(t, p, session);
  expect(t.cards.filter((c) => c.module === 'plan-task')).toHaveLength(1);
  finish(t);
  tickAgent(t, session);
  expect(t.cards.filter((c) => c.module.startsWith('hook-'))).toHaveLength(1);
});
test('按用户需求生成指定 Hook 数量和 CTA 数量', () => {
  const t = createAgent(session, '生成 5 种不同的开头脚本和 3 个 CTA', true);
  submitAgentCard(t, find(t, 'product'), session);
  finish(t);
  expect(t.context.requestedHooks).toBe(5);
  expect(t.context.requestedCtas).toBe(3);
  expect(t.cards.filter((c) => c.module.startsWith('hook-'))).toHaveLength(5);
  expect(find(t, 'hook-0').fields.find((f) => f.key === 'cta')?.value).toContain('CTA 3');
});
test('七种卡片和审核门禁、QA 修复及生成防重', () => {
  const t = plan();
  submitAgentCard(t, find(t, 'plan-gate'), session);
  finish(t);
  const gate = find(t, 'story-gate');
  expect(() => submitAgentCard(t, gate, session)).toThrow('制作版本');
  const versions = find(t, 'versions');
  versions.selected = [];
  expect(() => submitAgentCard(t, versions, session)).toThrow('数量');
  versions.selected = ['0'];
  submitAgentCard(t, versions, session);
  expect(() => submitAgentCard(t, gate, session)).toThrow('确认所有');
  for (const shot of t.cards.filter((c) => c.module.startsWith('shot-0-'))) submitAgentCard(t, shot, session);
  submitAgentCard(t, gate, session);
  const task = find(t, 'frame-task');
  executeAgentTask(t, task);
  finish(t);
  const frame = find(t, 'frame-0');
  expect(() => submitAgentCard(t, frame, session)).toThrow('修复');
  regenerateAgent(t, frame);
  frame.acceptedWarnings = true;
  submitAgentCard(t, frame, session);
  submitAgentCard(t, find(t, 'frame-gate'), session);
  const render = find(t, 'render');
  render.fields.find((f) => f.key === 'count')!.value = '0';
  expect(() => submitAgentCard(t, render, session)).toThrow('数量');
  render.fields.find((f) => f.key === 'count')!.value = '1';
  submitAgentCard(t, render, session);
  submitAgentCard(t, render, session);
  expect(studio.value.jobs).toHaveLength(1);
  expect(find(t, 'video-result').jobIds).toEqual([studio.value.jobs[0]!.id]);
});
test('风格分支内容不同', () => {
  const outputs = ['UGC', '产品测评', '开箱分享'].map((style) => {
    const t = createAgent(session, style, true);
    submitAgentCard(t, find(t, 'product'), session);
    finish(t);
    return find(t, 'people').fields.find((f) => f.key === 'scene')!.value;
  });
  expect(new Set(outputs).size).toBe(3);
});
test('局部 Hook 修改保留其他 Hook，下游过期且记录版本', () => {
  const t = plan();
  submitAgentCard(t, find(t, 'plan-gate'), session);
  finish(t);
  const original = JSON.stringify(find(t, 'hook-1'));
  sendAgent(t, session, '修改 Hook 1，开头更自然');
  const conflict = find(t, 'conflict');
  conflict.selected = ['local'];
  submitAgentCard(t, conflict, session);
  expect(find(t, 'hook-0').fields.find((f) => f.key === 'opening')!.value).toContain('小细节');
  expect(JSON.stringify(find(t, 'hook-1'))).toBe(original);
  expect(t.cards.some((c) => c.module.startsWith('shot') && c.status === 'outdated')).toBe(true);
  expect(t.versions.length).toBeGreaterThan(0);
});
test('失败重试、执行中干预防止旧版本覆盖', () => {
  const t = createAgent(session, '需求', true);
  submitAgentCard(t, find(t, 'product'), session);
  const task = find(t, 'plan-task');
  task.simulateFailure = true;
  finish(t);
  expect(task.taskStatus).toBe('执行失败');
  executeAgentTask(t, task);
  t.revision++;
  finish(t);
  expect(task.status).toBe('outdated');
  expect(t.cards.some((c) => c.module === 'hook-0')).toBe(false);
});
test('刷新恢复，用户隔离及保存失败', () => {
  const t = plan();
  saveAgent(t);
  expect(loadAgent(session)?.cards).toEqual(t.cards);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  expect(() => saveAgent(t)).toThrow('保存失败');
  vi.restoreAllMocks();
  identityService.logout();
  expect(loadAgent(session)).toBeUndefined();
});
test('弱广告感、镜头、人物和产品修改展示影响范围', () => {
  const t = plan();
  submitAgentCard(t, find(t, 'plan-gate'), session);
  finish(t);
  for (const instruction of [
    '不要太像广告，更自然',
    '把第三个镜头缩短到 3 秒',
    '人物换成25岁女性',
    '修改产品售价',
  ]) {
    sendAgent(t, session, instruction);
    expect(find(t, 'conflict').status).toBe('pending');
  }
  sendAgent(t, session, '字幕改成英文');
  expect(find(t, 'custom').fields[0]!.value).toContain('英文');
});
test('归档禁止修改', () => {
  const t = plan();
  studio.value.projects[0]!.archived = true;
  expect(() => editAgentCard(t, find(t, 'hook-0'))).toThrow('归档');
});

test('默认案例只生成完整脚本和一版分镜', () => {
  const t = createAgent(session, '帮我根据这个产品生成一套适合 TikTok 美区的 UGC 带货视频，突出产品卖点，整体风格偏真实生活化。', true);
  submitAgentCard(t, find(t, 'product'), session);
  finish(t);
  expect(t.context.requestedHooks).toBe(1);
  expect(find(t, 'script').fields.find(f => f.key === 'english')?.value).toBeTruthy();
  submitAgentCard(t, find(t, 'plan-gate'), session);
  finish(t);
  expect(find(t, 'versions').options.map(o => o.title)).toEqual(['完整脚本']);
  expect(t.cards.filter(c => c.module.startsWith('shot-'))).toHaveLength(3);
  expect(t.messages.some(m => m.text.includes('五版'))).toBe(false);
});

test('three-round case collects product, proposes direction, then generates script', () => {
  const t = createAgent(session, '真实生活化带货视频', true, true);
  const productInput = find(t, 'intent-image');
  expect(productInput.fields.map(f => f.key)).toEqual(['product', 'selling', 'pain']);
  expect(() => submitAgentCard(t, productInput, session)).toThrow('图片');
  productInput.imageMediaId = 'local-product';
  productInput.imageName = 'product.png';
  submitAgentCard(t, productInput, session);
  const complete = () => { vi.useFakeTimers(); vi.advanceTimersByTime(3100); tickAgent(t, session); vi.useRealTimers(); };
  complete();
  submitAgentCard(t, find(t, 'product-draft'), session);
  const direction = find(t, 'creative-direction');
  expect(t.stage).toContain('第二轮');
  direction.selected = ['开箱测评'];
  direction.fields.find(f => f.key === 'angle')!.value = '桌面开箱细节';
  submitAgentCard(t, direction, session);
  complete();
  expect(t.stage).toContain('第三轮');
  expect(find(t, 'script-gate')).toBeTruthy();
  expect(t.cards.find(c => c.module.startsWith('shot-'))?.fields.find(f => f.key === 'scene')?.value).toBe('桌面开箱细节');
});
