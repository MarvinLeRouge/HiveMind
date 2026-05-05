import { defineStore } from 'pinia';
import { apiFetch } from '@/lib/api-fetch';
import type { Note } from '@/types/note';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Store for notes attached to a puzzle. */
export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [] as Note[],
  }),

  actions: {
    /** Fetches all notes for a puzzle. */
    async fetchAll(puzzleId: string): Promise<void> {
      this.notes = await apiFetch<Note[]>(
        `${BASE_URL}/puzzles/${puzzleId}/notes`,
      );
    },

    /** Adds a note to a puzzle. */
    async add(puzzleId: string, content: string): Promise<void> {
      const note = await apiFetch<Note>(
        `${BASE_URL}/puzzles/${puzzleId}/notes`,
        {
          method: 'POST',
          body: { content },
        },
      );
      this.notes.push(note);
    },

    /** Updates the content of a note (author only). */
    async update(
      puzzleId: string,
      noteId: string,
      content: string,
    ): Promise<void> {
      const updated = await apiFetch<Note>(
        `${BASE_URL}/puzzles/${puzzleId}/notes/${noteId}`,
        { method: 'PATCH', body: { content } },
      );
      const idx = this.notes.findIndex((n) => n.id === noteId);
      if (idx !== -1) this.notes[idx] = updated;
    },

    /** Deletes a note (author only). */
    async delete(puzzleId: string, noteId: string): Promise<void> {
      await apiFetch(`${BASE_URL}/puzzles/${puzzleId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      this.notes = this.notes.filter((n) => n.id !== noteId);
    },
  },
});
