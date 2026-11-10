import { readonly, ref, watch } from 'vue';
import { z } from 'zod';
import { seedNotes } from '@/data/idea-notes';
import type { IdeaNote } from '@/types/domain';

import { currentUser } from '@/services/identity';
const storageKey = () => currentUser.value && currentUser.value.id !== 'demo' ? `${NOTES_KEY}:${currentUser.value.id}` : NOTES_KEY;
export const NOTES_KEY = 'chuhai-idea-notes';
const noteSchema: z.ZodType<IdeaNote[]> = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    time: z.string(),
    summary: z.string(),
    platforms: z.array(z.enum(['TikTok', 'Instagram', 'YouTube', 'Facebook', 'X', 'LinkedIn'])),
    messages: z.array(z.object({ role: z.enum(['user', 'ai']), text: z.string() })),
  }),
);
const notes = ref<IdeaNote[]>([]);
let loaded = false;
watch(currentUser, () => { loaded = false; notes.value = []; initialize(); });

function initialize() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(storageKey());
    const result = raw === null ? null : noteSchema.safeParse(JSON.parse(raw));
    notes.value = result?.success ? result.data : (!currentUser.value || currentUser.value.id === 'demo' ? structuredClone(seedNotes) : []);
  } catch {
    notes.value = !currentUser.value || currentUser.value.id === 'demo' ? structuredClone(seedNotes) : [];
  }
}
function persist() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(notes.value));
  } catch {
    /* Storage may be disabled; keep the session usable. */
  }
}
export function loadIdeaNotes() {
  initialize();
  return notes.value;
}
export function addIdeaNote(note: IdeaNote) {
  initialize();
  notes.value = [note, ...notes.value.filter((item) => item.id !== note.id)];
  persist();
}
export function useIdeaNotes() {
  initialize();
  function removeNote(id: string) {
    notes.value = notes.value.filter((note) => note.id !== id);
    persist();
  }
  return { notes: readonly(notes), removeNote };
}
