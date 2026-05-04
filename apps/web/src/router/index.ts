import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

/**
 * Application router.
 * Routes with `meta.requiresAuth: true` redirect to /login when unauthenticated.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/collections',
    },
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
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});

export default router;
