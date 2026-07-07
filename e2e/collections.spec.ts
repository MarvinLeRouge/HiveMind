import { test, expect } from '@playwright/test';
import { STORAGE_STATE, E2E_USERS } from './global-setup';
import { API_URL, loginAs } from './helpers/api';

test.describe('Collections — owner', () => {
  test.use({ storageState: STORAGE_STATE.owner });

  let templateId: string;
  let collectionId: string;
  let collectionSlug: string;

  test.beforeAll(async ({ request }) => {
    const api = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    templateId = await api.getGenericTemplateId();
    const col = await api.createCollection('E2E Owner Suite', templateId);
    collectionId = col.id;
    collectionSlug = col.slug;
  });

  test.afterAll(async ({ request }) => {
    const cleanup = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    await cleanup.deleteCollection(collectionId);
  });

  test('newly created collection appears in the list', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/collections/new');
    await page.getByLabel('Name').fill(`E2E Create ${ts}`);

    // Select the Generic template
    await page.getByLabel('Template').selectOption({ label: 'Generic' });
    await page.getByRole('button', { name: 'Create collection' }).click();
    await expect(page).toHaveURL(/\/collections\/[^/]+$/);

    // Navigate back to list and verify it appears
    await page.getByRole('link', { name: 'Collections' }).click();
    await expect(page.getByText(`E2E Create ${ts}`)).toBeVisible();
  });

  test('collection detail page shows title and puzzle section', async ({
    page,
  }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(page.getByText('E2E Owner Suite')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Puzzles' })).toBeVisible();
  });

  test('owner can access and update collection settings', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    const newName = `E2E Owner Suite (edited)`;
    await page.getByLabel('Name').fill(newName);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText(newName)).toBeVisible();

    // Save navigates to the collection detail page — go back to settings to restore.
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByLabel('Name').fill('E2E Owner Suite');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('E2E Owner Suite')).toBeVisible();
  });

  test('owner can delete a collection', async ({ page, request }) => {
    const api = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    const col = await api.createCollection('E2E Delete Me', templateId);

    await page.goto(`/collections/${col.slug}/settings`);
    await page.getByRole('button', { name: 'Delete collection' }).click();
    await page.getByRole('button', { name: 'Yes, delete' }).click();
    await expect(page).toHaveURL(/\/collections$/);
    await expect(page.getByText('E2E Delete Me')).not.toBeVisible();
  });

  test('owner can invite a member and see confirmation', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);

    // Open members panel (desktop button)
    await page
      .getByRole('button', { name: /Members/ })
      .first()
      .click();
    await page.getByLabel('Email address').fill(E2E_USERS.member.email);
    await page.getByRole('button', { name: 'Send invitation' }).click();
    await expect(
      page.getByRole('status').getByText('Invitation sent.'),
    ).toBeVisible();
  });
});

test.describe('Collections — member access', () => {
  test.use({ storageState: STORAGE_STATE.member });

  let templateId: string;
  let collectionId: string;
  let collectionSlug: string;

  test.beforeAll(async ({ request: ownerRequest }) => {
    // Set up with owner credentials via API
    const ownerRes = await ownerRequest.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const { accessToken } = (await ownerRes.json()) as {
      accessToken: string;
    };

    // Create collection and invite member as owner
    const tplRes = await ownerRequest.get(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const templates = (await tplRes.json()) as Array<{
      id: string;
      name: string;
      isSystem: boolean;
    }>;
    templateId = templates.find((t) => t.isSystem && t.name === 'Generic')!.id;

    const colRes = await ownerRequest.post(`${API_URL}/collections`, {
      data: { name: 'E2E Member Suite', templateId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const col = (await colRes.json()) as { id: string; slug: string };
    collectionId = col.id;
    collectionSlug = col.slug;

    // Invite member
    const invRes = await ownerRequest.post(
      `${API_URL}/collections/${collectionId}/invitations`,
      {
        data: { email: E2E_USERS.member.email },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const { id: invitationId } = (await invRes.json()) as { id: string };

    // Accept invitation as member (via API)
    const memberRes = await ownerRequest.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.member.email,
        password: E2E_USERS.member.password,
      },
    });
    const { accessToken: memberToken } = (await memberRes.json()) as {
      accessToken: string;
    };
    await ownerRequest.post(`${API_URL}/invitations/${invitationId}/accept`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
  });

  test.afterAll(async ({ request: ownerRequest }) => {
    const ownerRes = await ownerRequest.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const { accessToken } = (await ownerRes.json()) as { accessToken: string };
    await ownerRequest.delete(`${API_URL}/collections/${collectionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  test('member can view the collection', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(page.getByText('E2E Member Suite')).toBeVisible();
  });

  test('member cannot see the Settings link', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(
      page.getByRole('link', { name: 'Settings' }),
    ).not.toBeVisible();
  });
});

test.describe('Collections — outsider access', () => {
  test.use({ storageState: STORAGE_STATE.outsider });

  test("outsider cannot access another user's collection", async ({
    request,
  }) => {
    // Create a collection as owner via API to get a real slug
    const ownerRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const { accessToken } = (await ownerRes.json()) as { accessToken: string };

    const tplRes = await request.get(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const templates = (await tplRes.json()) as Array<{
      id: string;
      name: string;
      isSystem: boolean;
    }>;
    const tplId = templates.find((t) => t.isSystem && t.name === 'Generic')!.id;

    const colRes = await request.post(`${API_URL}/collections`, {
      data: { name: 'E2E Outsider Test', templateId: tplId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id, slug } = (await colRes.json()) as { id: string; slug: string };

    // Outsider makes an authenticated request — expects 403 (forbidden), not 401
    const outsiderRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.outsider.email,
        password: E2E_USERS.outsider.password,
      },
    });
    const { accessToken: outsiderToken } = (await outsiderRes.json()) as {
      accessToken: string;
    };
    const res = await request.get(`${API_URL}/collections/${slug}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    expect(res.status()).toBe(403);

    // Cleanup
    await request.delete(`${API_URL}/collections/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });
});
