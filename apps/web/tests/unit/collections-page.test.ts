import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionsPage from '../../src/pages/CollectionsPage.vue';
import { useCollectionStore } from '../../src/stores/collection';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockCollection = {
  id: 'col-1',
  slug: 'my-collection',
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

    expect(wrapper.text()).toContain('No collections yet.');
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

  it('retries loading when the retry button is clicked', async () => {
    const store = useCollectionStore();
    const fetchAllSpy = vi
      .spyOn(store, 'fetchAll')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(fetchAllSpy).toHaveBeenCalledTimes(2);
  });
});

describe('CollectionsPage relative dates', () => {
  it.each([
    [2 * 3_600_000, '2 hours ago'],
    [5 * 86_400_000, '5 days ago'],
    [90 * 86_400_000, '3 months ago'],
  ])('shows a creation date %i ms old as "%s"', async (ageMs, expected) => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.collections = [
      {
        ...mockCollection,
        createdAt: new Date(Date.now() - ageMs).toISOString(),
      } as never,
    ];
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain(expected);
  });
});

describe('CollectionsPage edge cases', () => {
  it('omits the description line when a collection has none', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockResolvedValue();
    store.collections = [{ ...mockCollection, description: null } as never];
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('My Collection');
    expect(wrapper.text()).not.toContain('A description');
  });

  it('shows the generic error when loading rejects with a non-Error value', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchAll').mockRejectedValue('boom');
    const router = makeRouter();
    await router.push('/collections');

    const wrapper = mount(CollectionsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Something went wrong');
  });
});
