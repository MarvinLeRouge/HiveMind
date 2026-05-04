import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Hashes a plain-text password with bcrypt (matches the auth service). */
async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Seeds the database with:
 * - 1 admin user (from env)
 * - 2 system templates (generic, geocaching)
 * - 1 sample collection with 3 puzzles (dev only)
 */
async function main(): Promise<void> {
  const adminUsername = process.env['SEED_ADMIN_USERNAME'] ?? 'admin';
  const adminEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@HiveMind.local';
  const adminPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'change_me_admin';

  // ── Admin user ──────────────────────────────────────────────────────────────
  const passwordHash = await hashPassword(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, username: adminUsername },
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      isAdmin: true,
    },
  });
  console.log(`✔ Admin user: ${admin.email}`);

  // ── System template: generic ────────────────────────────────────────────────
  const genericTemplate = await prisma.template.upsert({
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
  console.log(`✔ System template: ${genericTemplate.name}`);

  // ── System template: geocaching ─────────────────────────────────────────────
  const geocachingTemplate = await prisma.template.upsert({
    where: { id: 'system-template-geocaching' },
    update: {},
    create: {
      id: 'system-template-geocaching',
      name: 'Geocaching',
      description:
        'Template for geocaching mystery series. Includes GC code, difficulty/terrain ratings, coordinates, hints, and spoilers.',
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
  console.log(`✔ System template: ${geocachingTemplate.name}`);

  // ── Sample collection (dev only) ────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    const sampleCollection = await prisma.collection.upsert({
      where: { id: 'sample-collection-dev' },
      update: {},
      create: {
        id: 'sample-collection-dev',
        name: 'Sample Geocaching Series',
        description: 'A sample collection seeded for development and testing.',
        createdBy: admin.id,
        templateSnapshotId: geocachingTemplate.id,
        members: {
          create: {
            userId: admin.id,
            role: 'owner',
          },
        },
      },
    });
    console.log(`✔ Sample collection: ${sampleCollection.name}`);

    const puzzles = [
      {
        id: 'sample-puzzle-1',
        title: 'The Old Mill',
        sortOrder: 1,
        gcCode: 'GC12345',
        difficulty: 2.0,
        terrain: 1.5,
        coords: 'N 48° 51.500 E 002° 21.000',
        hint: 'Look under the big stone near the entrance.',
      },
      {
        id: 'sample-puzzle-2',
        title: 'Forest Cipher',
        sortOrder: 2,
        gcCode: 'GC23456',
        difficulty: 3.5,
        terrain: 2.5,
        coords: 'N 48° 52.100 E 002° 22.300',
        hint: 'Caesar never forgets his salad.',
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
        hint: 'UV light reveals the truth.',
      },
    ];

    for (const puzzle of puzzles) {
      await prisma.puzzle.upsert({
        where: { id: puzzle.id },
        update: {},
        create: {
          ...puzzle,
          collectionId: sampleCollection.id,
        },
      });
    }
    console.log(`✔ Sample puzzles: ${puzzles.length} created`);
  }
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
