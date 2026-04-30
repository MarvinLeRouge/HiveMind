import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies that the authenticated user is an owner of the collection
 * identified by `request.params.id`.
 * Returns 403 if the user is not a member or is only a regular member.
 * Must run after the `authenticate` middleware.
 */
export async function requireOwner(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params as { id: string };

  const membership = await request.server.prisma.collectionMember.findUnique({
    where: {
      collectionId_userId: { collectionId: id, userId: request.user.sub },
    },
  });

  if (!membership || membership.role !== 'owner') {
    await reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'You must be the collection owner to perform this action',
    });
  }
}
