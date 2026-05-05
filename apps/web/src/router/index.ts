import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

/**
 * Application router.
 * Routes with `meta.requiresAuth: true` redirect to /login when unauthenticated.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/collections' },
    {
      path: '/login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/collections',
      component: () => import('@/pages/CollectionsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections/new',
      component: () => import('@/pages/CollectionNewPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections/:id',
      component: () => import('@/pages/CollectionDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections/:id/settings',
      component: () => import('@/pages/CollectionSettingsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections/:id/puzzles',
      component: () => import('@/pages/PuzzlesPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections/:id/puzzles/:pid',
      component: () => import('@/pages/PuzzleDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/templates',
      component: () => import('@/pages/TemplatesPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/templates/new',
      component: () => import('@/pages/TemplateNewPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/templates/:id/edit',
      component: () => import('@/pages/TemplateEditPage.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});

export default router;
