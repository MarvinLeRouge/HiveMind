import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionNewPage from '../../src/pages/CollectionNewPage.vue';
import { useCollectionStore } from '../../src/stores/collection';
import { useTemplateStore } from '../../src/stores/template';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockTemplate = { id: 'tpl-1', name: 'Generic' };
const mockCollection = { id: 'col-new', name: 'My Col' };

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collections/new', component: CollectionNewPage },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/collections/:id', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('CollectionNewPage', () => {
  it('renders name, description, and template inputs', async () => {
    const templateStore = useTemplateStore();
    vi.spyOn(templateStore, 'fetchAll').mockResolvedValue();
    templateStore.templates = [mockTemplate as never];
    const router = makeRouter();
    await router.push('/collections/new');

    const wrapper = mount(CollectionNewPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('input#name').exists()).toBe(true);
    expect(wrapper.find('textarea#description').exists()).toBe(true);
    expect(wrapper.find('select#template').exists()).toBe(true);
  });

  it('calls store.create with form values on submit', async () => {
    const templateStore = useTemplateStore();
    vi.spyOn(templateStore, 'fetchAll').mockResolvedValue();
    templateStore.templates = [mockTemplate as never];
    const collectionStore = useCollectionStore();
    const createSpy = vi
      .spyOn(collectionStore, 'create')
      .mockResolvedValue(mockCollection as never);
    const router = makeRouter();
    await router.push('/collections/new');

    const wrapper = mount(CollectionNewPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input#name').setValue('My Col');
    await wrapper.find('select#template').setValue('tpl-1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Col', templateId: 'tpl-1' }),
    );
  });

  it('redirects to the collection page after successful creation', async () => {
    const templateStore = useTemplateStore();
    vi.spyOn(templateStore, 'fetchAll').mockResolvedValue();
    const collectionStore = useCollectionStore();
    vi.spyOn(collectionStore, 'create').mockResolvedValue(
      mockCollection as never,
    );
    const router = makeRouter();
    await router.push('/collections/new');

    const wrapper = mount(CollectionNewPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/collections/col-new');
  });

  it('displays an error message when creation fails', async () => {
    const templateStore = useTemplateStore();
    vi.spyOn(templateStore, 'fetchAll').mockResolvedValue();
    const collectionStore = useCollectionStore();
    vi.spyOn(collectionStore, 'create').mockRejectedValue(
      new Error('Server error'),
    );
    const router = makeRouter();
    await router.push('/collections/new');

    const wrapper = mount(CollectionNewPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Server error');
  });
});
