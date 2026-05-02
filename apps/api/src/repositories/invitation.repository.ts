import type { PrismaClient, Invitation } from '@prisma/client';

export interface CreateInvitationData {
  collectionId: string;
  invitedBy: string;
  inviteeEmail: string;
  expiresAt: Date;
}

/**
 * Data access layer for invitations.
 * Contains only Prisma queries — no business logic.
 */
export class InvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds an invitation by ID.
   */
  async findById(id: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({ where: { id } });
  }

  /**
   * Finds an existing pending invitation for a given email + collection pair.
   */
  async findPendingByEmailAndCollection(
    collectionId: string,
    inviteeEmail: string,
  ): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: { collectionId, inviteeEmail, status: 'pending' },
    });
  }

  /**
   * Returns true if a user with the given email is already a member of the
   * collection. Returns false if the user does not exist.
   */
  async isMemberByEmail(collectionId: string, email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    const membership = await this.prisma.collectionMember.findUnique({
      where: { collectionId_userId: { collectionId, userId: user.id } },
    });
    return !!membership;
  }

  /**
   * Creates a new invitation.
   */
  async create(data: CreateInvitationData): Promise<Invitation> {
    return this.prisma.invitation.create({ data });
  }

  /**
   * Updates the status of an invitation.
   */
  async updateStatus(id: string, status: string): Promise<Invitation> {
    return this.prisma.invitation.update({ where: { id }, data: { status } });
  }

  /**
   * Accepts an invitation and joins the invitee as a member in a single
   * transaction. Uses upsert on CollectionMember to be idempotent if the user
   * is already a member.
   */
  async acceptAndJoin(
    invitationId: string,
    userId: string,
    collectionId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      });
      await tx.collectionMember.upsert({
        where: { collectionId_userId: { collectionId, userId } },
        create: { collectionId, userId, role: 'member' },
        update: {},
      });
    });
  }
}
