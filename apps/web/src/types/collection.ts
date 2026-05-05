import type { Template } from './template';

/** A collection resource as returned by the API. */
export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdBy: string;
  templateSnapshot: Template;
  createdAt: string;
}

/** A collection member as returned by the API. */
export interface Member {
  userId: string;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}
