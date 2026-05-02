import { describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@prisma/client';
import { InvitationService } from '../../src/services/invitation.service.js';
import type { InvitationRepository } from '../../src/repositories/invitation.repository.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'user-uuid-1';
const otherId = 'user-uuid-2';
const collectionId = 'col-uuid-1';
const invId = 'inv-uuid-1';
const userEmail = 'user1@example.com';
const otherEmail = 'user2@example.com';

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: invId,
    collectionId,
    invitedBy: userId,
    inviteeEmail: otherEmail,
    status: 'pending',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    expiresAt: futureDate,
    ...overrides,
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<InvitationRepository> = {},
): InvitationRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findPendingByEmailAndCollection: vi.fn().mockResolvedValue(null),
    isMemberByEmail: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue(makeInvitation()),
    updateStatus: vi.fn().mockResolvedValue(makeInvitation()),
    acceptAndJoin: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as InvitationRepository;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvitationService.sendInvitation', () => {
  it('creates an invitation when all checks pass', async () => {
    const repo = makeRepo();
    const service = new InvitationService(repo);

    await service.sendInvitation(collectionId, userId, otherEmail);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId,
        invitedBy: userId,
        inviteeEmail: otherEmail,
      }),
    );
  });

  it('throws 409 when the invitee is already a member', async () => {
    const repo = makeRepo({ isMemberByEmail: vi.fn().mockResolvedValue(true) });
    const service = new InvitationService(repo);

    await expect(
      service.sendInvitation(collectionId, userId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when a pending invitation already exists', async () => {
    const repo = makeRepo({
      findPendingByEmailAndCollection: vi
        .fn()
        .mockResolvedValue(makeInvitation()),
    });
    const service = new InvitationService(repo);

    await expect(
      service.sendInvitation(collectionId, userId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('InvitationService.getById', () => {
  it('returns the invitation when found', async () => {
    const invitation = makeInvitation();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(invitation) });
    const service = new InvitationService(repo);

    const result = await service.getById(invId);

    expect(result).toEqual(invitation);
  });

  it('throws 404 when the invitation does not exist', async () => {
    const service = new InvitationService(makeRepo());

    await expect(service.getById('unknown-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('InvitationService.accept', () => {
  it('calls acceptAndJoin when all checks pass', async () => {
    const invitation = makeInvitation();
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await service.accept(invId, otherId, otherEmail);

    expect(repo.acceptAndJoin).toHaveBeenCalledWith(
      invId,
      otherId,
      collectionId,
    );
  });

  it('throws 404 when the invitation does not exist', async () => {
    const service = new InvitationService(makeRepo());

    await expect(
      service.accept('unknown-id', otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the email does not match', async () => {
    const invitation = makeInvitation({ inviteeEmail: otherEmail });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.accept(invId, userId, userEmail),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 410 when the invitation is expired', async () => {
    const invitation = makeInvitation({ expiresAt: pastDate });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.accept(invId, otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 410 });
  });

  it('throws 409 when the invitation is no longer pending', async () => {
    const invitation = makeInvitation({ status: 'accepted' });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.accept(invId, otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('InvitationService.decline', () => {
  it('updates status to declined when all checks pass', async () => {
    const invitation = makeInvitation();
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await service.decline(invId, otherId, otherEmail);

    expect(repo.updateStatus).toHaveBeenCalledWith(invId, 'declined');
  });

  it('throws 404 when the invitation does not exist', async () => {
    const service = new InvitationService(makeRepo());

    await expect(
      service.decline('unknown-id', otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when the email does not match', async () => {
    const invitation = makeInvitation({ inviteeEmail: otherEmail });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.decline(invId, userId, userEmail),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 410 when the invitation is expired', async () => {
    const invitation = makeInvitation({ expiresAt: pastDate });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.decline(invId, otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 410 });
  });

  it('throws 409 when the invitation is no longer pending', async () => {
    const invitation = makeInvitation({ status: 'declined' });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(invitation),
    });
    const service = new InvitationService(repo);

    await expect(
      service.decline(invId, otherId, otherEmail),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
