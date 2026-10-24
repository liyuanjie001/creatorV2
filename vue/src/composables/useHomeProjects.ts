import { computed, ref, type Ref } from 'vue';
import { projects } from '@/data/mock';
import type { Project } from '@/types/domain';

const STORAGE_KEY = 'chuhai-home-projects';
const GLOBAL_KEY = '__chuhai_home_projects_store__';
const palette = ['#f472b6', '#11a3fd', '#f59e0b', '#10b981', '#8b5cf6'];

type HomeStore = {
  homeProjects: Ref<Project[]>;
};

function isUserCreatedId(id: string) {
  return /^P-\d{10,}$/.test(id);
}

function readStored(): Project[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(list: Project[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

function ensureInMock(list: Project[]) {
  for (const item of [...list].reverse()) {
    if (!projects.some((p) => p.id === item.id)) {
      projects.unshift(item);
    }
  }
}

function recoverFromMock(list: Project[]): Project[] {
  const extra = projects.filter(
    (p) => isUserCreatedId(p.id) && !list.some((h) => h.id === p.id),
  );
  return extra.length ? [...extra, ...list] : list;
}

function loadList(): Project[] {
  const merged = recoverFromMock(readStored());
  ensureInMock(merged);
  return merged;
}

function getStore(): HomeStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: HomeStore };
  if (!g[GLOBAL_KEY]) {
    const list = loadList();
    writeStored(list);
    g[GLOBAL_KEY] = { homeProjects: ref(list) };
  }
  return g[GLOBAL_KEY]!;
}

const store = getStore();
const homeProjects = store.homeProjects;

export function resetHomeProjects() {
  for (let i = projects.length - 1; i >= 0; i -= 1) {
    if (isUserCreatedId(projects[i]!.id)) {
      projects.splice(i, 1);
    }
  }
  homeProjects.value = [];
  writeStored([]);
}

export function reloadHomeProjects() {
  const list = loadList();
  homeProjects.value = list;
  writeStored(list);
  return homeProjects.value;
}

export function addHomeProject(partial: Omit<Project, 'id'> & { id?: string }) {
  const item: Project = {
    id: partial.id ?? `P-${Date.now()}`,
    name: partial.name,
    color: partial.color ?? palette[homeProjects.value.length % palette.length],
    desc: partial.desc ?? '',
    status: partial.status ?? '进行中',
    progress: partial.progress ?? 0,
    start: partial.start ?? '',
    end: partial.end ?? '',
    owner: partial.owner ?? '林悦',
    platforms: partial.platforms ?? ['TikTok', 'Instagram'],
    exposure: partial.exposure ?? '—',
    engagement: partial.engagement ?? '—',
    contentCount: partial.contentCount ?? 0,
  };
  if (!projects.some((p) => p.id === item.id)) {
    projects.unshift(item);
  }
  homeProjects.value = [item, ...homeProjects.value.filter((p) => p.id !== item.id)];
  writeStored(homeProjects.value);
  ensureInMock(homeProjects.value);
  return item;
}

export function renameHomeProject(id: string, name: string) {
  const next = name.trim();
  if (!next) return null;
  const target = homeProjects.value.find((p) => p.id === id);
  if (!target) return null;
  target.name = next;
  homeProjects.value = homeProjects.value.map((p) => (p.id === id ? { ...p, name: next } : p));
  const mock = projects.find((p) => p.id === id);
  if (mock) mock.name = next;
  writeStored(homeProjects.value);
  return homeProjects.value.find((p) => p.id === id) ?? null;
}

export function removeHomeProject(id: string) {
  const before = homeProjects.value.length;
  homeProjects.value = homeProjects.value.filter((p) => p.id !== id);
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0 && isUserCreatedId(id)) {
    projects.splice(idx, 1);
  }
  writeStored(homeProjects.value);
  return homeProjects.value.length < before;
}

export function useHomeProjects() {
  // 进入页面时与本地存储对齐（不覆盖内存里已有、但尚未写入失败的数据）
  if (homeProjects.value.length === 0) {
    reloadHomeProjects();
  } else {
    ensureInMock(homeProjects.value);
    writeStored(homeProjects.value);
  }
  const empty = computed(() => homeProjects.value.length === 0);
  return {
    homeProjects,
    empty,
    palette,
    addHomeProject,
    renameHomeProject,
    removeHomeProject,
    resetHomeProjects,
    reloadHomeProjects,
  };
}
