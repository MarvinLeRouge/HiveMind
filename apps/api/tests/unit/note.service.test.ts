import { describe, expect, it, vi } from 'vitest';
import type { Note } from '@prisma/client';
import { NoteService } from '../../src/services/note.service.js';
import type { NoteRepository } from '../../src/repositories/note.repository.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const puzzleId = 'puz-uuid-1';
const noteId = 'note-uuid-1';
const authorId = 'user-uuid-1';
const otherId = 'user-uuid-2';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: noteId,
    puzzleId,
    userId: authorId,
    content: 'Some note content',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<NoteRepository> = {}): NoteRepository {
  return {
    findAllByPuzzle: vi.fn().mockResolvedValue([makeNote()]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeNote()),
    update: vi.fn().mockResolvedValue(makeNote()),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as NoteRepository;
}

// ── NoteService.list ──────────────────────────────────────────────────────────

describe('NoteService.list', () => {
  it('returns all notes for a puzzle', async () => {
    const service = new NoteService(makeRepo());
    const result = await service.list(puzzleId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(noteId);
  });
});

// ── NoteService.add ───────────────────────────────────────────────────────────

describe('NoteService.add', () => {
  it('creates a note with the correct data', async () => {
    const repo = makeRepo();
    const service = new NoteService(repo);

    await service.add(puzzleId, authorId, 'My note');

    expect(repo.create).toHaveBeenCalledWith({
      puzzleId,
      userId: authorId,
      content: 'My note',
    });
  });
});

// ── NoteService.update ────────────────────────────────────────────────────────

describe('NoteService.update', () => {
  it('updates the note when the user is the author', async () => {
    const note = makeNote({ userId: authorId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(note) });
    const service = new NoteService(repo);

    await service.update(puzzleId, noteId, authorId, 'Updated content');

    expect(repo.update).toHaveBeenCalledWith(noteId, 'Updated content');
  });

  it('throws 404 when the note does not exist', async () => {
    const service = new NoteService(makeRepo());

    await expect(
      service.update(puzzleId, 'unknown', authorId, 'x'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the user is not the author', async () => {
    const note = makeNote({ userId: authorId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(note) });
    const service = new NoteService(repo);

    await expect(
      service.update(puzzleId, noteId, otherId, 'x'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ── NoteService.delete ────────────────────────────────────────────────────────

describe('NoteService.delete', () => {
  it('deletes the note when the user is the author', async () => {
    const note = makeNote({ userId: authorId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(note) });
    const service = new NoteService(repo);

    await service.delete(puzzleId, noteId, authorId);

    expect(repo.delete).toHaveBeenCalledWith(noteId);
  });

  it('throws 404 when the note does not exist', async () => {
    const service = new NoteService(makeRepo());

    await expect(
      service.delete(puzzleId, 'unknown', authorId),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the user is not the author', async () => {
    const note = makeNote({ userId: authorId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(note) });
    const service = new NoteService(repo);

    await expect(
      service.delete(puzzleId, noteId, otherId),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
