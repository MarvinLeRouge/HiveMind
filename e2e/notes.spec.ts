import { test, expect } from '@playwright/test';
import { STORAGE_STATE, E2E_USERS } from './global-setup';
import { API_URL } from './helpers/api';

test.describe('Notes', () => {
  let collectionId: string;
  let collectionSlug: string;
  let puzzleId: string;

  // Shared setup: create a collection and one puzzle as owner
  test.beforeAll(async ({ request: ownerRequest }) => {
    // Use owner credentials directly
    const ownerRes = await ownerRequest.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const { accessToken: ownerToken } = (await ownerRes.json()) as {
      accessToken: string;
    };

    const tplRes = await ownerRequest.get(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const templates = (await tplRes.json()) as Array<{
      id: string;
      name: string;
      isSystem: boolean;
    }>;
    const templateId = templates.find(
      (t) => t.isSystem && t.name === 'Generic',
    )!.id;

    const colRes = await ownerRequest.post(`${API_URL}/collections`, {
      data: { name: 'E2E Notes Suite', templateId },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const col = (await colRes.json()) as { id: string; slug: string };
    collectionId = col.id;
    collectionSlug = col.slug;

    const pRes = await ownerRequest.post(
      `${API_URL}/collections/${collectionId}/puzzles`,
      {
        data: { title: 'E2E Note Puzzle' },
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );
    puzzleId = ((await pRes.json()) as { id: string }).id;

    // Invite member and accept
    const invRes = await ownerRequest.post(
      `${API_URL}/collections/${collectionId}/invitations`,
      {
        data: { email: E2E_USERS.member.email },
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );
    const { id: invId } = (await invRes.json()) as { id: string };

    const memberAuthRes = await ownerRequest.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.member.email,
        password: E2E_USERS.member.password,
      },
    });
    const { accessToken: memberToken } = (await memberAuthRes.json()) as {
      accessToken: string;
    };
    await ownerRequest.post(`${API_URL}/invitations/${invId}/accept`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
  });

  test.afterAll(async ({ request }) => {
    const ownerRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const { accessToken } = (await ownerRes.json()) as { accessToken: string };
    await request.delete(`${API_URL}/collections/${collectionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  test.describe('as owner', () => {
    test.use({ storageState: STORAGE_STATE.owner });

    test('can add a note and see it in the list', async ({ page }) => {
      await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
      await page.getByRole('tab', { name: 'Add notes' }).click();
      await page.getByLabel('Note content').fill('My first E2E note');
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByText('My first E2E note')).toBeVisible();
    });

    test('can edit own note', async ({ page }) => {
      await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
      await page.getByRole('tab', { name: 'Add notes' }).click();

      // Add a note to edit
      await page.getByLabel('Note content').fill('Note to edit');
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByText('Note to edit')).toBeVisible();

      // Edit it
      const noteItem = page
        .getByRole('listitem')
        .filter({ hasText: 'Note to edit' });
      await noteItem.getByRole('button', { name: 'Edit' }).click();
      // After clicking Edit the note's <p> is replaced by a <textarea>; the
      // hasText filter no longer matches (innerText excludes textarea values),
      // so scope to the notes <ul> instead of the stale noteItem locator.
      await page.locator('ul').getByRole('textbox').fill('Note edited');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Note edited')).toBeVisible();
    });

    test('can delete own note', async ({ page }) => {
      await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
      await page.getByRole('tab', { name: 'Add notes' }).click();

      // Add a note to delete
      await page.getByLabel('Note content').fill('Note to delete');
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByText('Note to delete')).toBeVisible();

      // Delete it
      await page
        .getByRole('listitem')
        .filter({ hasText: 'Note to delete' })
        .getByRole('button', { name: 'Delete' })
        .click();
      await expect(page.getByText('Note to delete')).not.toBeVisible();
    });
  });

  test.describe('as member', () => {
    test.use({ storageState: STORAGE_STATE.member });

    test('member can add their own note', async ({ page }) => {
      await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
      await page.getByRole('tab', { name: 'Add notes' }).click();
      await page.getByLabel('Note content').fill('Member note');
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByText('Member note')).toBeVisible();
    });

    test("member cannot edit or delete owner's notes", async ({
      page,
      request,
    }) => {
      // Add an owner note via the standalone request fixture (NOT page.request,
      // which would inject the owner's refresh cookie into the member's browser
      // context and silently replace the member's session on the next page.goto).
      const ownerRes = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: E2E_USERS.owner.email,
          password: E2E_USERS.owner.password,
        },
      });
      const { accessToken } = (await ownerRes.json()) as {
        accessToken: string;
      };
      await request.post(`${API_URL}/puzzles/${puzzleId}/notes`, {
        data: { content: 'Owner private note' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Member views the puzzle
      await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
      await page.getByRole('tab', { name: 'Add notes' }).click();

      const ownerNoteItem = page
        .getByRole('listitem')
        .filter({ hasText: 'Owner private note' });
      await expect(ownerNoteItem).toBeVisible();
      // Edit and Delete buttons should not appear on notes the member doesn't own
      await expect(
        ownerNoteItem.getByRole('button', { name: 'Edit' }),
      ).not.toBeVisible();
      await expect(
        ownerNoteItem.getByRole('button', { name: 'Delete' }),
      ).not.toBeVisible();
    });
  });
});
