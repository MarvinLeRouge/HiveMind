import type { PrismaClient, Template } from '@prisma/client';

export interface CreateTemplateData {
  name: string;
  description?: string;
  isSystem?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  useIndex?: boolean;
  useGcCode?: boolean;
  useDifficulty?: boolean;
  useTerrain?: boolean;
  useCoords?: boolean;
  useHint?: boolean;
  useSpoiler?: boolean;
  customField1Label?: string;
  customField2Label?: string;
}

export type UpdateTemplateData = Partial<Omit<CreateTemplateData, 'createdBy'>>;

/**
 * Data access layer for templates.
 * Contains only Prisma queries — no business logic.
 */
export class TemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns all templates visible to the given user:
   * system templates, public templates, and templates created by the user.
   */
  async findAllVisible(userId: string): Promise<Template[]> {
    return this.prisma.template.findMany({
      where: {
        OR: [{ isSystem: true }, { isPublic: true }, { createdBy: userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Finds a template by its unique ID.
   */
  async findById(id: string): Promise<Template | null> {
    return this.prisma.template.findUnique({ where: { id } });
  }

  /**
   * Creates a new template.
   */
  async create(data: CreateTemplateData): Promise<Template> {
    return this.prisma.template.create({ data });
  }

  /**
   * Updates an existing template by ID.
   */
  async update(id: string, data: UpdateTemplateData): Promise<Template> {
    return this.prisma.template.update({ where: { id }, data });
  }

  /**
   * Deletes a template by ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.template.delete({ where: { id } });
  }
}
