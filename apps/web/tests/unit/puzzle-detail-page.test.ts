import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PuzzleDetailPage from '../../src/pages/PuzzleDetailPage.vue';
import { usePuzzleStore } from '../../src/stores/puzzle';
import { useNoteStore } from '../../src/stores/note';
import { useAttemptStore } from '../../src/stores/attempt';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

const mockPuzzle = {
  id: 'pzl-1',
  collectionId: 'col-1',
  sortOrder: 1,
  title: 'Mystery #1',
  status: 'open',
  workingOnId: null,
  checkerUrl: 'https://checker.example.com',
  gcCode: 'GC12345',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockNote = {
  id: 'note-1',
  puzzleId: 'pzl-1',
  userId: 'user-1',
  content: 'Interesting cipher',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockAttempt = {
  id: 'att-1',
  puzzleId: 'pzl-1',
  userId: 'user-1',
  valueTested: '12345',
  checkerResult: false,
  comment: null,
  createdAt: '2025-01-01T00:00:00.000Z',
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/collections/:id/puzzles/:pid',
        component: PuzzleDetailPage,
      },
      {
        path: '/collections/:id/puzzles',
        component: { template: '<div/>' },
      },
    ],
  });
}

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

describe('PuzzleDetailPage', () => {
  it('renders the puzzle title and status badge', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Mystery #1');
    expect(wrapper.text()).toContain('Open');
  });

  it('shows the GC code when present', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('GC12345');
  });

  it('renders existing notes in the notes tab', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;
    noteStore.notes = [mockNote];

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Interesting cipher');
  });

  it('renders existing attempts in the attempts tab', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;
    attemptStore.attempts = [mockAttempt];

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const attemptsTab = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Attempts');
    await attemptsTab?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('12345');
  });

  it('shows the "Mark as In progress" button for open puzzle', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Mark as In progress');
  });

  it('does not show a status button for verified puzzles', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = { ...mockPuzzle, status: 'verified' };

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('Mark as');
  });

  it('shows a Claim button for unclaimed puzzle', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Claim');
  });

  it('shows an error message when loading fails', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockRejectedValue(
      new Error('Not found'),
    );
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain('Not found');
  });

  it('calls puzzleStore.update when advancing status', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(puzzleStore, 'update').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const statusBtn = wrapper
      .findAll('button')
      .find((b) => b.text().startsWith('Mark as'));
    await statusBtn?.trigger('click');
    await flushPromises();

    expect(puzzleStore.update).toHaveBeenCalledWith(
      'col-1',
      'pzl-1',
      expect.objectContaining({ status: 'in_progress' }),
    );
  });

  it('calls puzzleStore.claim when clicking Claim', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(puzzleStore, 'claim').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const claimBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Claim');
    await claimBtn?.trigger('click');
    await flushPromises();

    expect(puzzleStore.claim).toHaveBeenCalledWith('col-1', 'pzl-1');
  });

  it('calls noteStore.add when submitting a note', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(noteStore, 'add').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    await wrapper
      .find('textarea[placeholder="Add a note…"]')
      .setValue('My note');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(noteStore.add).toHaveBeenCalledWith('pzl-1', 'My note');
  });

  it('calls attemptStore.add when recording an attempt', async () => {
    const puzzleStore = usePuzzleStore();
    const noteStore = useNoteStore();
    const attemptStore = useAttemptStore();
    vi.spyOn(puzzleStore, 'fetchById').mockResolvedValue();
    vi.spyOn(noteStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'fetchAll').mockResolvedValue();
    vi.spyOn(attemptStore, 'add').mockResolvedValue();
    puzzleStore.current = mockPuzzle;

    const router = makeRouter();
    await router.push('/collections/col-1/puzzles/pzl-1');

    const wrapper = mount(PuzzleDetailPage, {
      global: { plugins: [pinia, router] },
    });
    await flushPromises();

    const attemptsTab = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Attempts');
    await attemptsTab?.trigger('click');
    await flushPromises();

    await wrapper.find('input[placeholder="Value to test"]').setValue('12345');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(attemptStore.add).toHaveBeenCalledWith(
      'pzl-1',
      expect.objectContaining({ valueTested: '12345' }),
    );
  });
});
