import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import type { Template } from '@/types/template';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for template data (used mainly in the collection create form). */
export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [] as Template[],
  }),

  actions: {
    /** Fetches all templates accessible to the current user. */
    async fetchAll(): Promise<void> {
      this.templates = await apiFetch<Template[]>(`${BASE_URL}/templates`);
    },
  },
});
