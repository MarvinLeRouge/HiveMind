import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Seed integrity — Admin user', () => {
  it('creates exactly one admin user', async () => {
    const admins = await prisma.user.findMany({ where: { isAdmin: true } });
    expect(admins.length).toBeGreaterThanOrEqual(1);
  });

  it('admin user has required fields', async () => {
    const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
    expect(admin).not.toBeNull();
    expect(admin!.username).toBeTruthy();
    expect(admin!.email).toContain('@');
    expect(admin!.passwordHash).toBeTruthy();
  });
});

describe('Seed integrity — System templates', () => {
  it('creates the Generic system template', async () => {
    const template = await prisma.template.findUnique({
      where: { id: 'system-template-generic' },
    });
    expect(template).not.toBeNull();
    expect(template!.name).toBe('Generic');
    expect(template!.isSystem).toBe(true);
    expect(template!.isPublic).toBe(true);
    expect(template!.createdBy).toBeNull();
  });

  it('creates the Geocaching system template with correct flags', async () => {
    const template = await prisma.template.findUnique({
      where: { id: 'system-template-geocaching' },
    });
    expect(template).not.toBeNull();
    expect(template!.name).toBe('Geocaching');
    expect(template!.isSystem).toBe(true);
    expect(template!.isPublic).toBe(true);
    expect(template!.useGcCode).toBe(true);
    expect(template!.useDifficulty).toBe(true);
    expect(template!.useTerrain).toBe(true);
    expect(template!.useCoords).toBe(true);
    expect(template!.useHint).toBe(true);
    expect(template!.useSpoiler).toBe(true);
    // These should remain disabled in the geocaching template
    expect(template!.useIndex).toBe(false);
  });
});

describe('Seed integrity — Sample collection', () => {
  it('creates the sample collection with geocaching template snapshot', async () => {
    const collection = await prisma.collection.findUnique({
      where: { id: 'sample-collection-dev' },
      include: { templateSnapshot: true },
    });
    expect(collection).not.toBeNull();
    expect(collection!.name).toBe('Sample Geocaching Series');
    expect(collection!.templateSnapshot.id).toBe('system-template-geocaching');
  });

  it('admin is owner of the sample collection', async () => {
    const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
    const membership = await prisma.collectionMember.findUnique({
      where: {
        collectionId_userId: {
          collectionId: 'sample-collection-dev',
          userId: admin!.id,
        },
      },
    });
    expect(membership).not.toBeNull();
    expect(membership!.role).toBe('owner');
  });

  it('creates 3 puzzles in the sample collection', async () => {
    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId: 'sample-collection-dev' },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles).toHaveLength(3);
  });

  it('puzzles have correct sort order and required fields', async () => {
    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId: 'sample-collection-dev' },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles[0]!.sortOrder).toBe(1);
    expect(puzzles[1]!.sortOrder).toBe(2);
    expect(puzzles[2]!.sortOrder).toBe(3);

    for (const puzzle of puzzles) {
      expect(puzzle.title).toBeTruthy();
      expect(puzzle.collectionId).toBe('sample-collection-dev');
    }
  });

  it('puzzle status defaults to open unless specified', async () => {
    const puzzle1 = await prisma.puzzle.findUnique({
      where: { id: 'sample-puzzle-1' },
    });
    expect(puzzle1!.status).toBe('open');
  });

  it('puzzle with explicit status has correct value', async () => {
    const puzzle3 = await prisma.puzzle.findUnique({
      where: { id: 'sample-puzzle-3' },
    });
    expect(puzzle3!.status).toBe('in_progress');
  });

  it('geocaching puzzles have GC code and difficulty', async () => {
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: 'sample-puzzle-1' },
    });
    expect(puzzle!.gcCode).toBe('GC12345');
    expect(puzzle!.difficulty).toBe(2.0);
    expect(puzzle!.terrain).toBe(1.5);
  });
});
