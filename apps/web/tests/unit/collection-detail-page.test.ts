import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { nextTick } from 'vue';
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

  it('calls puzzleStore.create when the add puzzle form is submitted', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(puzzleStore, 'create').mockResolvedValue({
      id: 'puz-new',
      title: 'New Puzzle',
      status: 'open',
      sortOrder: 2,
      workers: [],
      gcCode: null,
    } as never);
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const addBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Add puzzle'));
    await addBtn!.trigger('click');
    await flushPromises();

    await wrapper.find('#new-puzzle-title').setValue('New Puzzle');
    await wrapper.find('form[aria-label="Add puzzle"]').trigger('submit');
    await flushPromises();

    expect(puzzleStore.create).toHaveBeenCalledWith(
      'col-1',
      expect.objectContaining({ title: 'New Puzzle' }),
    );
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

  it('shows "You" badge when the current user is in the puzzle workers', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    puzzleStore.puzzles = [
      {
        ...mockPuzzle,
        workers: [{ id: 'user-1', username: 'alice' }],
      } as never,
    ];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('You');
  });

  it('shows "active" badge when another user is in the puzzle workers', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    puzzleStore.puzzles = [
      { ...mockPuzzle, workers: [{ id: 'user-99', username: 'bob' }] } as never,
    ];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('You');
  });

  it('calls puzzleStore.reorder when the move-up button is clicked', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(puzzleStore, 'reorder').mockResolvedValue();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [
      { ...mockPuzzle, id: 'puz-1', title: 'First', sortOrder: 1 } as never,
      { ...mockPuzzle, id: 'puz-2', title: 'Second', sortOrder: 2 } as never,
    ];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const moveUpButtons = wrapper.findAll('[aria-label="Move up"]');
    await moveUpButtons[1].trigger('click');
    await flushPromises();

    expect(puzzleStore.reorder).toHaveBeenCalledWith(
      'col-1',
      expect.arrayContaining([
        expect.objectContaining({ id: 'puz-2', sortOrder: 1 }),
        expect.objectContaining({ id: 'puz-1', sortOrder: 2 }),
      ]),
    );
  });

  it('calls puzzleStore.reorder when the move-down button is clicked', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const auth = useAuthStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(puzzleStore, 'reorder').mockResolvedValue();
    auth.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never];
    puzzleStore.puzzles = [
      { ...mockPuzzle, id: 'puz-1', title: 'First', sortOrder: 1 } as never,
      { ...mockPuzzle, id: 'puz-2', title: 'Second', sortOrder: 2 } as never,
    ];
    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const moveDownButtons = wrapper.findAll('[aria-label="Move down"]');
    await moveDownButtons[0].trigger('click');
    await flushPromises();

    expect(puzzleStore.reorder).toHaveBeenCalledWith(
      'col-1',
      expect.arrayContaining([
        expect.objectContaining({ id: 'puz-2', sortOrder: 1 }),
        expect.objectContaining({ id: 'puz-1', sortOrder: 2 }),
      ]),
    );
  });

  it('retries loading when the retry button is clicked', async () => {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    const fetchBySpy = vi
      .spyOn(collectionStore, 'fetchById')
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();

    const router = makeRouter();
    await router.push('/collections/col-1');

    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();

    expect(fetchBySpy).toHaveBeenCalledTimes(2);
  });
});

// ── Owner actions: drag-and-drop, full add form, error states ─────────────────

