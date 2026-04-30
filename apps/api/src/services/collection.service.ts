import type {
  CollectionRepository,
  CollectionRow,
  MemberRow,
  UpdateCollectionData,
} from '../repositories/collection.repository.js';
import type { TemplateRepository } from '../repositories/template.repository.js';

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
   * Returns a collection by ID.
   * Throws 404 if the collection does not exist.
   */
  async getById(id: string): Promise<CollectionRow> {
    const collection = await this.repo.findById(id);
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

    return this.repo.create({
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
  async update(id: string, data: UpdateCollectionData): Promise<CollectionRow> {
    const collection = await this.repo.findById(id);
    if (!collection) throw this.notFound();
    return this.repo.update(id, data);
  }

  /**
   * Deletes a collection and all its related data (cascade).
   * Throws 404 if the collection does not exist.
   */
  async delete(id: string): Promise<void> {
    const collection = await this.repo.findById(id);
    if (!collection) throw this.notFound();
    await this.repo.delete(id);
  }

  /**
   * Returns all members of a collection.
   * Throws 404 if the collection does not exist.
   */
  async listMembers(collectionId: string): Promise<MemberRow[]> {
    const collection = await this.repo.findById(collectionId);
    if (!collection) throw this.notFound();
    return this.repo.findMembers(collectionId);
  }

  /**
   * Removes a member from a collection.
   * Throws 404 if the collection or the target member does not exist.
   * Throws 409 if removing would leave the collection without an owner.
   */
  async removeMember(
    collectionId: string,
    targetUserId: string,
  ): Promise<void> {
    const collection = await this.repo.findById(collectionId);
    if (!collection) throw this.notFound();

    const targetMembership = await this.repo.findMembership(
      collectionId,
      targetUserId,
    );
    if (!targetMembership)
      throw Object.assign(new Error('Member not found'), { statusCode: 404 });

    if (targetMembership.role === 'owner') {
      const members = await this.repo.findMembers(collectionId);
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1)
        throw Object.assign(new Error('Cannot remove the last owner'), {
          statusCode: 409,
        });
    }

    await this.repo.removeMember(collectionId, targetUserId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Collection not found'), {
      statusCode: 404,
    });
  }
}
