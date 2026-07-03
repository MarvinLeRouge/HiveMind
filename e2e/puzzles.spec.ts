import { test, expect } from '@playwright/test';
import { STORAGE_STATE, E2E_USERS } from './global-setup';
import { API_URL, loginAs } from './helpers/api';

test.describe('Puzzles', () => {
  test.use({ storageState: STORAGE_STATE.owner });

  let collectionId: string;
  let collectionSlug: string;
  let puzzleId: string;

  test.beforeAll(async ({ request }) => {
    const api = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    const templateId = await api.getGenericTemplateId();
    const col = await api.createCollection('E2E Puzzles Suite', templateId);
    collectionId = col.id;
    collectionSlug = col.slug;
    puzzleId = await api.createPuzzle(collectionId, 'E2E Puzzle Alpha');
  });

  test.afterAll(async ({ request }) => {
    const api = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    await api.deleteCollection(collectionId);
  });

  test('puzzle list shows existing puzzle', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(page.getByText('E2E Puzzle Alpha')).toBeVisible();
  });

  test('owner can add a new puzzle via the UI', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await page.getByRole('button', { name: '+ Add puzzle' }).click();
    await page.getByLabel('Title').fill('E2E Puzzle Beta');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('E2E Puzzle Beta')).toBeVisible();
  });

  test('clicking a puzzle opens its detail page', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await page.getByText('E2E Puzzle Alpha').click();
    await expect(page).toHaveURL(new RegExp(`/puzzles/${puzzleId}`));
    await expect(page.getByText('E2E Puzzle Alpha')).toBeVisible();
  });

  test('owner can edit puzzle fields', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Title').fill('E2E Puzzle Alpha (edited)');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('E2E Puzzle Alpha (edited)')).toBeVisible();

    // Restore title
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Title').fill('E2E Puzzle Alpha');
    await page.getByRole('button', { name: 'Save changes' }).click();
  });

  test('owner can claim and release a puzzle', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('button', { name: 'Claim' }).click();
    await expect(page.getByRole('button', { name: 'Release' })).toBeVisible();

    await page.getByRole('button', { name: 'Release' }).click();
    await expect(page.getByRole('button', { name: 'Claim' })).toBeVisible();
  });

  test('owner can advance puzzle status', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);

    // Default status is "open" — first advance goes to "in_progress"
    await page
      .getByRole('button', { name: /Mark as/i })
      .first()
      .click();
    await expect(page.getByText('In progress')).toBeVisible();

    // Advance to "solved"
    await page
      .getByRole('button', { name: /Mark as/i })
      .first()
      .click();
    await expect(page.getByText('Solved')).toBeVisible();
  });

  test('owner can delete a puzzle', async ({ page, request }) => {
    const api = await loginAs(
      request,
      E2E_USERS.owner.email,
      E2E_USERS.owner.password,
    );
    const toDeleteId = await api.createPuzzle(
      collectionId,
      'E2E Delete Puzzle',
    );
    await page.goto(`/collections/${collectionSlug}`);
    await expect(page.getByText('E2E Delete Puzzle')).toBeVisible();

    // Delete via API (no deletion UI — owner deletes via API or future UI)
    await api.deletePuzzle(collectionId, toDeleteId);

    await page.reload();
    await expect(page.getByText('E2E Delete Puzzle')).not.toBeVisible();
  });
});

test.describe('Puzzles — member', () => {
  test.use({ storageState: STORAGE_STATE.member });

  let collectionSlug: string;
  let puzzleId: string;

  test.beforeAll(async ({ request }) => {
    // Login as owner to set up data
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
    const templateId = templates.find(
      (t) => t.isSystem && t.name === 'Generic',
    )!.id;

    const colRes = await request.post(`${API_URL}/collections`, {
      data: { name: 'E2E Member Puzzle Suite', templateId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const col = (await colRes.json()) as { id: string; slug: string };
    collectionSlug = col.slug;

    // Add puzzle
    const pRes = await request.post(
      `${API_URL}/collections/${col.id}/puzzles`,
      {
        data: { title: 'E2E Member Puzzle' },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    puzzleId = ((await pRes.json()) as { id: string }).id;

    // Invite + accept as member
    const invRes = await request.post(
      `${API_URL}/collections/${col.id}/invitations`,
      {
        data: { email: E2E_USERS.member.email },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const { id: invitationId } = (await invRes.json()) as { id: string };

    const memberAuthRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.member.email,
        password: E2E_USERS.member.password,
      },
    });
    const { accessToken: memberToken } = (await memberAuthRes.json()) as {
      accessToken: string;
    };
    await request.post(`${API_URL}/invitations/${invitationId}/accept`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
  });

  test('member can view the puzzle list', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(
      page.getByText('E2E Member Puzzle', { exact: true }),
    ).toBeVisible();
  });

  test('member cannot see the "+ Add puzzle" button', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}`);
    await expect(
      page.getByRole('button', { name: '+ Add puzzle' }),
    ).not.toBeVisible();
  });

  test('member can claim a puzzle', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('button', { name: 'Claim' }).click();
    await expect(page.getByRole('button', { name: 'Release' })).toBeVisible();
  });
});
