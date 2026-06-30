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
  indexMode: 'disabled' as const,
  gcCodeMode: 'disabled' as const,
  difficultyMode: 'disabled' as const,
  terrainMode: 'disabled' as const,
  coordsMode: 'disabled' as const,
  hintMode: 'disabled' as const,
  spoilerMode: 'disabled' as const,
  customField1Label: null,
  customField1Mode: 'disabled' as const,
  customField2Label: null,
  customField2Mode: 'disabled' as const,
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
    it('updates a user template via PATCH /templates/:id', async () => {
      const updated = { ...mockTemplate, name: 'Renamed' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = useTemplateStore();
      store.templates = [mockTemplate];
      store.current = mockTemplate;

      await store.update('tpl-1', { name: 'Renamed' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/tpl-1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(store.current?.name).toBe('Renamed');
      expect(store.templates[0].name).toBe('Renamed');
    });

    it('updates a system template via PATCH /templates/system/:id', async () => {
      const systemTemplate = {
        ...mockTemplate,
        id: 'system-template-generic',
        isSystem: true,
        createdBy: null,
      };
      const updated = { ...systemTemplate, description: 'Updated' };
      mockFetch.mockResolvedValueOnce(updated);
      const store = useTemplateStore();
      store.templates = [systemTemplate];
      store.current = systemTemplate;

      await store.update('system-template-generic', { description: 'Updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/system/system-template-generic'),
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(store.current?.description).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes a user template via DELETE /templates/:id', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useTemplateStore();
      store.templates = [mockTemplate];
      store.current = mockTemplate;

      await store.delete('tpl-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/tpl-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(store.templates).toHaveLength(0);
      expect(store.current).toBeNull();
    });

    it('deletes a system template via DELETE /templates/system/:id', async () => {
      const systemTemplate = {
        ...mockTemplate,
        id: 'system-template-generic',
        isSystem: true,
        createdBy: null,
      };
      mockFetch.mockResolvedValueOnce(undefined);
      const store = useTemplateStore();
      store.templates = [systemTemplate];
      store.current = systemTemplate;

      await store.delete('system-template-generic');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/templates/system/system-template-generic'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(store.templates).toHaveLength(0);
    });
  });
});
