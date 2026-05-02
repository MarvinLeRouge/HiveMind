import type { Note } from '@prisma/client';
import type { NoteRepository } from '../repositories/note.repository.js';

/**
 * Business logic for notes.
 *
 * Collection membership is enforced by the requirePuzzleMember preHandler.
 * This service handles author-only edit/delete and 404 guards.
 */
export class NoteService {
  constructor(private readonly repo: NoteRepository) {}

  /**
   * Returns all notes for a puzzle.
   */
  async list(puzzleId: string): Promise<Note[]> {
    return this.repo.findAllByPuzzle(puzzleId);
  }

  /**
   * Adds a note to a puzzle.
   */
  async add(puzzleId: string, userId: string, content: string): Promise<Note> {
    return this.repo.create({ puzzleId, userId, content });
  }

  /**
   * Updates the content of a note.
   * Throws 404 if the note does not exist within this puzzle.
   * Throws 403 if the requesting user is not the note's author.
   */
  async update(
    puzzleId: string,
    noteId: string,
    userId: string,
    content: string,
  ): Promise<Note> {
    const note = await this.repo.findById(noteId, puzzleId);
    if (!note) throw this.notFound();
    if (note.userId !== userId) throw this.forbidden();
    return this.repo.update(noteId, content);
  }

  /**
   * Deletes a note.
   * Throws 404 if the note does not exist within this puzzle.
   * Throws 403 if the requesting user is not the note's author.
   */
  async delete(
    puzzleId: string,
    noteId: string,
    userId: string,
  ): Promise<void> {
    const note = await this.repo.findById(noteId, puzzleId);
    if (!note) throw this.notFound();
    if (note.userId !== userId) throw this.forbidden();
    await this.repo.delete(noteId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Note not found'), { statusCode: 404 });
  }

  private forbidden(): Error {
    return Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
}
