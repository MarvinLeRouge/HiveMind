import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import VerifyEmailPage from '../../src/pages/VerifyEmailPage.vue';
import { useAuthStore } from '../../src/stores/auth';

// ── Test router ───────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/verify-email', component: VerifyEmailPage },
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

describe('VerifyEmailPage', () => {
  it('calls auth.verifyEmail with the token from the query string', async () => {
    const router = makeRouter();
    await router.push('/verify-email?token=my-raw-token');
    // Spy must be set up before mounting so onMounted captures it.
    const auth = useAuthStore();
    const verifySpy = vi.spyOn(auth, 'verifyEmail').mockResolvedValue();

    mount(VerifyEmailPage, { global: { plugins: [pinia, router] } });
    await flushPromises();

    expect(verifySpy).toHaveBeenCalledWith('my-raw-token');
  });

  it('shows the success state after a valid token is verified', async () => {
    const router = makeRouter();
    await router.push('/verify-email?token=valid-token-abc');
    const auth = useAuthStore();
    vi.spyOn(auth, 'verifyEmail').mockResolvedValue();

    const wrapper = mount(VerifyEmailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Your email has been verified');
    expect(wrapper.find('a').exists()).toBe(true);
  });

  it('shows the error state when verification fails', async () => {
    const router = makeRouter();
    await router.push('/verify-email?token=bad-token');
    const auth = useAuthStore();
    vi.spyOn(auth, 'verifyEmail').mockRejectedValue(new Error('invalid token'));

    const wrapper = mount(VerifyEmailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('invalid or has expired');
  });

  it('shows the missing token state and does not call verifyEmail when no token in URL', async () => {
    const router = makeRouter();
    await router.push('/verify-email');
    const auth = useAuthStore();
    const verifySpy = vi.spyOn(auth, 'verifyEmail').mockResolvedValue();

    const wrapper = mount(VerifyEmailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('No verification token found');
    expect(verifySpy).not.toHaveBeenCalled();
  });
});
