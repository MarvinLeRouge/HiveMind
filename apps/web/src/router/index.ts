import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import i18n from '@/i18n';

/**
 * Application router.
 * Routes with `meta.requiresAuth: true` redirect to /login when unauthenticated.
 * Routes with `meta.titleKey` set document.title via afterEach.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/collections' },
    {
      path: '/login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false, titleKey: 'auth.login' },
    },
    {
      path: '/register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { requiresAuth: false, titleKey: 'auth.register' },
    },
    {
      path: '/verify-email',
      component: () => import('@/pages/VerifyEmailPage.vue'),
      meta: { requiresAuth: false, titleKey: 'auth.verifyEmail' },
    },
    {
      path: '/collections',
      component: () => import('@/pages/CollectionsPage.vue'),
      meta: { requiresAuth: true, titleKey: 'collection.title' },
    },
    {
      path: '/collections/new',
      component: () => import('@/pages/CollectionNewPage.vue'),
      meta: { requiresAuth: true, titleKey: 'collection.new' },
    },
    {
      path: '/collections/:id',
      component: () => import('@/pages/CollectionDetailPage.vue'),
      meta: { requiresAuth: true, titleKey: 'collection.puzzles' },
    },
    {
      path: '/collections/:id/settings',
      component: () => import('@/pages/CollectionSettingsPage.vue'),
      meta: { requiresAuth: true, titleKey: 'collection.settings' },
    },
    {
      path: '/collections/:id/puzzles',
      redirect: (to) => `/collections/${to.params.id}`,
    },
    {
      path: '/collections/:id/puzzles/:pid',
      component: () => import('@/pages/PuzzleDetailPage.vue'),
      meta: { requiresAuth: true, titleKey: 'nav.puzzle' },
    },
    {
      path: '/templates',
      component: () => import('@/pages/TemplatesPage.vue'),
      meta: { requiresAuth: true, titleKey: 'template.title' },
    },
    {
      path: '/templates/new',
      component: () => import('@/pages/TemplateNewPage.vue'),
      meta: { requiresAuth: true, titleKey: 'template.new' },
    },
    {
      path: '/templates/:id/edit',
      component: () => import('@/pages/TemplateEditPage.vue'),
      meta: { requiresAuth: true, titleKey: 'template.editTitle' },
    },
    {
      path: '/invitations/:id',
      component: () => import('@/pages/InvitationPage.vue'),
      meta: { requiresAuth: true, titleKey: 'invitation.title' },
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

router.afterEach((to) => {
  const key = to.meta.titleKey as string | undefined;
  const label = key ? i18n.global.t(key) : '';
  document.title = label ? `${label} | HiveMind` : 'HiveMind';
});

export default router;
