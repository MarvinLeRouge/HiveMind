import type {
  CollectionRepository,
  CollectionRow,
  MemberRow,
  UpdateCollectionData,
} from '../repositories/collection.repository.js';
import type { TemplateRepository } from '../repositories/template.repository.js';

/** Converts a name to a URL-safe slug (e.g. "My Collection" → "my-collection"). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Business logic for collections.
 *
 * Access control (membership / ownership) is enforced by the requireMember and
 * requireOwner HTTP middlewares. This service focuses on domain rules:
 * - Template snapshot on create
 * - Creator auto-joined as owner
 * - Last owner cannot be removed
 * - 404 when a resource does not exist
 */
export class CollectionService {
  constructor(
    private readonly repo: CollectionRepository,
    private readonly templateRepo: TemplateRepository,
  ) {}

  /**
   * Returns all collections where the requesting user is a member.
   */
  async list(userId: string): Promise<CollectionRow[]> {
    return this.repo.findAllByMember(userId);
  }

  /**
   * Returns a collection by slug or UUID.
   * Throws 404 if the collection does not exist.
   */
  async getById(slugOrId: string): Promise<CollectionRow> {
    const collection = await this.repo.findBySlugOrId(slugOrId);
    if (!collection) throw this.notFound();
    return collection;
  }

  /**
   * Creates a collection with a snapshot of the selected template.
   * The creator is automatically joined as owner.
   * Throws 404 if the referenced template does not exist.
   */
  async create(
    userId: string,
    data: { name: string; description?: string; templateId: string },
  ): Promise<CollectionRow> {
    const template = await this.templateRepo.findById(data.templateId);
    if (!template)
      throw Object.assign(new Error('Template not found'), { statusCode: 404 });

    const snapshot = await this.repo.createSnapshot(template);
    const slug = await this.uniqueSlug(slugify(data.name));

    return this.repo.create({
      slug,
      name: data.name,
      description: data.description,
      createdBy: userId,
      templateSnapshotId: snapshot.id,
    });
  }

  /**
   * Updates a collection's name or description.
   * Throws 404 if the collection does not exist.
   */
  async update(
    slugOrId: string,
    data: UpdateCollectionData,
  ): Promise<CollectionRow> {
    const collection = await this.repo.findBySlugOrId(slugOrId);
    if (!collection) throw this.notFound();
    const slug =
      data.name && data.name !== collection.name
        ? await this.uniqueSlug(slugify(data.name), collection.id)
        : undefined;
    return this.repo.update(collection.id, {
      ...data,
      ...(slug ? { slug } : {}),
    });
  }

  /**
   * Deletes a collection and all its related data (cascade).
   * Throws 404 if the collection does not exist.
   */
  async delete(slugOrId: string): Promise<void> {
    const collection = await this.repo.findBySlugOrId(slugOrId);
    if (!collection) throw this.notFound();
    await this.repo.delete(collection.id);
  }

  /**
   * Returns all members of a collection.
   * Throws 404 if the collection does not exist.
   */
  async listMembers(slugOrId: string): Promise<MemberRow[]> {
    const collection = await this.repo.findBySlugOrId(slugOrId);
    if (!collection) throw this.notFound();
    return this.repo.findMembers(collection.id);
  }

  /**
   * Removes a member from a collection.
   * Throws 404 if the collection or the target member does not exist.
   * Throws 409 if removing would leave the collection without an owner.
   */
  async removeMember(slugOrId: string, targetUserId: string): Promise<void> {
    const collection = await this.repo.findBySlugOrId(slugOrId);
    if (!collection) throw this.notFound();

    const targetMembership = await this.repo.findMembership(
      collection.id,
      targetUserId,
    );
    if (!targetMembership)
      throw Object.assign(new Error('Member not found'), { statusCode: 404 });

    if (targetMembership.role === 'owner') {
      const members = await this.repo.findMembers(collection.id);
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1)
        throw Object.assign(new Error('Cannot remove the last owner'), {
          statusCode: 409,
        });
    }

    await this.repo.removeMember(collection.id, targetUserId);
  }

  /**
   * Returns a collection by its URL slug.
   * Throws 404 if the collection does not exist.
   */
  async getBySlug(slug: string): Promise<CollectionRow> {
    const collection = await this.repo.findBySlug(slug);
    if (!collection) throw this.notFound();
    return collection;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Collection not found'), {
      statusCode: 404,
    });
  }

  /**
   * Generates a unique slug by appending -2, -3, … until no conflict is found.
   */
  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let counter = 2;
    while (await this.repo.slugExists(slug, excludeId)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  }
}
