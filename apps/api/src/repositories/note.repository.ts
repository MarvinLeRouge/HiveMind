import type { Note, PrismaClient } from '@prisma/client';

/** Input shape for creating a note. */
export interface CreateNoteData {
  puzzleId: string;
  userId: string;
  content: string;
}

/**
 * Data access layer for notes.
 * Contains only Prisma queries — no business logic.
 */
export class NoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns all notes for a puzzle, ordered by creation date ascending.
   */
  async findAllByPuzzle(puzzleId: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: { puzzleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Finds a note by ID, scoped to a specific puzzle.
   * Returns null if the note does not exist or belongs to a different puzzle.
   */
  async findById(noteId: string, puzzleId: string): Promise<Note | null> {
    return this.prisma.note.findFirst({
      where: { id: noteId, puzzleId },
    });
  }

  /**
   * Creates a new note.
   */
  async create(data: CreateNoteData): Promise<Note> {
    return this.prisma.note.create({ data });
  }

  /**
   * Updates the content of a note.
   */
  async update(id: string, content: string): Promise<Note> {
    return this.prisma.note.update({ where: { id }, data: { content } });
  }

  /**
   * Deletes a note.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.note.delete({ where: { id } });
  }
}
