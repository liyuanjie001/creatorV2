import { readonly, ref } from 'vue';
import { z } from 'zod';
import { seedNotes } from '@/data/idea-notes';
import type { IdeaNote } from '@/types/domain';

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

function initialize() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const result = raw === null ? null : noteSchema.safeParse(JSON.parse(raw));
    notes.value = result?.success ? result.data : structuredClone(seedNotes);
  } catch {
    notes.value = structuredClone(seedNotes);
  }
}
function persist() {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes.value));
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
