import type {
  PrismaClient,
  Collection,
  CollectionMember,
  Template,
} from '@prisma/client';

/** A collection row with its template snapshot included. */
export type CollectionRow = Collection & { templateSnapshot: Template };

/** A collection member row with basic user fields included. */
export type MemberRow = CollectionMember & {
  user: { id: string; username: string; email: string };
};

/** Input shape for creating a collection. */
export interface CreateCollectionData {
  slug: string;
  name: string;
  description?: string;
  createdBy: string;
  templateSnapshotId: string;
}

/** Input shape for updating a collection's mutable fields. */
export interface UpdateCollectionData {
  slug?: string;
  name?: string;
  description?: string | null;
}

/**
 * Data access layer for collections.
 * Contains only Prisma queries — no business logic.
 */
export class CollectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns all collections where the given user is a member (any role).
   */
  async findAllByMember(userId: string): Promise<CollectionRow[]> {
    return this.prisma.collection.findMany({
      where: { members: { some: { userId } } },
      include: { templateSnapshot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds a collection by ID, including its template snapshot.
   */
  async findById(id: string): Promise<CollectionRow | null> {
    return this.prisma.collection.findUnique({
      where: { id },
      include: { templateSnapshot: true },
    });
  }

  /**
   * Finds a collection by its URL slug, including its template snapshot.
   */
  async findBySlug(slug: string): Promise<CollectionRow | null> {
    return this.prisma.collection.findUnique({
      where: { slug },
      include: { templateSnapshot: true },
    });
  }

  /**
   * Finds a collection by slug or UUID — used by route handlers that accept
   * either identifier (slug in URLs, UUID in internal references).
   */
  async findBySlugOrId(slugOrId: string): Promise<CollectionRow | null> {
    return this.prisma.collection.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: { templateSnapshot: true },
    });
  }

  /**
   * Returns true if a slug is already taken by another collection.
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return false;
    return existing.id !== excludeId;
  }

  /**
   * Finds a single membership record for a (collection, user) pair.
   */
  async findMembership(
    collectionId: string,
    userId: string,
  ): Promise<CollectionMember | null> {
    return this.prisma.collectionMember.findUnique({
      where: { collectionId_userId: { collectionId, userId } },
    });
  }

  /**
   * Creates a template snapshot — a private copy of the given template.
   * The snapshot has isSystem=false, isPublic=false, createdBy=null so it
   * never appears in any user's template listing.
   */
  async createSnapshot(original: Template): Promise<Template> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, ...fields } = original;
    return this.prisma.template.create({
      data: { ...fields, isSystem: false, isPublic: false, createdBy: null },
    });
  }

  /**
   * Creates a new collection and auto-joins the creator as owner in the same
   * transaction.
   */
  async create(data: CreateCollectionData): Promise<CollectionRow> {
    return this.prisma.collection.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        templateSnapshotId: data.templateSnapshotId,
        members: {
          create: { userId: data.createdBy, role: 'owner' },
        },
      },
      include: { templateSnapshot: true },
    });
  }

  /**
   * Updates a collection's mutable fields (name, description).
   */
  async update(id: string, data: UpdateCollectionData): Promise<CollectionRow> {
    return this.prisma.collection.update({
      where: { id },
      data,
      include: { templateSnapshot: true },
    });
  }

  /**
   * Deletes a collection. DB cascades handle members, invitations, and puzzles.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id } });
  }

  /**
   * Returns all members of a collection, ordered by join date.
   */
  async findMembers(collectionId: string): Promise<MemberRow[]> {
    return this.prisma.collectionMember.findMany({
      where: { collectionId },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Removes a member from a collection.
   */
  async removeMember(collectionId: string, userId: string): Promise<void> {
    await this.prisma.collectionMember.delete({
      where: { collectionId_userId: { collectionId, userId } },
    });
  }
}
