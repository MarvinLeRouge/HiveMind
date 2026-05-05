import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNoteStore } from '../../src/stores/note';

vi.mock('../../src/lib/api-fetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

const mockNote = {
  id: 'note-1',
  puzzleId: 'pzl-1',
  userId: 'user-1',
  content: 'Interesting cipher here',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useNoteStore', () => {
  describe('fetchAll', () => {
    it('loads notes from the API', async () => {
      mockFetch.mockResolvedValueOnce([mockNote]);
      const store = useNoteStore();

      await store.fetchAll('pzl-1');

      expect(store.notes).toHaveLength(1);
      expect(store.notes[0].id).toBe('note-1');
    });
  });

  describe('add', () => {
    it('appends the new note to the list', async () => {
      mockFetch.mockResolvedValueOnce(mockNote);
      const store = useNoteStore();

      await store.add('pzl-1', 'Interesting cipher here');

      expect(store.notes).toHaveLength(1);
      expect(store.notes[0].content).toBe('Interesting cipher here');
    });
  });

  describe('update', () => {
    it('replaces the note in the list with the updated version', async () => {
      const updated = { ...mockNote, content: 'Updated content' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = useNoteStore();
      store.notes = [mockNote];

      await store.update('pzl-1', 'note-1', 'Updated content');

      expect(store.notes[0].content).toBe('Updated content');
    });
  });

  describe('delete', () => {
    it('removes the note from the list', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useNoteStore();
      store.notes = [mockNote];

      await store.delete('pzl-1', 'note-1');

      expect(store.notes).toHaveLength(0);
    });
  });
});
