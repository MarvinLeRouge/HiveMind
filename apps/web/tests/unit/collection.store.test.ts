import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCollectionStore } from '../../src/stores/collection';
import { useAuthStore } from '../../src/stores/auth';

// ── Mock apiFetch ─────────────────────────────────────────────────────────────

vi.mock('../../src/lib/api-fetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTemplate = {
  id: 'tpl-1',
  name: 'Generic',
  description: null,
  isSystem: true,
  isPublic: true,
  createdBy: null,
  useIndex: false,
  useGcCode: false,
  useDifficulty: false,
  useTerrain: false,
  useCoords: false,
  useHint: false,
  useSpoiler: false,
  customField1Label: null,
  customField2Label: null,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockCollection = {
  id: 'col-1',
  name: 'Test Collection',
  description: null,
  createdBy: 'user-1',
  templateSnapshot: mockTemplate,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockMember = {
  userId: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'owner',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useCollectionStore', () => {
  describe('fetchAll', () => {
    it('loads collections from the API', async () => {
      mockFetch.mockResolvedValueOnce([mockCollection]);
      const store = useCollectionStore();

      await store.fetchAll();

      expect(store.collections).toHaveLength(1);
      expect(store.collections[0].id).toBe('col-1');
    });
  });

  describe('create', () => {
    it('creates a collection and appends it to the list', async () => {
      mockFetch.mockResolvedValueOnce(mockCollection);
      const store = useCollectionStore();

      const result = await store.create({
        name: 'Test Collection',
        templateId: 'tpl-1',
      });

      expect(result.id).toBe('col-1');
      expect(store.collections).toHaveLength(1);
    });
  });

  describe('fetchById', () => {
    it('loads the collection and its members', async () => {
      mockFetch
        .mockResolvedValueOnce(mockCollection)
        .mockResolvedValueOnce([mockMember]);
      const store = useCollectionStore();

      await store.fetchById('col-1');

      expect(store.current?.id).toBe('col-1');
      expect(store.members).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates the current collection', async () => {
      const updated = { ...mockCollection, name: 'Renamed' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = useCollectionStore();
      store.current = mockCollection;

      await store.update('col-1', { name: 'Renamed' });

      expect(store.current?.name).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('removes the collection from the list', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useCollectionStore();
      store.collections = [mockCollection];
      store.current = mockCollection;

      await store.delete('col-1');

      expect(store.collections).toHaveLength(0);
      expect(store.current).toBeNull();
    });
  });

  describe('removeMember', () => {
    it('removes a member from the list after the API call', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useCollectionStore();
      store.members = [mockMember, { ...mockMember, userId: 'user-2' }];

      await store.removeMember('col-1', 'user-2');

      expect(store.members).toHaveLength(1);
      expect(store.members[0].userId).toBe('user-1');
    });
  });

  describe('invite', () => {
    it('calls the invitations endpoint', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useCollectionStore();

      await store.invite('col-1', 'bob@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/invitations'),
        expect.objectContaining({
          method: 'POST',
          body: { email: 'bob@example.com' },
        }),
      );
    });
  });

  describe('isOwner getter', () => {
    it('returns true when the current user has the owner role', () => {
      const store = useCollectionStore();
      const auth = useAuthStore();
      auth.user = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        isAdmin: false,
        createdAt: '2025-01-01',
      };
      store.members = [mockMember];

      expect(store.isOwner).toBe(true);
    });

    it('returns false when the current user is not an owner', () => {
      const store = useCollectionStore();
      const auth = useAuthStore();
      auth.user = {
        id: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        isAdmin: false,
        createdAt: '2025-01-01',
      };
      store.members = [mockMember];

      expect(store.isOwner).toBe(false);
    });
  });
});
