import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import type { Template } from '@/types/template';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for template data. */
export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [] as Template[],
    current: null as Template | null,
  }),

  actions: {
    /** Fetches all templates accessible to the current user. */
    async fetchAll(): Promise<void> {
      this.templates = await apiFetch<Template[]>(`${BASE_URL}/templates`);
    },

    /** Fetches a single template by ID. */
    async fetchById(id: string): Promise<void> {
      this.current = await apiFetch<Template>(`${BASE_URL}/templates/${id}`);
    },

    /** Creates a new user-owned template. */
    async create(
      data: Partial<Template> & { name: string },
    ): Promise<Template> {
      const template = await apiFetch<Template>(`${BASE_URL}/templates`, {
        method: 'POST',
        body: data,
      });
      this.templates.push(template);
      return template;
    },

    /** Updates an existing template. */
    async update(id: string, data: Partial<Template>): Promise<void> {
      const updated = await apiFetch<Template>(`${BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        body: data,
      });
      this.current = updated;
      const idx = this.templates.findIndex((t) => t.id === id);
      if (idx !== -1) this.templates[idx] = updated;
    },

    /** Deletes a template. */
    async delete(id: string): Promise<void> {
      await apiFetch(`${BASE_URL}/templates/${id}`, { method: 'DELETE' });
      this.templates = this.templates.filter((t) => t.id !== id);
      if (this.current?.id === id) this.current = null;
    },
  },
});
