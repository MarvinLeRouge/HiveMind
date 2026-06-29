import '@fastify/jwt';
import 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; isAdmin: boolean };
    user: { sub: string; email: string; isAdmin: boolean };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    /** UUID of the collection resolved from the route slug/UUID param by requireMember or requireOwner. */
    resolvedCollectionId?: string;
  }
}
