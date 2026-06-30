import '@fastify/jwt';
import 'fastify';
import type { MailerService } from '../services/mailer.service.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; isAdmin: boolean };
    user: { sub: string; email: string; isAdmin: boolean };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Email delivery service. */
    mailer: MailerService;
  }

  interface FastifyRequest {
    /** UUID of the collection resolved from the route slug/UUID param by requireMember or requireOwner. */
    resolvedCollectionId?: string;
  }
}
