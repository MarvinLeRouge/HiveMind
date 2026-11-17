import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '../../src/router';
import { useAuthStore } from '../../src/stores/auth';

// Route components are lazy-loaded: stub them so navigation does not pull in real pages
vi.mock('@/pages/LoginPage.vue', () => ({ default: { template: '<div/>' } }));
vi.mock('@/pages/CollectionsPage.vue', () => ({
  default: { template: '<div/>' },
}));
vi.mock('@/pages/CollectionDetailPage.vue', () => ({
  default: { template: '<div/>' },
}));

beforeEach(async () => {
  setActivePinia(createPinia());
  await router.replace('/login');
});

describe('router', () => {
  it('redirects an unauthenticated user to /login with the target as redirect', async () => {
    await router.push('/collections');

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/collections');
  });

  it('lets an authenticated user reach a protected route', async () => {
    useAuthStore().accessToken = 'token';

    await router.push('/collections');

    expect(router.currentRoute.value.path).toBe('/collections');
  });

  it('sets the document title from the route titleKey', async () => {
    useAuthStore().accessToken = 'token';

    await router.push('/collections');

    expect(document.title).toBe('Collections | HiveMind');
  });

  it('falls back to the app name for routes without a titleKey', async () => {
    const removeRoute = router.addRoute({
      path: '/untitled',
      component: { template: '<div/>' },
    });

    await router.push('/untitled');
    removeRoute();

    expect(document.title).toBe('HiveMind');
  });

  it('redirects the legacy puzzles list to the collection detail page', async () => {
    useAuthStore().accessToken = 'token';

    await router.push('/collections/abc/puzzles');

    expect(router.currentRoute.value.path).toBe('/collections/abc');
  });

  it('redirects unknown paths to the collections list', async () => {
    useAuthStore().accessToken = 'token';

    await router.push('/does/not/exist');

    expect(router.currentRoute.value.path).toBe('/collections');
  });
});

describe('router route table', () => {
  it('resolves every lazy route to a page component', async () => {
    const lazyRoutes = router
      .getRoutes()
      .filter((r) => typeof r.components?.default === 'function');

    expect(lazyRoutes.length).toBeGreaterThan(0);
    for (const route of lazyRoutes) {
      const load = route.components!.default as () => Promise<{
        default: unknown;
      }>;
      const mod = await load();
      expect(mod.default, route.path).toBeTruthy();
    }
  });
});
