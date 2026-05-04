import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionSettingsPage from '../../src/pages/CollectionSettingsPage.vue';
import { useCollectionStore } from '../../src/stores/collection';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockCollection = {
  id: 'col-1',
  name: 'Test Collection',
  description: 'A desc',
  createdBy: 'user-1',
  templateSnapshot: { id: 'tpl-1', name: 'Generic' },
  createdAt: '2025-01-01',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collections/:id/settings', component: CollectionSettingsPage },
      { path: '/collections/:id', component: { template: '<div/>' } },
      { path: '/collections', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('CollectionSettingsPage', () => {
  it('pre-fills form with current collection data', async () => {
    const store = useCollectionStore();
    store.current = mockCollection as never;
    store.members = [];
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections/col-1/settings');

    const wrapper = mount(CollectionSettingsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect((wrapper.find('input#name').element as HTMLInputElement).value).toBe(
      'Test Collection',
    );
  });

  it('calls store.update with the edited values on save', async () => {
    const store = useCollectionStore();
    store.current = mockCollection as never;
    store.members = [];
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    const updateSpy = vi.spyOn(store, 'update').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections/col-1/settings');

    const wrapper = mount(CollectionSettingsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input#name').setValue('Renamed');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(updateSpy).toHaveBeenCalledWith(
      'col-1',
      expect.objectContaining({ name: 'Renamed' }),
    );
  });

  it('shows the delete confirmation when the delete button is clicked', async () => {
    const store = useCollectionStore();
    store.current = mockCollection as never;
    store.members = [];
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections/col-1/settings');

    const wrapper = mount(CollectionSettingsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button.border-destructive').trigger('click');

    expect(wrapper.text()).toContain('Are you sure?');
  });

  it('calls store.delete and redirects on confirmed deletion', async () => {
    const store = useCollectionStore();
    store.current = mockCollection as never;
    store.members = [];
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    const deleteSpy = vi.spyOn(store, 'delete').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections/col-1/settings');

    const wrapper = mount(CollectionSettingsPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button.border-destructive').trigger('click');
    await wrapper.find('button.bg-destructive').trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith('col-1');
    expect(router.currentRoute.value.path).toBe('/collections');
  });
});
