import type { APIRequestContext } from '@playwright/test';

const API_URL =
  process.env['E2E_API_URL'] ?? 'http://hivemind.marvinlerouge.local/api';

/** Returns the ID of the built-in Generic system template. */
export async function getGenericTemplateId(
  request: APIRequestContext,
): Promise<string> {
  const res = await request.get(`${API_URL}/templates`);
  const templates = (await res.json()) as Array<{
    id: string;
    name: string;
    isSystem: boolean;
  }>;
  const generic = templates.find((t) => t.isSystem && t.name === 'Generic');
  if (!generic) throw new Error('Generic system template not found');
  return generic.id;
}

/** Creates a collection and returns its id and slug. */
export async function createCollection(
  request: APIRequestContext,
  name: string,
  templateId: string,
): Promise<{ id: string; slug: string }> {
  const res = await request.post(`${API_URL}/collections`, {
    data: { name, templateId },
  });
  if (!res.ok()) throw new Error(`createCollection failed: ${res.status()}`);
  return res.json() as Promise<{ id: string; slug: string }>;
}

/** Creates a puzzle inside a collection and returns its id. */
export async function createPuzzle(
  request: APIRequestContext,
  collectionId: string,
  title: string,
): Promise<string> {
  const res = await request.post(
    `${API_URL}/collections/${collectionId}/puzzles`,
    { data: { title } },
  );
  if (!res.ok()) throw new Error(`createPuzzle failed: ${res.status()}`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

/** Deletes a collection (owner only). */
export async function deleteCollection(
  request: APIRequestContext,
  collectionId: string,
): Promise<void> {
  await request.delete(`${API_URL}/collections/${collectionId}`);
}

/** Sends a collection invitation and returns the invitation id. */
export async function sendInvitation(
  request: APIRequestContext,
  collectionId: string,
  email: string,
): Promise<string> {
  const res = await request.post(
    `${API_URL}/collections/${collectionId}/invitations`,
    { data: { email } },
  );
  if (!res.ok()) throw new Error(`sendInvitation failed: ${res.status()}`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

export { API_URL };
