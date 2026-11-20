import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Creates a PrismaClient on the node-postgres driver adapter (required since Prisma 7).
 * @param connectionString - PostgreSQL URL, defaults to DATABASE_URL
 */
export function createPrismaClient(
  connectionString: string | undefined = process.env['DATABASE_URL'],
): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export { PrismaClient };
