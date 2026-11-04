import { createRouter, createWebHashHistory, type RouterHistory } from 'vue-router';
import { currentUser } from '@/services/identity';
import { accessGate, unlockDestination } from '@/lib/access';

export function createAppRouter(history: RouterHistory = createWebHashHistory(), gate = accessGate) {
  const router = createRouter({
    history,
    scrollBehavior: () => ({ top: 0 }),
    routes: [
      { path: '/auth', name: 'auth', component: () => import('./pages/Auth.vue') },
      { path: '/legacy/projects/:id', component: () => import('./pages/LegacyProjectDetail.vue'), meta: { immersive: true } },
      { path: '/roxy', component: () => import('./pages/Accounts.vue'), meta: { wide: true } },
      { path: '/unlock', name: 'unlock', component: () => import('./pages/Unlock.vue') },
      { path: '/', component: () => import('./pages/Dashboard.vue'), meta: { wide: true } },
      {
        path: '/inspiration',
        component: () => import('./pages/Inspiration.vue'),
        meta: { wide: true },
      },
      { path: '/notes', component: () => import('./pages/Notes.vue'), meta: { wide: true } },
      { path: '/create', component: () => import('./pages/Create.vue'), meta: { wide: true } },
      { path: '/trends', component: () => import('./pages/Trends.vue'), meta: { wide: true } },
      { path: '/accounts', component: () => import('./pages/TKAccounts.vue'), meta: { wide: true } },
      { path: '/analytics', component: () => import('./pages/Analytics.vue'), meta: { wide: true } },
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
      { path: '/me', component: () => import('./pages/Profile.vue'), meta: { wide: true } },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('./pages/Dashboard.vue'),
        meta: { wide: true },
      },
    ],
  });
  router.beforeEach((to) => {
    if (to.name === 'unlock') {
      return gate.isUnlocked() ? { path: unlockDestination(to.query.redirect), replace: true } : true;
    }
    if (!gate.isUnlocked()) return { name: 'unlock', query: { redirect: to.fullPath }, replace: true };
    if (!currentUser.value && to.name !== 'auth') return { name: 'auth', query: { redirect: to.fullPath }, replace: true };
    if (currentUser.value && to.name === 'auth') return { path: unlockDestination(to.query.redirect), replace: true };
    return true;
  });
  return router;
}

export const router = createAppRouter();
