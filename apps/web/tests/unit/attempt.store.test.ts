import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAttemptStore } from '../../src/stores/attempt';

vi.mock('../../src/lib/api-fetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

const mockAttempt = {
  id: 'att-1',
  puzzleId: 'pzl-1',
  userId: 'user-1',
  valueTested: '12345',
  checkerResult: false,
  comment: null,
  createdAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useAttemptStore', () => {
  describe('fetchAll', () => {
    it('loads attempts from the API', async () => {
      mockFetch.mockResolvedValueOnce([mockAttempt]);
      const store = useAttemptStore();

      await store.fetchAll('pzl-1');

      expect(store.attempts).toHaveLength(1);
      expect(store.attempts[0].id).toBe('att-1');
    });
  });

  describe('add', () => {
    it('appends the new attempt to the list', async () => {
      mockFetch.mockResolvedValueOnce(mockAttempt);
      const store = useAttemptStore();

      await store.add('pzl-1', {
        valueTested: '12345',
        checkerResult: false,
      });

      expect(store.attempts).toHaveLength(1);
      expect(store.attempts[0].valueTested).toBe('12345');
    });

    it('includes the comment when provided', async () => {
      const withComment = {
        ...mockAttempt,
        comment: 'close but no',
        checkerResult: false,
      };
      mockFetch.mockResolvedValueOnce(withComment);
      const store = useAttemptStore();

      await store.add('pzl-1', {
        valueTested: '12345',
        checkerResult: false,
        comment: 'close but no',
      });

      expect(store.attempts[0].comment).toBe('close but no');
    });

    it('records a successful attempt', async () => {
      const success = { ...mockAttempt, checkerResult: true };
      mockFetch.mockResolvedValueOnce(success);
      const store = useAttemptStore();

      await store.add('pzl-1', { valueTested: '67890', checkerResult: true });

      expect(store.attempts[0].checkerResult).toBe(true);
    });
  });
});
