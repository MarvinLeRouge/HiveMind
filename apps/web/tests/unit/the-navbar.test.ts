import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { computed } from 'vue';
import TheNavbar from '../../src/components/TheNavbar.vue';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/composables/useDarkMode');
import { useDarkMode } from '../../src/composables/useDarkMode';

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/templates', component: { template: '<div/>' } },
      { path: '/login', component: { template: '<div/>' } },
    ],
  });
}

function makeUser() {
  return {
    id: 'u1',
    username: 'alice',
    email: 'alice@example.com',
    isAdmin: false,
    language: 'en' as const,
    createdAt: '2025-01-01',
  };
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();

  vi.mocked(useDarkMode).mockReturnValue({
    isDark: computed(() => false),
    toggle: vi.fn(),
  });
});

describe('TheNavbar', () => {
  it('displays the username of the logged-in user', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    expect(wrapper.text()).toContain('alice');
  });

  it('calls auth.logout and redirects to /login on button click', async () => {
    const router = makeRouter();
    await router.push('/collections');
    const auth = useAuthStore();
    auth.user = makeUser();
    auth.accessToken = 'tok';
    vi.spyOn(auth, 'logout').mockResolvedValue();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });
    const logoutBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Log out');
    await logoutBtn!.trigger('click');
    await flushPromises();

    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('calls auth.setLanguage when a language button is clicked', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();
    vi.spyOn(auth, 'setLanguage').mockResolvedValue();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });
    const frBtn = wrapper.findAll('button').find((b) => b.text() === 'FR');
    await frBtn!.trigger('click');
    await flushPromises();

    expect(auth.setLanguage).toHaveBeenCalledWith('fr');
  });

  it('shows the moon icon and dark-mode aria-label in light mode', () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    // Moon path is the crescent shape used in light mode
    expect(wrapper.html()).toContain('M21 12.79');
    const themeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label'));
    expect(themeBtn?.attributes('aria-label')).toBe('Switch to dark mode');
  });

  it('shows the sun icon and light-mode aria-label in dark mode', () => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: computed(() => true),
      toggle: vi.fn(),
    });

    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    // Sun icon uses a circle + ray paths
    expect(wrapper.html()).toContain('cx="12" cy="12" r="4"');
    const themeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label'));
    expect(themeBtn?.attributes('aria-label')).toBe('Switch to light mode');
  });

  it('calls toggle when the dark mode button is clicked', async () => {
    const mockToggle = vi.fn();
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: computed(() => false),
      toggle: mockToggle,
    });

    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });
    const themeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label'));
    await themeBtn!.trigger('click');

    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it('renders a hamburger button with aria-label', () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });
    const hamburger = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Open menu');

    expect(hamburger).toBeDefined();
    expect(hamburger!.attributes('aria-expanded')).toBe('false');
  });

  it('opens the mobile menu when the hamburger button is clicked', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    const hamburger = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Open menu');
    await hamburger!.trigger('click');

    expect(wrapper.html()).toContain('aria-label="Close menu"');
    expect(wrapper.text()).toContain('Templates');
  });

  it('closes the mobile menu when a nav link is clicked', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = makeUser();

    const wrapper = mount(TheNavbar, { global: { plugins: [pinia, router] } });

    await wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'Open menu')!
      .trigger('click');

    const templatesLink = wrapper
      .findAll('a')
      .find((a) => a.text() === 'Templates' && a.classes().includes('flex'));
    await templatesLink!.trigger('click');

    expect(wrapper.html()).toContain('aria-label="Open menu"');
  });
});
