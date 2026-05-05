import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PuzzlesPage from '../../src/pages/PuzzlesPage.vue';
import { usePuzzleStore } from '../../src/stores/puzzle';
import { useCollectionStore } from '../../src/stores/collection';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockPuzzle = {
  id: 'pzl-1',
  collectionId: 'col-1',
  sortOrder: 1,
  title: 'Mystery #1',
  status: 'open',
  workingOnId: null,
  checkerUrl: null,
  updatedAt: '2025-01-01T00:00:00.000Z',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/collections/:id/puzzles',
        component: PuzzlesPage,
      },
      {
        path: '/collections/:id/puzzles/:pid',
        component: { template: '<div/>' },
      },
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

describe('PuzzlesPage', () => {
  it('shows puzzles after loading', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    puzzleStore.puzzles = [mockPuzzle];

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Mystery #1');
  });

  it('shows empty state when no puzzles', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('No puzzles yet');
  });

  it('shows an error message when loading fails', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockRejectedValue(
      new Error('Load failed'),
    );
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Load failed');
  });

  it('shows a claim indicator for claimed puzzles', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    puzzleStore.puzzles = [{ ...mockPuzzle, workingOnId: 'user-99' }];

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Claimed');
  });

  it('shows the add puzzle button for owners', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    const authStore = useAuthStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();

    authStore.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: false,
      createdAt: '2025-01-01',
    };
    collectionStore.members = [
      {
        userId: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        role: 'owner',
        joinedAt: '2025-01-01',
      },
    ];

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Add puzzle');
  });

  it('adds a puzzle and hides the form on success', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    const authStore = useAuthStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'create').mockResolvedValue({
      ...mockPuzzle,
      id: 'pzl-new',
      title: 'New Puzzle',
    });
    authStore.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: true,
      createdAt: '2025-01-01',
    };

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button').trigger('click');
    await wrapper
      .find('input[placeholder="Puzzle title"]')
      .setValue('New Puzzle');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(puzzleStore.create).toHaveBeenCalledWith(
      'col-1',
      expect.objectContaining({ title: 'New Puzzle' }),
    );
  });

  it('shows an error when adding a puzzle fails', async () => {
    const puzzleStore = usePuzzleStore();
    const collectionStore = useCollectionStore();
    const authStore = useAuthStore();
    vi.spyOn(puzzleStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(collectionStore, 'fetchById').mockResolvedValue();
    vi.spyOn(puzzleStore, 'create').mockRejectedValue(
      new Error('Server error'),
    );
    authStore.user = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      isAdmin: true,
      createdAt: '2025-01-01',
    };

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles');

    const wrapper = mount(PuzzlesPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper.find('button').trigger('click');
    await wrapper.find('input[placeholder="Puzzle title"]').setValue('Bad');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Server error');
  });
});
