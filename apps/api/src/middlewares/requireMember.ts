import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies that the authenticated user is a member (any role) of the
 * collection identified by `request.params.id`.
 * Returns 403 if the user has no membership.
 * Must run after the `authenticate` middleware.
 */
export async function requireMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params as { id: string };

  const membership = await request.server.prisma.collectionMember.findUnique({
    where: {
      collectionId_userId: { collectionId: id, userId: request.user.sub },
    },
  });

  if (!membership) {
    await reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'You are not a member of this collection',
    });
  }
}