describe('CollectionDetailPage owner actions', () => {
  const secondMember = {
    userId: 'user-2',
    username: 'bob',
    email: 'bob@example.com',
    role: 'member',
    joinedAt: '2025-01-01',
  };

  async function mountAsOwner(
    puzzles = [
      { ...mockPuzzle, id: 'puz-1', title: 'First', sortOrder: 1 },
      { ...mockPuzzle, id: 'puz-2', title: 'Second', sortOrder: 2 },
    ],
  ) {
    const collectionStore = useCollectionStore();
    const puzzleStore = usePuzzleStore();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    collectionStore.current = mockCollection as never;
    collectionStore.members = [mockMember as never, secondMember as never];
    puzzleStore.puzzles = puzzles as never;
    useAuthStore().user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      language: 'en',
      createdAt: '2025-01-01',
    };
    const router = makeRouter();
    await router.push('/collections/col-1');
    const wrapper = mount(CollectionDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();
    return { wrapper, collectionStore, puzzleStore };
  }

  function puzzleTitles(
    wrapper: Awaited<ReturnType<typeof mountAsOwner>>['wrapper'],
  ) {
    return wrapper
      .findAll('ul[aria-label="Puzzle list"] > li')
      .map((li) => (li.text().includes('First') ? 'First' : 'Second'));
  }

  it('reorders puzzles on drag and drop and persists the new order', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'reorder').mockResolvedValue();
    const items = wrapper.findAll('ul[aria-label="Puzzle list"] > li');

    await items[0].trigger('dragstart');
    await items[1].trigger('dragover');
    await items[1].trigger('drop');
    await flushPromises();

    expect(puzzleTitles(wrapper)).toEqual(['Second', 'First']);
    expect(puzzleStore.reorder).toHaveBeenCalledWith('col-1', [
      { id: 'puz-2', sortOrder: 1 },
      { id: 'puz-1', sortOrder: 2 },
    ]);
  });

  it('ignores a drop on the dragged item itself', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'reorder').mockResolvedValue();
    const items = wrapper.findAll('ul[aria-label="Puzzle list"] > li');

    await items[0].trigger('dragstart');
    await items[0].trigger('drop');
    await flushPromises();

    expect(puzzleStore.reorder).not.toHaveBeenCalled();
  });

  it('shows an error banner when the drag-and-drop reorder fails', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'reorder').mockRejectedValue(
      new Error('Reorder down'),
    );
    const items = wrapper.findAll('ul[aria-label="Puzzle list"] > li');

    await items[0].trigger('dragstart');
    await items[1].trigger('drop');
    await flushPromises();

    expect(wrapper.text()).toContain('Reorder down');
  });

  it('does not move the first puzzle up or the last puzzle down', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'reorder').mockResolvedValue();

    await wrapper.findAll('[aria-label="Move up"]')[0].trigger('click');
    await wrapper.findAll('[aria-label="Move down"]')[1].trigger('click');
    await flushPromises();

    expect(puzzleStore.reorder).not.toHaveBeenCalled();
  });

  it.each(['Move up', 'Move down'])(
    'shows an error banner when "%s" fails',
    async (label) => {
      const { wrapper, puzzleStore } = await mountAsOwner();
      vi.spyOn(puzzleStore, 'reorder').mockRejectedValue(
        new Error('Move failed'),
      );
      const index = label === 'Move up' ? 1 : 0;

      await wrapper.findAll(`[aria-label="${label}"]`)[index].trigger('click');
      await flushPromises();

      expect(wrapper.text()).toContain('Move failed');
    },
  );

  async function openAddForm(
    wrapper: Awaited<ReturnType<typeof mountAsOwner>>['wrapper'],
  ) {
    const addBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Add puzzle'));
    await addBtn!.trigger('click');
    await flushPromises();
  }

  it('sends every filled field of the add form and closes it', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'create').mockResolvedValue({} as never);
    await openAddForm(wrapper);

    await wrapper.find('#new-puzzle-title').setValue('Full Puzzle');
    await wrapper.find('#new-puzzle-description').setValue('Desc');
    await wrapper
      .find('#new-puzzle-checker')
      .setValue('https://checker.example.com');
    await wrapper.find('#new-gc-code').setValue('GC123');
    await wrapper.find('#new-difficulty').setValue('3');
    await wrapper.find('#new-terrain').setValue('2');
    await wrapper.find('#new-coords').setValue('N 48 E 2');
    await wrapper.find('#new-hint').setValue('Look up');
    await wrapper.find('#new-spoiler').setValue('Behind the tree');
    await wrapper.find('form[aria-label="Add puzzle"]').trigger('submit');
    await flushPromises();

    expect(puzzleStore.create).toHaveBeenCalledWith('col-1', {
      title: 'Full Puzzle',
      description: 'Desc',
      checkerUrl: 'https://checker.example.com',
      gcCode: 'GC123',
      difficulty: 3,
      terrain: 2,
      coords: 'N 48 E 2',
      hint: 'Look up',
      spoiler: 'Behind the tree',
    });
    expect(wrapper.find('form[aria-label="Add puzzle"]').exists()).toBe(false);
  });

  it('keeps the add form open with an error when creation fails', async () => {
    const { wrapper, puzzleStore } = await mountAsOwner();
    vi.spyOn(puzzleStore, 'create').mockRejectedValue(new Error('Title taken'));
    await openAddForm(wrapper);

    await wrapper.find('#new-puzzle-title').setValue('Dup');
    await wrapper.find('form[aria-label="Add puzzle"]').trigger('submit');
    await flushPromises();

    expect(
      wrapper.find('form[aria-label="Add puzzle"] [role="alert"]').text(),
    ).toBe('Title taken');
  });

  it('shows an error banner when removing a member fails', async () => {
    openMembersPanel('user-1');
    const { wrapper, collectionStore } = await mountAsOwner([]);
    vi.spyOn(collectionStore, 'removeMember').mockRejectedValue(
      new Error('Cannot remove'),
    );

    await wrapper.find('button.text-destructive').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Cannot remove');
  });

  it('opens the mobile members drawer and closes it from the backdrop or the close button', async () => {
    const { wrapper } = await mountAsOwner([]);
    const openDrawer = async () => {
      const mobileToggle = wrapper
        .findAll('button')
        .find((b) => b.classes().includes('md:hidden'));
      await mobileToggle!.trigger('click');
    };
    // The drawer is teleported to <body>, outside the wrapper
    const drawer = () =>
      document.body.querySelector<HTMLElement>('[role="dialog"]');
    const click = async (el: Element | null | undefined) => {
      (el as HTMLElement).click();
      await nextTick();
    };

    await openDrawer();
    expect(drawer()).not.toBeNull();
    await click(drawer()?.querySelector('.bg-black\\/40'));
    expect(drawer()).toBeNull();

    await openDrawer();
    await click(drawer()?.querySelector('button[aria-label="Close"]'));
    expect(drawer()).toBeNull();
    wrapper.unmount();
  });
});
