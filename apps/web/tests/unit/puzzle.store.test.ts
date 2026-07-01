import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePuzzleStore } from '../../src/stores/puzzle';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/lib/api-fetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

const mockPuzzle = {
  id: 'pzl-1',
  collectionId: 'col-1',
  sortOrder: 1,
  title: 'Mystery #1',
  status: 'open',
  workers: [] as { id: string; username: string }[],
  checkerUrl: null,
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('usePuzzleStore', () => {
  describe('fetchAll', () => {
    it('loads puzzles from the API', async () => {
      mockFetch.mockResolvedValueOnce([mockPuzzle]);
      const store = usePuzzleStore();

      await store.fetchAll('col-1');

      expect(store.puzzles).toHaveLength(1);
      expect(store.puzzles[0].id).toBe('pzl-1');
    });
  });

  describe('fetchById', () => {
    it('sets current puzzle', async () => {
      mockFetch.mockResolvedValueOnce(mockPuzzle);
      const store = usePuzzleStore();

      await store.fetchById('col-1', 'pzl-1');

      expect(store.current?.id).toBe('pzl-1');
    });
  });

  describe('create', () => {
    it('creates a puzzle and appends it to the list', async () => {
      mockFetch.mockResolvedValueOnce(mockPuzzle);
      const store = usePuzzleStore();

      const result = await store.create('col-1', { title: 'Mystery #1' });

      expect(result.id).toBe('pzl-1');
      expect(store.puzzles).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates the current puzzle and syncs the list', async () => {
      const updated = { ...mockPuzzle, status: 'in_progress' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = usePuzzleStore();
      store.puzzles = [mockPuzzle];
      store.current = mockPuzzle;

      await store.update('col-1', 'pzl-1', { status: 'in_progress' });

      expect(store.current?.status).toBe('in_progress');
      expect(store.puzzles[0].status).toBe('in_progress');
    });
  });

  describe('delete', () => {
    it('removes the puzzle from the list and clears current', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [mockPuzzle];
      store.current = mockPuzzle;

      await store.delete('col-1', 'pzl-1');

      expect(store.puzzles).toHaveLength(0);
      expect(store.current).toBeNull();
    });
  });

  describe('reorder', () => {
    it('calls the reorder endpoint', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();

      await store.reorder('col-1', [{ id: 'pzl-1', sortOrder: 1 }]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reorder'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('claim', () => {
    it('adds the current user to workers', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [{ ...mockPuzzle, workers: [] }];
      const auth = useAuthStore();
      auth.user = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        isAdmin: false,
        language: 'en',
        createdAt: '',
      };

      await store.claim('col-1', 'pzl-1');

      expect(store.puzzles[0].workers).toHaveLength(1);
      expect(store.puzzles[0].workers[0].id).toBe('user-1');
    });

    it('is idempotent when the user is already a worker', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [
        { ...mockPuzzle, workers: [{ id: 'user-1', username: 'alice' }] },
      ];
      const auth = useAuthStore();
      auth.user = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        isAdmin: false,
        language: 'en',
        createdAt: '',
      };

      await store.claim('col-1', 'pzl-1');

      expect(store.puzzles[0].workers).toHaveLength(1);
    });
  });

  describe('unclaim', () => {
    it('removes the current user from workers', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [
        { ...mockPuzzle, workers: [{ id: 'user-1', username: 'alice' }] },
      ];
      const auth = useAuthStore();
      auth.user = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        isAdmin: false,
        language: 'en',
        createdAt: '',
      };

      await store.unclaim('col-1', 'pzl-1');

      expect(store.puzzles[0].workers).toHaveLength(0);
    });
  });
});
