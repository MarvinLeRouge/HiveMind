import type { APIRequestContext } from '@playwright/test';

const API_URL =
  process.env['E2E_API_URL'] ?? 'http://hivemind.marvinlerouge.local/api';

/**
 * Authenticated API client for E2E helpers.
 * All methods include the Bearer token — avoids the pitfall where the Playwright
 * `request` fixture only sends cookies from storageState, not Authorization headers.
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token: string,
  ) {}

  private get auth() {
    return { Authorization: `Bearer ${this.token}` };
  }

  /** Returns the ID of the built-in Generic system template. */
  async getGenericTemplateId(): Promise<string> {
    const res = await this.request.get(`${API_URL}/templates`, {
      headers: this.auth,
    });
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
  async createCollection(
    name: string,
    templateId: string,
  ): Promise<{ id: string; slug: string }> {
    const res = await this.request.post(`${API_URL}/collections`, {
      data: { name, templateId },
      headers: this.auth,
    });
    if (!res.ok()) throw new Error(`createCollection failed: ${res.status()}`);
    return res.json() as Promise<{ id: string; slug: string }>;
  }

  /** Creates a puzzle inside a collection and returns its id. */
  async createPuzzle(collectionId: string, title: string): Promise<string> {
    const res = await this.request.post(
      `${API_URL}/collections/${collectionId}/puzzles`,
      { data: { title }, headers: this.auth },
    );
    if (!res.ok()) throw new Error(`createPuzzle failed: ${res.status()}`);
    const body = (await res.json()) as { id: string };
    return body.id;
  }

  /** Deletes a collection. */
  async deleteCollection(collectionId: string): Promise<void> {
    await this.request.delete(`${API_URL}/collections/${collectionId}`, {
      headers: this.auth,
    });
  }

  /** Sends a collection invitation and returns the invitation id. */
  async sendInvitation(collectionId: string, email: string): Promise<string> {
    const res = await this.request.post(
      `${API_URL}/collections/${collectionId}/invitations`,
      { data: { email }, headers: this.auth },
    );
    if (!res.ok()) throw new Error(`sendInvitation failed: ${res.status()}`);
    const body = (await res.json()) as { id: string };
    return body.id;
  }

  /** Accepts a collection invitation. */
  async acceptInvitation(invitationId: string): Promise<void> {
    const res = await this.request.post(
      `${API_URL}/invitations/${invitationId}/accept`,
      { headers: this.auth },
    );
    if (!res.ok()) throw new Error(`acceptInvitation failed: ${res.status()}`);
  }

  /** Deletes a puzzle from a collection. */
  async deletePuzzle(collectionId: string, puzzleId: string): Promise<void> {
    await this.request.delete(
      `${API_URL}/collections/${collectionId}/puzzles/${puzzleId}`,
      { headers: this.auth },
    );
  }

  /** Adds a note to a puzzle and returns its id. */
  async addNote(puzzleId: string, content: string): Promise<string> {
    const res = await this.request.post(
      `${API_URL}/puzzles/${puzzleId}/notes`,
      {
        data: { content },
        headers: this.auth,
      },
    );
    if (!res.ok()) throw new Error(`addNote failed: ${res.status()}`);
    const body = (await res.json()) as { id: string };
    return body.id;
  }
}

/** Logs in and returns an authenticated ApiClient for that user. */
export async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<ApiClient> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok())
    throw new Error(`loginAs failed for ${email}: ${res.status()}`);
  const { accessToken } = (await res.json()) as { accessToken: string };
  return new ApiClient(request, accessToken);
}

export { API_URL };
