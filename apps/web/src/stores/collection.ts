import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import { useAuthStore } from '@/stores/auth';
import type { Collection, Member } from '@/types/collection';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for collection data and member management. */
export const useCollectionStore = defineStore('collection', {
  state: () => ({
    collections: [] as Collection[],
    current: null as Collection | null,
    members: [] as Member[],
  }),

  getters: {
    /** True when the authenticated user is an owner or a platform admin. */
    isOwner(state): boolean {
      const auth = useAuthStore();
      if (auth.user?.isAdmin) return true;
      return state.members.some(
        (m) => m.userId === auth.user?.id && m.role === 'owner',
      );
    },
  },

  actions: {
    /** Fetches all collections the current user belongs to. */
    async fetchAll(): Promise<void> {
      this.collections = await apiFetch<Collection[]>(
        `${BASE_URL}/collections`,
      );
    },

    /** Fetches a single collection by ID and loads its member list. */
    async fetchById(id: string): Promise<void> {
      this.current = await apiFetch<Collection>(
        `${BASE_URL}/collections/${id}`,
      );
      await this.fetchMembers(id);
    },

    /** Creates a new collection and returns it. */
    async create(data: {
      name: string;
      description?: string;
      templateId: string;
    }): Promise<Collection> {
      const collection = await apiFetch<Collection>(`${BASE_URL}/collections`, {
        method: 'POST',
        body: data,
      });
      this.collections.push(collection);
      return collection;
    },

    /** Updates a collection's name or description. */
    async update(
      id: string,
      data: { name?: string; description?: string | null },
    ): Promise<void> {
      const updated = await apiFetch<Collection>(
        `${BASE_URL}/collections/${id}`,
        { method: 'PATCH', body: data },
      );
      this.current = updated;
      const idx = this.collections.findIndex((c) => c.id === id);
      if (idx !== -1) this.collections[idx] = updated;
    },

    /** Deletes a collection. */
    async delete(id: string): Promise<void> {
      await apiFetch(`${BASE_URL}/collections/${id}`, { method: 'DELETE' });
      this.collections = this.collections.filter((c) => c.id !== id);
      if (this.current?.id === id) this.current = null;
    },

    /** Loads the member list for a collection. */
    async fetchMembers(id: string): Promise<void> {
      this.members = await apiFetch<Member[]>(
        `${BASE_URL}/collections/${id}/members`,
      );
    },

    /** Removes a member from the current collection. */
    async removeMember(collectionId: string, userId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/members/${userId}`,
        { method: 'DELETE' },
      );
      this.members = this.members.filter((m) => m.userId !== userId);
    },

    /** Sends an invitation to join the collection by email. */
    async invite(collectionId: string, email: string): Promise<void> {
      await apiFetch(`${BASE_URL}/collections/${collectionId}/invitations`, {
        method: 'POST',
        body: { email },
      });
    },
  },
});
