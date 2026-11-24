import { ref } from 'vue';

export type TourStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';
export type TourProgress = { version: 1; step: number; status: TourStatus; projectId?: string };
export const tourKey = (owner: string) => `chuhai-guide-tour-v1:${owner}`;

// Only users explicitly enrolled at account creation receive the automatic tour.
export function createTourController(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const progress = ref<TourProgress | null>(null);
  const owner = ref<string | null>(null);
  const fallback = new Map<string, TourProgress>();
  function read(id: string): TourProgress | null {
    if (fallback.has(id)) return fallback.get(id)!;
    try {
      const value = JSON.parse((storage ?? localStorage).getItem(tourKey(id)) ?? 'null');
      return value?.version === 1 &&
        Number.isInteger(value.step) &&
        value.step >= 0 &&
        value.step < 5 &&
        ['pending', 'in-progress', 'completed', 'skipped'].includes(value.status)
        ? {
            version: 1,
            step: value.step,
            status: value.status,
            ...(typeof value.projectId === 'string' ? { projectId: value.projectId } : {}),
          }
        : null;
    } catch {
      return null;
    }
  }
  function save(id: string, value: TourProgress) {
    try {
      (storage ?? localStorage).setItem(tourKey(id), JSON.stringify(value));
      fallback.delete(id);
    } catch {
      fallback.set(id, value);
    }
    if (owner.value === id) progress.value = value;
  }
  function enroll(id: string) {
    if (id !== 'demo') save(id, { version: 1, step: 0, status: 'pending' });
  }
  function activate(id: string | null) {
    owner.value = id;
    progress.value = id ? read(id) : null;
  }
  function start(id: string) {
    owner.value = id;
    save(id, { version: 1, step: 0, status: 'in-progress' });
  }
  function move(step: number) {
    if (owner.value && progress.value)
      save(owner.value, { ...progress.value, step: Math.max(0, Math.min(4, step)), status: 'in-progress' });
  }
  function selectProject(projectId: string) {
    if (owner.value && progress.value) save(owner.value, { ...progress.value, projectId });
  }
  function end(status: 'completed' | 'skipped') {
    if (owner.value && progress.value) save(owner.value, { ...progress.value, status });
  }
  return { progress, owner, enroll, activate, start, move, selectProject, end };
}

export const guideTour = createTourController();
