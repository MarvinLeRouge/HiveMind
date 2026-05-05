import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePuzzleStore } from '../../src/stores/puzzle';

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
  workingOnId: null,
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
    it('sets workingOnId to a truthy sentinel', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [mockPuzzle];

      await store.claim('col-1', 'pzl-1');

      expect(store.puzzles[0].workingOnId).toBeTruthy();
    });
  });

  describe('unclaim', () => {
    it('clears workingOnId', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = usePuzzleStore();
      store.puzzles = [{ ...mockPuzzle, workingOnId: 'user-1' }];

      await store.unclaim('col-1', 'pzl-1');

      expect(store.puzzles[0].workingOnId).toBeNull();
    });
  });
});
