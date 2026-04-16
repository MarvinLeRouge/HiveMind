import type { Template } from '@prisma/client';
import type {
  CreateTemplateData,
  TemplateRepository,
  UpdateTemplateData,
} from '../repositories/template.repository.js';

/**
 * Business logic for templates.
 * Permission rules:
 * - System templates: create/update restricted to admin_platform (isAdmin)
 * - User templates: update/delete restricted to creator
 * - Listing: system + public + own templates
 */
export class TemplateService {
  constructor(private readonly repo: TemplateRepository) {}

  /**
   * Returns all templates visible to the requesting user.
   */
  async list(userId: string): Promise<Template[]> {
    return this.repo.findAllVisible(userId);
  }

  /**
   * Returns a single template by ID.
   * Throws 404 if not found.
   */
  async getById(id: string): Promise<Template> {
    const template = await this.repo.findById(id);
    if (!template) throw this.notFound();
    return template;
  }

  /**
   * Creates a user-owned template. Not a system template.
   */
  async createUserTemplate(
    userId: string,
    data: Omit<CreateTemplateData, 'createdBy' | 'isSystem'>,
  ): Promise<Template> {
    return this.repo.create({ ...data, createdBy: userId, isSystem: false });
  }

  /**
   * Creates a system template. Restricted to platform admins.
   * Throws 403 if caller is not admin.
   */
  async createSystemTemplate(
    isAdmin: boolean,
    data: Omit<CreateTemplateData, 'createdBy' | 'isSystem'>,
  ): Promise<Template> {
    if (!isAdmin) throw this.forbidden();
    return this.repo.create({ ...data, isSystem: true, isPublic: true });
  }

  /**
   * Updates a user-owned template. Restricted to the creator.
   * Throws 403 if caller is not the creator.
   * Throws 404 if template does not exist.
   */
  async updateUserTemplate(
    userId: string,
    id: string,
    data: UpdateTemplateData,
  ): Promise<Template> {
    const template = await this.repo.findById(id);
    if (!template) throw this.notFound();
    if (template.createdBy !== userId) throw this.forbidden();
    return this.repo.update(id, data);
  }

  /**
   * Updates a system template. Restricted to platform admins.
   * Throws 403 if caller is not admin.
   * Throws 404 if template does not exist.
   */
  async updateSystemTemplate(
    isAdmin: boolean,
    id: string,
    data: UpdateTemplateData,
  ): Promise<Template> {
    if (!isAdmin) throw this.forbidden();
    const template = await this.repo.findById(id);
    if (!template) throw this.notFound();
    return this.repo.update(id, data);
  }

  /**
   * Deletes a user-owned template. Restricted to the creator.
   * Throws 403 if caller is not the creator.
   * Throws 404 if template does not exist.
   */
  async deleteUserTemplate(userId: string, id: string): Promise<void> {
    const template = await this.repo.findById(id);
    if (!template) throw this.notFound();
    if (template.createdBy !== userId) throw this.forbidden();
    await this.repo.delete(id);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Template not found'), { statusCode: 404 });
  }

  private forbidden(): Error {
    return Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
}
