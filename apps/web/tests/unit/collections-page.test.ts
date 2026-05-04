import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionsPage from '../../src/pages/CollectionsPage.vue';
import { useCollectionStore } from '../../src/stores/collection';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockCollection = {
  id: 'col-1',
  name: 'My Collection',
  description: 'A description',
  createdBy: 'user-1',
  templateSnapshot: { id: 'tpl-1', name: 'Generic', isSystem: true },
  createdAt: '2025-01-01T00:00:00.000Z',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collections', component: CollectionsPage },
      { path: '/collections/new', component: { template: '<div/>' } },
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

describe('CollectionsPage', () => {
  it('shows a loading message initially', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockImplementation(() => new Promise(() => {}));
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });

    expect(wrapper.text()).toContain('Loading');
  });

  it('renders collection cards after loading', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.collections = [mockCollection as never];
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('My Collection');
  });

  it('shows the empty state when there are no collections', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('no collections yet');
  });

  it('shows an error message when loading fails', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockRejectedValue(new Error('Network error'));
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Network error');
  });
});
