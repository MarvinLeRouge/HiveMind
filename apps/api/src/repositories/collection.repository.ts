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

export interface CreateCollectionData {
  name: string;
  description?: string;
  createdBy: string;
  templateSnapshotId: string;
}

export interface UpdateCollectionData {
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
