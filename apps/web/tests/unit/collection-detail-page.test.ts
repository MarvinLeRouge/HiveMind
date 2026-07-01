import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import CollectionDetailPage from '../../src/pages/CollectionDetailPage.vue';
import { useCollectionStore } from '../../src/stores/collection';
import { usePuzzleStore } from '../../src/stores/puzzle';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

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
const mockPuzzle = {
  id: 'puz-1',
  title: 'First Puzzle',
  status: 'unsolved',
  sortOrder: 1,
  workers: [] as { id: string; username: string }[],
  gcCode: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collections/:id', component: CollectionDetailPage },
      { path: '/collections', component: { template: '<div/>' } },
      {
        path: '/collections/:id/settings',
        component: { template: '<div/>' },
      },
      {
        path: '/collections/:id/puzzles/:pid',
        component: { template: '<div/>' },
      },
    ],
  });
}

/** Opens the desktop members panel by setting localStorage before mount. */
function openMembersPanel(userId = 'guest') {
  localStorage.setItem(`hm:members-panel:${userId}`, 'true');
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CollectionDetailPage', () => {
  it('renders the collection name and puzzle list after loading', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [mockPuzzle as never];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Test Collection');
    expect(wrapper.text()).toContain('First Puzzle');
  });

  it('shows the members panel when the toggle is clicked', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    // Panel is closed by default — toggle it
    const toggleBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Members'));
    await toggleBtn!.trigger('click');

    expect(wrapper.text()).toContain('alice');
  });

  it('shows the invite form in the panel when the user is an owner', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [];
    const auth = useAuthStore();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    openMembersPanel('user-1');
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Invite a member');
  });

  it('shows an error when loading fails', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockRejectedValue(
      new Error('Not found'),
    );
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Not found');
  });

  it('calls store.invite when the invite form is submitted', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [];
    const inviteSpy = vi.spyOn(collectionStore, 'invite').mockResolvedValue();
    const auth = useAuthStore();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    openMembersPanel('user-1');
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('#panel-invite-email').setValue('bob@example.com');
    await wrapper.find('form[class*="flex-col"]').trigger('submit');
    await flushPromises();

    expect(inviteSpy).toHaveBeenCalledWith('col-1', 'bob@example.com');
  });

  it('does not render the description when it is null', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = {
      ...mockCollection,
      description: null,
    } as never;
    collectionStore.members = [];
    puzzleStore.puzzles = [];
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
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [
      mockMember as never,
      {
        userId: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        role: 'member',
        joinedAt: '2025-01-01',
      } as never,
    ];
    puzzleStore.puzzles = [];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    openMembersPanel('user-1');
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Remove');
  });

  it('calls store.removeMember when the Remove button is clicked', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'removeMember').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [
      mockMember as never,
      {
        userId: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        role: 'member',
        joinedAt: '2025-01-01',
      } as never,
    ];
    puzzleStore.puzzles = [];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    openMembersPanel('user-1');
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button.text-destructive').trigger('click');
    await flushPromises();

    expect(collectionStore.removeMember).toHaveBeenCalledWith(
      'col-1',
      'user-2',
    );
  });

  it('shows an invite error when the invitation fails', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'invite').mockRejectedValue(
      new Error('Already a member'),
    );
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    openMembersPanel('user-1');
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('#panel-invite-email').setValue('bob@example.com');
    await wrapper.find('form[class*="flex-col"]').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Already a member');
  });

  it('persists the members panel state in localStorage', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [];
    puzzleStore.puzzles = [];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const toggleBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Members'));
    await toggleBtn!.trigger('click');

    expect(localStorage.getItem('hm:members-panel:guest')).toBe('true');

    await toggleBtn!.trigger('click');
    expect(localStorage.getItem('hm:members-panel:guest')).toBe('false');
  });
});
