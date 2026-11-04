import { computed } from 'vue';
import { studio, createProject } from '@/services/studio';
import type { Project } from '@/types/domain';
const palette = ['#f472b6', '#11a3fd', '#f59e0b', '#10b981', '#8b5cf6'];
export function resetHomeProjects() { studio.value.projects = []; }
export function reloadHomeProjects() { return useHomeProjects().homeProjects.value; }
export function addHomeProject(partial: Partial<Project> & { name: string }) { return createProject(partial.name, partial.desc, partial.color); }
export function renameHomeProject(id: string, name: string) { const p = studio.value.projects.find(p => p.id === id); if (!p || !name.trim()) return null; p.name = name.trim(); return p; }
export function removeHomeProject(id: string) { const p = studio.value.projects.find(p => p.id === id); if (!p) return false; p.archived = true; return true; }
export function useHomeProjects() {
  const homeProjects = computed<Project[]>(() => studio.value.projects.filter(p => !p.archived).map(p => ({ ...p, status: '进行中', progress: 0, start: '', end: '', owner: '我', platforms: ['TikTok'], exposure: '—', engagement: '—', contentCount: studio.value.films.filter(f => f.projectId === p.id).length })));
  return { homeProjects, empty: computed(() => !homeProjects.value.length), palette, addHomeProject, renameHomeProject, removeHomeProject, resetHomeProjects, reloadHomeProjects };
}
