import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TheNavbar from '../../src/components/TheNavbar.vue';
import { useAuthStore } from '../../src/stores/auth';

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('TheNavbar', () => {
  it('displays the username of the logged-in user', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    expect(wrapper.text()).toContain('alice');
  });

  it('calls auth.logout and redirects to /login on button click', async () => {
    const router = makeRouter();
    await router.push('/collections');
    const auth = useAuthStore();
    auth.user = {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    auth.accessToken = 'tok';
    vi.spyOn(auth, 'logout').mockResolvedValue();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.path).toBe('/login');
  });
});
