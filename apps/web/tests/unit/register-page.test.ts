import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import RegisterPage from '../../src/pages/RegisterPage.vue';
import { useAuthStore } from '../../src/stores/auth';

// ── Test router ───────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
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

describe('RegisterPage', () => {
  it('renders username, email and password inputs', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });

    expect(wrapper.find('input#username').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('calls auth.register with form values on submit', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    const registerSpy = vi.spyOn(auth, 'register').mockResolvedValue();

    await wrapper.find('input#username').setValue('alice');
    await wrapper.find('input[type="email"]').setValue('alice@example.com');
    await wrapper.find('input[type="password"]').setValue('Password123!');
    await wrapper.find('form').trigger('submit');

    expect(registerSpy).toHaveBeenCalledWith(
      'alice',
      'alice@example.com',
      'Password123!',
    );
  });

  it('redirects to /collections after successful registration', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockResolvedValue();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/collections');
  });

  it('displays an error message when registration fails', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockRejectedValue(
      new Error('Email already registered'),
    );

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Email already registered',
    );
  });
});
