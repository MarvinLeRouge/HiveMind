import type { Invitation } from '@prisma/client';
import type { InvitationRepository } from '../repositories/invitation.repository.js';

const EXPIRY_DAYS = 7;

/**
 * Business logic for invitations.
 *
 * Rules:
 * - An invitation can only be sent if no pending invitation exists for the
 *   same email + collection pair, and the invitee is not already a member.
 * - Invitations expire after 7 days.
 * - Only the invitee (matched by email) can accept or decline.
 * - Accept and decline both require the invitation to still be pending and
 *   not expired.
 * - On accept, the invitee is joined as a member (role: "member").
 */
export class InvitationService {
  constructor(private readonly repo: InvitationRepository) {}

  /**
   * Creates a pending invitation for the given email.
   * Throws 409 if the email is already a member or has a pending invitation.
   */
  async sendInvitation(
    collectionId: string,
    invitedBy: string,
    inviteeEmail: string,
  ): Promise<Invitation> {
    const alreadyMember = await this.repo.isMemberByEmail(
      collectionId,
      inviteeEmail,
    );
    if (alreadyMember)
      throw Object.assign(
        new Error('User is already a member of this collection'),
        { statusCode: 409 },
      );

    const existing = await this.repo.findPendingByEmailAndCollection(
      collectionId,
      inviteeEmail,
    );
    if (existing)
      throw Object.assign(
        new Error('A pending invitation already exists for this email'),
        { statusCode: 409 },
      );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    return this.repo.create({
      collectionId,
      invitedBy,
      inviteeEmail,
      expiresAt,
    });
  }

  /**
   * Returns an invitation by ID.
   * Throws 404 if not found.
   */
  async getById(id: string): Promise<Invitation> {
    const invitation = await this.repo.findById(id);
    if (!invitation) throw this.notFound();
    return invitation;
  }

  /**
   * Accepts an invitation and joins the invitee as a collection member.
   * Throws 404 if not found, 403 if email mismatch, 410 if expired,
   * 409 if no longer pending.
   */
  async accept(id: string, userId: string, userEmail: string): Promise<void> {
    const invitation = await this.repo.findById(id);
    if (!invitation) throw this.notFound();

    if (invitation.inviteeEmail !== userEmail) throw this.forbidden();

    if (new Date() > invitation.expiresAt)
      throw Object.assign(new Error('Invitation has expired'), {
        statusCode: 410,
      });

    if (invitation.status !== 'pending')
      throw Object.assign(new Error('Invitation is no longer pending'), {
        statusCode: 409,
      });

    await this.repo.acceptAndJoin(id, userId, invitation.collectionId);
  }

  /**
   * Declines an invitation.
   * Throws 404 if not found, 403 if email mismatch, 410 if expired,
   * 409 if no longer pending.
   */
  async decline(id: string, userId: string, userEmail: string): Promise<void> {
    const invitation = await this.repo.findById(id);
    if (!invitation) throw this.notFound();

    if (invitation.inviteeEmail !== userEmail) throw this.forbidden();

    if (new Date() > invitation.expiresAt)
      throw Object.assign(new Error('Invitation has expired'), {
        statusCode: 410,
      });

    if (invitation.status !== 'pending')
      throw Object.assign(new Error('Invitation is no longer pending'), {
        statusCode: 409,
      });

    await this.repo.updateStatus(id, 'declined');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Invitation not found'), {
      statusCode: 404,
    });
  }

  private forbidden(): Error {
    return Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
}
