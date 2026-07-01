import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import { useAuthStore } from '@/stores/auth';
import type { Puzzle } from '@/types/puzzle';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for puzzle data within a collection. */
export const usePuzzleStore = defineStore('puzzle', {
  state: () => ({
    puzzles: [] as Puzzle[],
    current: null as Puzzle | null,
  }),

  actions: {
    /** Fetches all puzzles for a collection, ordered by sortOrder. */
    async fetchAll(collectionId: string): Promise<void> {
      this.puzzles = await apiFetch<Puzzle[]>(
        `${BASE_URL}/collections/${collectionId}/puzzles`,
      );
    },

    /** Fetches a single puzzle by ID. */
    async fetchById(collectionId: string, puzzleId: string): Promise<void> {
      this.current = await apiFetch<Puzzle>(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}`,
      );
    },

    /** Creates a new puzzle in the collection. */
    async create(
      collectionId: string,
      data: { title: string; checkerUrl?: string },
    ): Promise<Puzzle> {
      const puzzle = await apiFetch<Puzzle>(
        `${BASE_URL}/collections/${collectionId}/puzzles`,
        { method: 'POST', body: data },
      );
      this.puzzles.push(puzzle);
      return puzzle;
    },

    /** Updates a puzzle's fields. */
    async update(
      collectionId: string,
      puzzleId: string,
      data: Record<string, unknown>,
    ): Promise<void> {
      const updated = await apiFetch<Puzzle>(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}`,
        { method: 'PATCH', body: data },
      );
      this.current = updated;
      const idx = this.puzzles.findIndex((p) => p.id === puzzleId);
      if (idx !== -1) this.puzzles[idx] = updated;
    },

    /** Deletes a puzzle. */
    async delete(collectionId: string, puzzleId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}`,
        { method: 'DELETE' },
      );
      this.puzzles = this.puzzles.filter((p) => p.id !== puzzleId);
      if (this.current?.id === puzzleId) this.current = null;
    },

    /** Sends a bulk sortOrder update for drag-and-drop reorder. */
    async reorder(
      collectionId: string,
      items: { id: string; sortOrder: number }[],
    ): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/reorder`,
        { method: 'PATCH', body: { puzzles: items } },
      );
    },

    /** Marks the current user as working on the puzzle. */
    async claim(collectionId: string, puzzleId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}/claim`,
        { method: 'POST' },
      );
      const auth = useAuthStore();
      const me = auth.user
        ? { id: auth.user.id, username: auth.user.username }
        : null;
      if (!me) return;
      const addWorker = (p: Puzzle) => {
        if (!p.workers.some((w) => w.id === me.id)) p.workers.push(me);
      };
      const puzzle = this.puzzles.find((p) => p.id === puzzleId);
      if (puzzle) addWorker(puzzle);
      if (this.current?.id === puzzleId) addWorker(this.current);
    },

    /** Removes the current user from the puzzle's workers list. */
    async unclaim(collectionId: string, puzzleId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}/claim`,
        { method: 'DELETE' },
      );
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      const removeWorker = (p: Puzzle) => {
        p.workers = p.workers.filter((w) => w.id !== userId);
      };
      const puzzle = this.puzzles.find((p) => p.id === puzzleId);
      if (puzzle) removeWorker(puzzle);
      if (this.current?.id === puzzleId) removeWorker(this.current);
    },
  },
});
