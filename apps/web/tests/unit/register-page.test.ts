import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import RegisterPage from '../../src/pages/RegisterPage.vue';
import { useAuthStore } from '../../src/stores/auth';
import type { RegisterResponse } from '../../src/types/auth';

// ── Test router ───────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: { template: '<div/>' } },
    ],
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockRegisterResponse: RegisterResponse = {
  message: 'Please check your email to verify your account.',
  user: {
    id: 'user-uuid-1',
    username: 'alice',
    email: 'alice@example.com',
    isAdmin: false,
    language: 'en',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
};

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
    const registerSpy = vi
      .spyOn(auth, 'register')
      .mockResolvedValue(mockRegisterResponse);

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

  it('hides the form and shows email confirmation after successful registration', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockResolvedValue(mockRegisterResponse);

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.text()).toContain('Check your inbox');
  });

  it('does not navigate away after successful registration', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockResolvedValue(mockRegisterResponse);

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/register');
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
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('displays the backend message when registration fails with data.message (e.g. 409)', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockRejectedValue({
      status: 409,
      data: { message: 'Email already registered' },
    });

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Email already registered',
    );
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('displays a generic error when registration throws a non-Error value', async () => {
    const router = makeRouter();
    await router.push('/register');
    const wrapper = mount(RegisterPage, {
      global: { plugins: [pinia, router] },
    });
    const auth = useAuthStore();
    vi.spyOn(auth, 'register').mockRejectedValue('unexpected string rejection');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Registration failed',
    );
  });
});
