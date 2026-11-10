import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import type { IdeaNote } from '@/types/domain';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

test.each(['{broken', '{}', '[{"id": 42}]'])('无效旧存储回退到种子妙记: %s', async (raw) => {
  localStorage.setItem('chuhai-idea-notes', raw);
  const { loadIdeaNotes } = await import('@/composables/useIdeaNotes');
  expect(loadIdeaNotes().map((note) => note.id)).toEqual(['N-1', 'N-2']);
});

test('旧数据保留，新增和删除写回同一存储键，重新加载后仍存在', async () => {
  const note: IdeaNote = {
    id: 'fixture-note',
    title: '测试妙记',
    time: '10-21 12:00',
    summary: '北美露营',
    platforms: ['TikTok'],
    messages: [{ role: 'user', text: '咖啡机' }],
  };
  localStorage.setItem('chuhai-idea-notes', JSON.stringify([note]));
  const { loadIdeaNotes, addIdeaNote, useIdeaNotes } = await import('@/composables/useIdeaNotes');
  expect(loadIdeaNotes()).toEqual([note]);
  addIdeaNote({ ...note, id: 'new-note' });
  expect(useIdeaNotes().notes.value.map((item) => item.id)).toEqual(['new-note', 'fixture-note']);
  useIdeaNotes().removeNote('fixture-note');
  vi.resetModules();
  const reloaded = await import('@/composables/useIdeaNotes');
  expect(reloaded.loadIdeaNotes().map((item) => item.id)).toEqual(['new-note']);
  reloaded.useIdeaNotes().removeNote('new-note');
  vi.resetModules();
  const empty = await import('@/composables/useIdeaNotes');
  expect(empty.loadIdeaNotes()).toEqual([]);
});

test('存储被禁用时仍可在当前会话新增及删除', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('disabled');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('disabled');
  });
  const { loadIdeaNotes, addIdeaNote, useIdeaNotes } = await import('@/composables/useIdeaNotes');
  const seed = loadIdeaNotes()[0];
  addIdeaNote({ ...seed, id: 'session-note' });
  expect(loadIdeaNotes()[0].id).toBe('session-note');
  useIdeaNotes().removeNote('session-note');
  expect(loadIdeaNotes()).toHaveLength(2);
});
