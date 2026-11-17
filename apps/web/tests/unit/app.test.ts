import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '../../src/App.vue';
import { useAuthStore } from '../../src/stores/auth';

async function mountApp() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<p id="page">page</p>' } }],
  });
  await router.push('/');
  return mount(App, {
    global: {
      plugins: [router],
      stubs: { TheNavbar: { template: '<nav id="navbar"/>' }, AppToast: true },
    },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('App', () => {
  it('renders the current route inside main and hides the navbar when logged out', async () => {
    const wrapper = await mountApp();

    expect(wrapper.find('main #page').exists()).toBe(true);
    expect(wrapper.find('#navbar').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'AppToast' }).exists()).toBe(true);
  });

  it('shows the navbar when the user is authenticated', async () => {
    useAuthStore().accessToken = 'token';

    const wrapper = await mountApp();

    expect(wrapper.find('#navbar').exists()).toBe(true);
  });
});
