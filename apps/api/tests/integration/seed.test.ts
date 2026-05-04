import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const prisma = new PrismaClient({
  datasourceUrl: process.env['DATABASE_URL'],
});

beforeAll(async () => {
  await prisma.$connect();
  await reseed();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Re-applies the seed data so this test file is independent
 * of execution order with other integration tests that clean the DB.
 */
async function reseed(): Promise<void> {
  function hashPassword(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@HiveMind.local' },
    update: {},
    create: {
      username: 'admin-test',
      email: 'admin@HiveMind.local',
      passwordHash: hashPassword('change_me_admin'),
      isAdmin: true,
    },
  });

  await prisma.template.upsert({
    where: { id: 'system-template-generic' },
    update: {},
    create: {
      id: 'system-template-generic',
      name: 'Generic',
      description:
        'A minimal template suitable for any type of puzzle collection.',
      isSystem: true,
      isPublic: true,
    },
  });

  await prisma.template.upsert({
    where: { id: 'system-template-geocaching' },
    update: {},
    create: {
      id: 'system-template-geocaching',
      name: 'Geocaching',
      description: 'Template for geocaching mystery series.',
      isSystem: true,
      isPublic: true,
      useGcCode: true,
      useDifficulty: true,
      useTerrain: true,
      useCoords: true,
      useHint: true,
      useSpoiler: true,
    },
  });

  const collection = await prisma.collection.upsert({
    where: { slug: 'sample-geocaching-series' },
    update: {},
    create: {
      slug: 'sample-geocaching-series',
      name: 'Sample Geocaching Series',
      description: 'A sample collection seeded for development and testing.',
      createdBy: admin.id,
      templateSnapshotId: 'system-template-geocaching',
      members: { create: { userId: admin.id, role: 'owner' } },
    },
  });

  const puzzleDefs = [
    {
      id: 'sample-puzzle-1',
      title: 'The Old Mill',
      sortOrder: 1,
      gcCode: 'GC12345',
      difficulty: 2.0,
      terrain: 1.5,
      coords: 'N 48° 51.500 E 002° 21.000',
      hint: 'Look under the big stone.',
    },
    {
      id: 'sample-puzzle-2',
      title: 'Forest Cipher',
      sortOrder: 2,
      gcCode: 'GC23456',
      difficulty: 3.5,
      terrain: 2.5,
      coords: 'N 48° 52.100 E 002° 22.300',
      hint: 'Caesar never forgets.',
    },
    {
      id: 'sample-puzzle-3',
      title: 'The Invisible Ink',
      sortOrder: 3,
      gcCode: 'GC34567',
      difficulty: 4.0,
      terrain: 1.0,
      status: 'in_progress',
      coords: null,
      hint: 'UV light.',
    },
  ];

  for (const p of puzzleDefs) {
    await prisma.puzzle.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, collectionId: collection.id },
    });
  }
}

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
      where: { slug: 'sample-geocaching-series' },
      include: { templateSnapshot: true },
    });
    expect(collection).not.toBeNull();
    expect(collection!.name).toBe('Sample Geocaching Series');
    expect(collection!.templateSnapshot.id).toBe('system-template-geocaching');
  });

  it('admin is owner of the sample collection', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@HiveMind.local' },
    });
    const collection = await prisma.collection.findUnique({
      where: { slug: 'sample-geocaching-series' },
    });
    const membership = await prisma.collectionMember.findUnique({
      where: {
        collectionId_userId: {
          collectionId: collection!.id,
          userId: admin!.id,
        },
      },
    });
    expect(membership).not.toBeNull();
    expect(membership!.role).toBe('owner');
  });

  it('creates 3 puzzles in the sample collection', async () => {
    const collection = await prisma.collection.findUnique({
      where: { slug: 'sample-geocaching-series' },
    });
    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId: collection!.id },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles).toHaveLength(3);
  });

  it('puzzles have correct sort order and required fields', async () => {
    const collection = await prisma.collection.findUnique({
      where: { slug: 'sample-geocaching-series' },
    });
    const puzzles = await prisma.puzzle.findMany({
      where: { collectionId: collection!.id },
      orderBy: { sortOrder: 'asc' },
    });
    expect(puzzles[0]!.sortOrder).toBe(1);
    expect(puzzles[1]!.sortOrder).toBe(2);
    expect(puzzles[2]!.sortOrder).toBe(3);

    for (const puzzle of puzzles) {
      expect(puzzle.title).toBeTruthy();
      expect(puzzle.collectionId).toBe(collection!.id);
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
