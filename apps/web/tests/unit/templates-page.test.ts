import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TemplatesPage from '../../src/pages/TemplatesPage.vue';
import { useTemplateStore } from '../../src/stores/template';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockTemplate = {
  id: 'tpl-1',
  name: 'My Template',
  description: 'A description',
  isSystem: false,
  isPublic: false,
  createdBy: 'user-1',
  useIndex: false,
  useGcCode: true,
  useDifficulty: false,
  useTerrain: false,
  useCoords: false,
  useHint: false,
  useSpoiler: false,
  customField1Label: null,
  customField2Label: null,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const systemTemplate = {
  ...mockTemplate,
  id: 'tpl-sys',
  name: 'Geocaching',
  isSystem: true,
  isPublic: true,
  createdBy: null,
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/templates', component: TemplatesPage },
      { path: '/templates/new', component: { template: '<div/>' } },
      { path: '/templates/:id/edit', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('TemplatesPage', () => {
  it('renders templates after loading', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [mockTemplate];

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('My Template');
  });

  it('shows the system badge for system templates', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [systemTemplate];

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('system');
  });

  it('shows edit/delete buttons for the template owner', async () => {
    const store = useTemplateStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [mockTemplate];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Edit');
    expect(wrapper.text()).toContain('Delete');
  });

  it('hides edit/delete for templates the user does not own', async () => {
    const store = useTemplateStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [mockTemplate];
    auth.user = {
      id: 'user-99',
      username: 'bob',
      email: 'bob@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('Edit');
    expect(wrapper.text()).not.toContain('Delete');
  });

  it('shows edit/delete for admins on any template', async () => {
    const store = useTemplateStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [systemTemplate];
    auth.user = {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@example.com',
      isAdmin: true,
      createdAt: '2025-01-01',
    };

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Edit');
    expect(wrapper.text()).toContain('Delete');
  });

  it('shows an error message when loading fails', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchAll').mockRejectedValue(new Error('Network error'));

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Network error');
  });

  it('shows the active field list for a template', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.templates = [{ ...mockTemplate, useGcCode: true, useHint: true }];

    const router = makeRouter();
    await router.push('/templates');

    const wrapper = mount(TemplatesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('GC code');
    expect(wrapper.text()).toContain('Hint');
  });
});
