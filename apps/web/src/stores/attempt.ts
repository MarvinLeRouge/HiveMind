import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import type { Attempt } from '@/types/attempt';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for attempts attached to a puzzle. Attempts are immutable after creation. */
export const useAttemptStore = defineStore('attempt', {
  state: () => ({
    attempts: [] as Attempt[],
  }),

  actions: {
    /** Fetches all attempts for a puzzle. */
    async fetchAll(puzzleId: string): Promise<void> {
      this.attempts = await apiFetch<Attempt[]>(
        `${BASE_URL}/puzzles/${puzzleId}/attempts`,
      );
    },

    /** Records a new attempt. */
    async add(
      puzzleId: string,
      data: { valueTested: string; checkerResult: boolean; comment?: string },
    ): Promise<void> {
      const attempt = await apiFetch<Attempt>(
        `${BASE_URL}/puzzles/${puzzleId}/attempts`,
        { method: 'POST', body: data },
      );
      this.attempts.push(attempt);
    },
  },
});
