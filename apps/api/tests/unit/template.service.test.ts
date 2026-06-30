import { describe, expect, it, vi } from 'vitest';
import type { Template } from '@prisma/client';
import { TemplateService } from '../../src/services/template.service.js';
import type { TemplateRepository } from '../../src/repositories/template.repository.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'user-uuid-1';
const adminId = 'admin-uuid-1';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-uuid-1',
    name: 'My Template',
    description: null,
    isSystem: false,
    isPublic: false,
    createdBy: userId,
    indexMode: 'disabled',
    gcCodeMode: 'disabled',
    difficultyMode: 'disabled',
    terrainMode: 'disabled',
    coordsMode: 'disabled',
    hintMode: 'disabled',
    spoilerMode: 'disabled',
    customField1Label: null,
    customField1Mode: 'disabled',
    customField2Label: null,
    customField2Mode: 'disabled',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<TemplateRepository> = {},
): TemplateRepository {
  return {
    findAllVisible: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeTemplate()),
    update: vi.fn().mockResolvedValue(makeTemplate()),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TemplateRepository;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TemplateService.list', () => {
  it('delegates to repository and returns results', async () => {
    const templates = [makeTemplate()];
    const repo = makeRepo({
      findAllVisible: vi.fn().mockResolvedValue(templates),
    });
    const service = new TemplateService(repo);

    const result = await service.list(userId);

    expect(result).toEqual(templates);
    expect(repo.findAllVisible).toHaveBeenCalledWith(userId);
  });
});

describe('TemplateService.getById', () => {
  it('returns the template when found', async () => {
    const template = makeTemplate();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    const result = await service.getById(template.id);

    expect(result).toEqual(template);
  });

  it('throws 404 when template does not exist', async () => {
    const service = new TemplateService(makeRepo());

    await expect(service.getById('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('TemplateService.createUserTemplate', () => {
  it('creates a template with createdBy and isSystem=false', async () => {
    const repo = makeRepo();
    const service = new TemplateService(repo);

    await service.createUserTemplate(userId, { name: 'My Template' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: userId, isSystem: false }),
    );
  });
});

describe('TemplateService.createSystemTemplate', () => {
  it('creates a system template when caller is admin', async () => {
    const repo = makeRepo();
    const service = new TemplateService(repo);

    await service.createSystemTemplate(true, { name: 'System Template' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isSystem: true }),
    );
  });

  it('throws 403 when caller is not admin', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.createSystemTemplate(false, { name: 'System Template' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('TemplateService.updateUserTemplate', () => {
  it('updates the template when caller is the creator', async () => {
    const template = makeTemplate({ createdBy: userId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await service.updateUserTemplate(userId, template.id, { name: 'Updated' });

    expect(repo.update).toHaveBeenCalledWith(template.id, { name: 'Updated' });
  });

  it('throws 403 when caller is not the creator', async () => {
    const template = makeTemplate({ createdBy: 'other-user' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await expect(
      service.updateUserTemplate(userId, template.id, { name: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when template does not exist', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.updateUserTemplate(userId, 'unknown-id', { name: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TemplateService.updateSystemTemplate', () => {
  it('updates the template when caller is admin', async () => {
    const template = makeTemplate({ isSystem: true });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await service.updateSystemTemplate(true, template.id, { name: 'Updated' });

    expect(repo.update).toHaveBeenCalledWith(template.id, { name: 'Updated' });
  });

  it('throws 403 when caller is not admin', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.updateSystemTemplate(false, 'tpl-id', { name: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when template does not exist', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.updateSystemTemplate(true, 'unknown-id', { name: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TemplateService.deleteUserTemplate', () => {
  it('deletes the template when caller is the creator', async () => {
    const template = makeTemplate({ createdBy: userId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await service.deleteUserTemplate(userId, false, template.id);

    expect(repo.delete).toHaveBeenCalledWith(template.id);
  });

  it('allows admin to delete a template they did not create', async () => {
    const template = makeTemplate({ createdBy: 'other-user' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await service.deleteUserTemplate(adminId, true, template.id);

    expect(repo.delete).toHaveBeenCalledWith(template.id);
  });

  it('throws 403 when non-admin caller is not the creator', async () => {
    const template = makeTemplate({ createdBy: 'other-user' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await expect(
      service.deleteUserTemplate(userId, false, template.id),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 when admin tries to delete a system template via user route', async () => {
    const template = makeTemplate({ isSystem: true, createdBy: null });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await expect(
      service.deleteUserTemplate(adminId, true, template.id),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when template does not exist', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.deleteUserTemplate(userId, false, 'unknown-id'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TemplateService.deleteSystemTemplate', () => {
  it('deletes a system template when caller is admin', async () => {
    const template = makeTemplate({ isSystem: true, createdBy: null });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await service.deleteSystemTemplate(true, template.id);

    expect(repo.delete).toHaveBeenCalledWith(template.id);
  });

  it('throws 403 when caller is not admin', async () => {
    const template = makeTemplate({ isSystem: true, createdBy: null });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(template) });
    const service = new TemplateService(repo);

    await expect(
      service.deleteSystemTemplate(false, template.id),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when template does not exist', async () => {
    const service = new TemplateService(makeRepo());

    await expect(
      service.deleteSystemTemplate(true, 'unknown-id'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
