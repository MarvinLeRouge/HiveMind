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
  isSystem: false,
  isPublic: false,
  createdBy: 'user-1',
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

  describe('fetchById', () => {
    it('sets current template', async () => {
      mockFetch.mockResolvedValueOnce(mockTemplate);
      const store = useTemplateStore();

      await store.fetchById('tpl-1');

      expect(store.current?.id).toBe('tpl-1');
    });
  });

  describe('create', () => {
    it('creates a template and appends it to the list', async () => {
      mockFetch.mockResolvedValueOnce(mockTemplate);
      const store = useTemplateStore();

      const result = await store.create({ name: 'Generic' });

      expect(result.id).toBe('tpl-1');
      expect(store.templates).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates the template and syncs the list', async () => {
      const updated = { ...mockTemplate, name: 'Renamed' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = useTemplateStore();
      store.templates = [mockTemplate];
      store.current = mockTemplate;

      await store.update('tpl-1', { name: 'Renamed' });

      expect(store.current?.name).toBe('Renamed');
      expect(store.templates[0].name).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('removes the template from the list and clears current', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useTemplateStore();
      store.templates = [mockTemplate];
      store.current = mockTemplate;

      await store.delete('tpl-1');

      expect(store.templates).toHaveLength(0);
      expect(store.current).toBeNull();
    });
  });
});
