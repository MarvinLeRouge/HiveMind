import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
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

    /** Claims the puzzle for the current user. */
    async claim(collectionId: string, puzzleId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}/claim`,
        { method: 'POST' },
      );
      const puzzle = this.puzzles.find((p) => p.id === puzzleId);
      if (puzzle) puzzle.workingOnId = '__claimed__';
    },

    /** Releases the claim on a puzzle. */
    async unclaim(collectionId: string, puzzleId: string): Promise<void> {
      await apiFetch(
        `${BASE_URL}/collections/${collectionId}/puzzles/${puzzleId}/claim`,
        { method: 'DELETE' },
      );
      const puzzle = this.puzzles.find((p) => p.id === puzzleId);
      if (puzzle) puzzle.workingOnId = null;
    },
  },
});
