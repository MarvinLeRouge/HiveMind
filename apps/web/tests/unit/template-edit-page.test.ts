import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TemplateEditPage from '../../src/pages/TemplateEditPage.vue';
import { useTemplateStore } from '../../src/stores/template';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockTemplate = {
  id: 'tpl-1',
  name: 'My Template',
  description: 'Original description',
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

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/templates/:id/edit', component: TemplateEditPage },
      { path: '/templates', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('TemplateEditPage', () => {
  it('pre-fills the form with the existing template data', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchById').mockImplementation(async () => {
      store.current = mockTemplate;
    });

    const router = makeRouter();
    await router.push('/templates/tpl-1/edit');

    const wrapper = mount(TemplateEditPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const nameInput = wrapper.find('input#name').element as HTMLInputElement;
    expect(nameInput.value).toBe('My Template');
  });

  it('shows an error when loading fails', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchById').mockRejectedValue(new Error('Not found'));

    const router = makeRouter();
    await router.push('/templates/tpl-1/edit');

    const wrapper = mount(TemplateEditPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Not found');
  });

  it('calls store.update and redirects on submit', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchById').mockImplementation(async () => {
      store.current = mockTemplate;
    });
    vi.spyOn(store, 'update').mockResolvedValue();

    const router = makeRouter();
    await router.push('/templates/tpl-1/edit');

    const wrapper = mount(TemplateEditPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input#name').setValue('Updated Name');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(store.update).toHaveBeenCalledWith(
      'tpl-1',
      expect.objectContaining({ name: 'Updated Name' }),
    );
    expect(router.currentRoute.value.path).toBe('/templates');
  });

  it('shows an error message when update fails', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'fetchById').mockImplementation(async () => {
      store.current = mockTemplate;
    });
    vi.spyOn(store, 'update').mockRejectedValue(new Error('Forbidden'));

    const router = makeRouter();
    await router.push('/templates/tpl-1/edit');

    const wrapper = mount(TemplateEditPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Forbidden');
  });
});
