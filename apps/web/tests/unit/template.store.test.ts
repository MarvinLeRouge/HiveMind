import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTemplateStore } from '../../src/stores/template';

vi.mock('../../src/lib/api-fetch', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '../../src/lib/api-fetch';
const mockFetch = vi.mocked(apiFetch);

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

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useTemplateStore', () => {
  describe('fetchAll', () => {
    it('loads templates from the API', async () => {
      mockFetch.mockResolvedValueOnce([mockTemplate]);
      const store = useTemplateStore();

      await store.fetchAll();

      expect(store.templates).toHaveLength(1);
      expect(store.templates[0].id).toBe('tpl-1');
    });

    it('replaces the template list on each fetch', async () => {
      mockFetch.mockResolvedValueOnce([mockTemplate]);
      const store = useTemplateStore();
      store.templates = [{ ...mockTemplate, id: 'old' }] as never[];

      await store.fetchAll();

      expect(store.templates).toHaveLength(1);
      expect(store.templates[0].id).toBe('tpl-1');
    });
  });
});
