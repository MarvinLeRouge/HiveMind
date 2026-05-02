import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Prehandler that verifies the authenticated user is a member of the collection
 * that owns the puzzle identified by :pid in the route params.
 * Returns 404 if the puzzle does not exist, 403 if the user is not a member.
 */
export async function requirePuzzleMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { pid } = request.params as { pid: string };

  const puzzle = await request.server.prisma.puzzle.findUnique({
    where: { id: pid },
    select: { collectionId: true },
  });

  if (!puzzle) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Puzzle not found',
    });
  }

  const membership = await request.server.prisma.collectionMember.findUnique({
    where: {
      collectionId_userId: {
        collectionId: puzzle.collectionId,
        userId: request.user.sub,
      },
    },
  });

  if (!membership) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden',
    });
  }
}
