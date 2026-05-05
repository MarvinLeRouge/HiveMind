import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionDetailPage from '../../src/pages/CollectionDetailPage.vue';
import { useCollectionStore } from '../../src/stores/collection';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockTemplate = { id: 'tpl-1', name: 'Generic' };
const mockCollection = {
  id: 'col-1',
  slug: 'test-collection',
  name: 'Test Collection',
  description: 'A desc',
  createdBy: 'user-1',
  templateSnapshot: mockTemplate,
  createdAt: '2025-01-01',
};
const mockMember = {
  userId: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'owner',
  joinedAt: '2025-01-01',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collections/:id', component: CollectionDetailPage },
      { path: '/collections', component: { template: '<div/>' } },
      { path: '/collections/:id/settings', component: { template: '<div/>' } },
      { path: '/collections/:id/puzzles', component: { template: '<div/>' } },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('CollectionDetailPage', () => {
  it('renders collection name and members after loading', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    store.current = mockCollection as never;
    store.members = [mockMember as never];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Test Collection');
    expect(wrapper.text()).toContain('alice');
  });

  it('shows the invite form when the user is an owner', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    store.current = mockCollection as never;
    store.members = [mockMember as never];
    const auth = useAuthStore();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Invite a member');
  });

  it('shows an error when loading fails', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchById').mockRejectedValue(new Error('Not found'));
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Not found');
  });

  it('calls store.invite when the invite form is submitted', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    store.current = mockCollection as never;
    store.members = [mockMember as never];
    const inviteSpy = vi.spyOn(store, 'invite').mockResolvedValue();
    const auth = useAuthStore();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input[type="email"]').setValue('bob@example.com');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(inviteSpy).toHaveBeenCalledWith('col-1', 'bob@example.com');
  });

  it('does not render the description paragraph when description is null', async () => {
    const store = useCollectionStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    store.current = { ...mockCollection, description: null } as never;
    store.members = [mockMember as never];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Test Collection');
    expect(wrapper.text()).not.toContain('A desc');
  });

  it('shows the Remove button for owners viewing other members', async () => {
    const store = useCollectionStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    store.current = mockCollection as never;
    store.members = [
      mockMember as never,
      {
        userId: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        role: 'member',
        joinedAt: '2025-01-01',
      } as never,
    ];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Remove');
  });

  it('calls store.removeMember when the Remove button is clicked', async () => {
    const store = useCollectionStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    vi.spyOn(store, 'removeMember').mockResolvedValue();
    store.current = mockCollection as never;
    store.members = [
      mockMember as never,
      {
        userId: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        role: 'member',
        joinedAt: '2025-01-01',
      } as never,
    ];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button.text-destructive').trigger('click');
    await flushPromises();

    expect(store.removeMember).toHaveBeenCalledWith('col-1', 'user-2');
  });

  it('shows an invite error when the invitation fails', async () => {
    const store = useCollectionStore();
    const auth = useAuthStore();
    vi.spyOn(store, 'fetchById').mockResolvedValue();
    vi.spyOn(store, 'invite').mockRejectedValue(new Error('Already a member'));
    store.current = mockCollection as never;
    store.members = [mockMember as never];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('input[type="email"]').setValue('bob@example.com');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Already a member');
  });
});
