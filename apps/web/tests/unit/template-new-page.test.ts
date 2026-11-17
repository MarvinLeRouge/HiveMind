import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import TemplateNewPage from '../../src/pages/TemplateNewPage.vue';
import { useTemplateStore } from '../../src/stores/template';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockTemplate = {
  id: 'tpl-new',
  name: 'Test',
  description: null,
  isSystem: false,
  isPublic: false,
  createdBy: 'user-1',
  indexMode: 'disabled' as const,
  gcCodeMode: 'disabled' as const,
  difficultyMode: 'disabled' as const,
  terrainMode: 'disabled' as const,
  coordsMode: 'disabled' as const,
  hintMode: 'disabled' as const,
  spoilerMode: 'disabled' as const,
  customField1Label: null,
  customField1Mode: 'disabled' as const,
  customField2Label: null,
  customField2Mode: 'disabled' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/templates/new', component: TemplateNewPage },
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

describe('TemplateNewPage', () => {
  it('renders the form fields', async () => {
    const router = makeRouter();
    await router.push('/templates/new');

    const wrapper = mount(TemplateNewPage, {
      global: { plugins: [pinia, router] },
    });

    expect(wrapper.find('input#name').exists()).toBe(true);
    expect(wrapper.find('textarea#description').exists()).toBe(true);
    expect(wrapper.find('input#isPublic').exists()).toBe(true);
  });

  it('renders all boolean field checkboxes', async () => {
    const router = makeRouter();
    await router.push('/templates/new');

    const wrapper = mount(TemplateNewPage, {
      global: { plugins: [pinia, router] },
    });

    expect(wrapper.text()).toContain('GC code');
    expect(wrapper.text()).toContain('Difficulty rating');
    expect(wrapper.text()).toContain('Coordinates');
  });

  it('calls store.create and redirects on submit', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'create').mockResolvedValue(mockTemplate);

    const router = makeRouter();
    await router.push('/templates/new');

    const wrapper = mount(TemplateNewPage, {
      global: { plugins: [pinia, router] },
    });

    await wrapper.find('input#name').setValue('Test');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test' }),
    );
    expect(router.currentRoute.value.path).toBe('/templates');
  });

  it('shows an error message when creation fails', async () => {
    const store = useTemplateStore();
    vi.spyOn(store, 'create').mockRejectedValue(new Error('Server error'));

    const router = makeRouter();
    await router.push('/templates/new');

    const wrapper = mount(TemplateNewPage, {
      global: { plugins: [pinia, router] },
    });

    await wrapper.find('input#name').setValue('Test');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Server error');
  });
});

describe('TemplateNewPage full form', () => {
  it('submits every edited field', async () => {
    const store = useTemplateStore();

    vi.spyOn(store, 'create').mockResolvedValue(mockTemplate);
    const router = makeRouter();
    await router.push('/templates/new');
    const wrapper = mount(TemplateNewPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input#name').setValue('Full');
    await wrapper.find('textarea#description').setValue('All fields');
    await wrapper.find('input#isPublic').setValue(true);
    await wrapper.find('select#gcCodeMode').setValue('required');
    await wrapper.find('select#hintMode').setValue('optional');
    const customRows = wrapper.findAll('fieldset div.border-t');
    await customRows[0].find('input').setValue('Owner');
    await customRows[0].find('select').setValue('optional');
    await customRows[1].find('input').setValue('Bonus');
    await customRows[1].find('select').setValue('required');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Full',
        description: 'All fields',
        isPublic: true,
        gcCodeMode: 'required',
        hintMode: 'optional',
        customField1Label: 'Owner',
        customField1Mode: 'optional',
        customField2Label: 'Bonus',
        customField2Mode: 'required',
      }),
    );
  });
});
