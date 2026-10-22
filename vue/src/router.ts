import { createRouter, createWebHashHistory, type RouterHistory } from 'vue-router';
import { accessGate, unlockDestination } from '@/lib/access';

export function createAppRouter(history: RouterHistory = createWebHashHistory(), gate = accessGate) {
  const router = createRouter({
    history,
    scrollBehavior: () => ({ top: 0 }),
    routes: [
      { path: '/unlock', name: 'unlock', component: () => import('./pages/Unlock.vue') },
      { path: '/', component: () => import('./pages/Dashboard.vue') },
      {
        path: '/inspiration',
        component: () => import('./pages/Inspiration.vue'),
      },
      { path: '/notes', component: () => import('./pages/Notes.vue') },
      { path: '/create', component: () => import('./pages/Create.vue') },
      { path: '/trends', redirect: '/inspiration?tab=trends' },
      { path: '/accounts', component: () => import('./pages/Accounts.vue') },
      { path: '/analytics', component: () => import('./pages/Analytics.vue') },
      { path: '/tasks', component: () => import('./pages/Tasks.vue') },
      { path: '/tasks/new', component: () => import('./pages/NewTask.vue') },
      { path: '/projects', component: () => import('./pages/Projects.vue') },
      {
        path: '/projects/new',
        component: () => import('./pages/NewProject.vue'),
      },
      {
        path: '/projects/:id',
        component: () => import('./pages/ProjectDetail.vue'),
        meta: { immersive: true },
      },
      {
        path: '/assets',
        component: () => import('./pages/Assets.vue'),
        meta: { immersive: true },
      },
      { path: '/settings', component: () => import('./pages/Settings.vue') },
      { path: '/trash', component: () => import('./pages/Trash.vue') },
      { path: '/me', component: () => import('./pages/Profile.vue') },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('./pages/Dashboard.vue'),
      },
    ],
  });
  router.beforeEach((to) => {
    if (to.name === 'unlock') {
      return gate.isUnlocked() ? { path: unlockDestination(to.query.redirect), replace: true } : true;
    }
    if (!gate.isUnlocked()) return { name: 'unlock', query: { redirect: to.fullPath }, replace: true };
    return true;
  });
  return router;
}

export const router = createAppRouter();
