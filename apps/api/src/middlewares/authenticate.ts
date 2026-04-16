import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded payload to request.user.
 * Returns 401 if the token is missing or invalid.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or invalid access token',
    });
  }
}
