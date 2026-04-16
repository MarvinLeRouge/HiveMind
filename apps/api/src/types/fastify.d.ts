import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; isAdmin: boolean };
    user: { sub: string; email: string; isAdmin: boolean };
  }
}
