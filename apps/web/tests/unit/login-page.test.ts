import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginPage from '../../src/pages/LoginPage.vue';
import { useAuthStore } from '../../src/stores/auth';

// ── Test router ───────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/register', component: { template: '<div/>' } },
    ],
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('renders email and password inputs', async () => {
    const router = makeRouter();
    await router.push('/login');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('calls auth.login with form values on submit', async () => {
    const router = makeRouter();
    await router.push('/login');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
    const auth = useAuthStore();
    const loginSpy = vi.spyOn(auth, 'login').mockResolvedValue();

    await wrapper.find('input[type="email"]').setValue('alice@example.com');
    await wrapper.find('input[type="password"]').setValue('Password123!');
    await wrapper.find('form').trigger('submit');

    expect(loginSpy).toHaveBeenCalledWith('alice@example.com', 'Password123!');
  });

  it('redirects to /collections after successful login', async () => {
    const router = makeRouter();
    await router.push('/login');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
    const auth = useAuthStore();
    vi.spyOn(auth, 'login').mockResolvedValue();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/collections');
  });

  it('redirects to the redirect query param after login', async () => {
    const router = makeRouter();
    await router.push('/login?redirect=/collections');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
    const auth = useAuthStore();
    vi.spyOn(auth, 'login').mockResolvedValue();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/collections');
  });

  it('displays an error message when login fails', async () => {
    const router = makeRouter();
    await router.push('/login');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
    const auth = useAuthStore();
    vi.spyOn(auth, 'login').mockRejectedValue(
      new Error('Invalid email or password'),
    );

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Invalid email or password',
    );
  });

  it('disables the submit button while loading', async () => {
    const router = makeRouter();
    await router.push('/login');
    const wrapper = mount(LoginPage, { global: { plugins: [pinia, router] } });
    const auth = useAuthStore();
    vi.spyOn(auth, 'login').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    await wrapper.find('form').trigger('submit');

    expect(
      wrapper.find('button[type="submit"]').attributes('disabled'),
    ).toBeDefined();
  });
});
