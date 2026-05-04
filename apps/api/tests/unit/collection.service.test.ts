import { describe, expect, it, vi } from 'vitest';
import type { Collection, CollectionMember, Template } from '@prisma/client';
import { CollectionService } from '../../src/services/collection.service.js';
import type { CollectionRepository } from '../../src/repositories/collection.repository.js';
import type { TemplateRepository } from '../../src/repositories/template.repository.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'user-uuid-1';
const otherId = 'user-uuid-2';
const collectionId = 'col-uuid-1';
const templateId = 'tpl-uuid-1';
const snapshotId = 'tpl-snap-uuid-1';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: templateId,
    name: 'Generic',
    description: null,
    isSystem: true,
    isPublic: true,
    createdBy: null,
    useIndex: false,
    useGcCode: false,
    useDifficulty: false,
    useTerrain: false,
    useCoords: false,
    useHint: false,
    useSpoiler: false,
    customField1Label: null,
    customField2Label: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeSnapshot(): Template {
  return makeTemplate({
    id: snapshotId,
    isSystem: false,
    isPublic: false,
    createdBy: null,
  });
}

function makeCollection(
  overrides: Partial<Collection & { templateSnapshot: Template }> = {},
) {
  return {
    id: collectionId,
    slug: 'my-collection',
    name: 'My Collection',
    description: null,
    createdBy: userId,
    templateSnapshotId: snapshotId,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    templateSnapshot: makeSnapshot(),
    ...overrides,
  };
}

function makeMembership(
  role: 'owner' | 'member' = 'owner',
  uid = userId,
): CollectionMember {
  return {
    collectionId,
    userId: uid,
    role,
    joinedAt: new Date('2025-01-01T00:00:00Z'),
  };
}

// ── Mock factories ────────────────────────────────────────────────────────────

function makeCollectionRepo(
  overrides: Partial<CollectionRepository> = {},
): CollectionRepository {
  return {
    findAllByMember: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    findBySlugOrId: vi.fn().mockResolvedValue(null),
    slugExists: vi.fn().mockResolvedValue(false),
    findMembership: vi.fn().mockResolvedValue(null),
    createSnapshot: vi.fn().mockResolvedValue(makeSnapshot()),
    create: vi.fn().mockResolvedValue(makeCollection()),
    update: vi.fn().mockResolvedValue(makeCollection()),
    delete: vi.fn().mockResolvedValue(undefined),
    findMembers: vi.fn().mockResolvedValue([]),
    removeMember: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as CollectionRepository;
}

function makeTemplateRepo(
  overrides: Partial<TemplateRepository> = {},
): TemplateRepository {
  return {
    findAllVisible: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as TemplateRepository;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CollectionService.list', () => {
  it('delegates to repository with the given userId', async () => {
    const collections = [makeCollection()];
    const repo = makeCollectionRepo({
      findAllByMember: vi.fn().mockResolvedValue(collections),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    const result = await service.list(userId);

    expect(result).toEqual(collections);
    expect(repo.findAllByMember).toHaveBeenCalledWith(userId);
  });
});

describe('CollectionService.getById', () => {
  it('returns the collection when it exists', async () => {
    const collection = makeCollection();
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(collection),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    const result = await service.getById(collectionId);

    expect(result).toEqual(collection);
  });

  it('throws 404 when the collection does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(service.getById('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('CollectionService.create', () => {
  it('creates a snapshot of the template and a collection', async () => {
    const template = makeTemplate();
    const snapshot = makeSnapshot();
    const collectionRepo = makeCollectionRepo({
      createSnapshot: vi.fn().mockResolvedValue(snapshot),
      create: vi.fn().mockResolvedValue(makeCollection()),
    });
    const templateRepo = makeTemplateRepo({
      findById: vi.fn().mockResolvedValue(template),
    });
    const service = new CollectionService(collectionRepo, templateRepo);

    await service.create(userId, { name: 'My Collection', templateId });

    expect(collectionRepo.createSnapshot).toHaveBeenCalledWith(template);
    expect(collectionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Collection',
        createdBy: userId,
        templateSnapshotId: snapshot.id,
      }),
    );
  });

  it('throws 404 when the template does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(
      service.create(userId, { name: 'My Collection', templateId: 'unknown' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('CollectionService.update', () => {
  it('updates the collection when it exists', async () => {
    const collection = makeCollection();
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(collection),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await service.update(collectionId, { name: 'Updated' });

    expect(repo.update).toHaveBeenCalledWith(
      collectionId,
      expect.objectContaining({ name: 'Updated', slug: 'updated' }),
    );
  });

  it('throws 404 when the collection does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(
      service.update('unknown-id', { name: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('CollectionService.delete', () => {
  it('deletes the collection when it exists', async () => {
    const collection = makeCollection();
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(collection),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await service.delete(collectionId);

    expect(repo.delete).toHaveBeenCalledWith(collectionId);
  });

  it('throws 404 when the collection does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(service.delete('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('CollectionService.listMembers', () => {
  it('returns the member list for an existing collection', async () => {
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(makeCollection()),
      findMembers: vi.fn().mockResolvedValue([]),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await service.listMembers(collectionId);

    expect(repo.findMembers).toHaveBeenCalledWith(collectionId);
  });

  it('throws 404 when the collection does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(service.listMembers('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('CollectionService.removeMember', () => {
  it('removes a regular member successfully', async () => {
    const memberMembership = makeMembership('member', otherId);
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(makeCollection()),
      findMembership: vi.fn().mockResolvedValue(memberMembership),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await service.removeMember(collectionId, otherId);

    expect(repo.removeMember).toHaveBeenCalledWith(collectionId, otherId);
  });

  it('removes an owner when another owner exists', async () => {
    const ownerMembership = makeMembership('owner', otherId);
    const ownerRow = {
      ...ownerMembership,
      user: { id: otherId, username: 'other', email: 'other@example.com' },
    };
    const myOwnerRow = {
      ...makeMembership('owner', userId),
      user: { id: userId, username: 'me', email: 'me@example.com' },
    };
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(makeCollection()),
      findMembership: vi.fn().mockResolvedValue(ownerMembership),
      findMembers: vi.fn().mockResolvedValue([myOwnerRow, ownerRow]),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await service.removeMember(collectionId, otherId);

    expect(repo.removeMember).toHaveBeenCalledWith(collectionId, otherId);
  });

  it('throws 409 when removing the last owner', async () => {
    const ownerMembership = makeMembership('owner', userId);
    const ownerRow = {
      ...ownerMembership,
      user: { id: userId, username: 'me', email: 'me@example.com' },
    };
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(makeCollection()),
      findMembership: vi.fn().mockResolvedValue(ownerMembership),
      findMembers: vi.fn().mockResolvedValue([ownerRow]),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await expect(
      service.removeMember(collectionId, userId),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws 404 when the collection does not exist', async () => {
    const service = new CollectionService(
      makeCollectionRepo(),
      makeTemplateRepo(),
    );

    await expect(
      service.removeMember('unknown-id', otherId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 when the target user is not a member', async () => {
    const repo = makeCollectionRepo({
      findBySlugOrId: vi.fn().mockResolvedValue(makeCollection()),
      findMembership: vi.fn().mockResolvedValue(null),
    });
    const service = new CollectionService(repo, makeTemplateRepo());

    await expect(
      service.removeMember(collectionId, otherId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
