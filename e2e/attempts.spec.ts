import { test, expect } from '@playwright/test';
import { STORAGE_STATE, E2E_USERS } from './global-setup';
import { API_URL } from './helpers/api';

test.describe('Attempts', () => {
  test.use({ storageState: STORAGE_STATE.owner });

  let collectionSlug: string;
  let puzzleId: string;
  let collectionId: string;

  test.beforeAll(async ({ request }) => {
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
      data: { name: 'E2E Attempts Suite', templateId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const col = (await colRes.json()) as { id: string; slug: string };
    collectionId = col.id;
    collectionSlug = col.slug;

    const pRes = await request.post(
      `${API_URL}/collections/${collectionId}/puzzles`,
      {
        data: { title: 'E2E Attempt Puzzle' },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    puzzleId = ((await pRes.json()) as { id: string }).id;
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

  test('can record an attempt and see it in the list', async ({ page }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('tab', { name: 'Attempts' }).click();

    await page
      .getByRole('form', { name: 'Record attempt' })
      .getByLabel('Value to test')
      .fill('TEST-123');
    await page.getByRole('button', { name: 'Record' }).click();

    await expect(page.getByText('TEST-123')).toBeVisible();
  });

  test('recorded attempts have no edit button (immutable)', async ({
    page,
  }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('tab', { name: 'Attempts' }).click();

    // Record a fresh attempt
    await page
      .getByRole('form', { name: 'Record attempt' })
      .getByLabel('Value to test')
      .fill('IMMUTABLE-001');
    await page.getByRole('button', { name: 'Record' }).click();

    const attemptItem = page
      .getByRole('listitem')
      .filter({ hasText: 'IMMUTABLE-001' });
    await expect(attemptItem).toBeVisible();
    await expect(
      attemptItem.getByRole('button', { name: 'Edit' }),
    ).not.toBeVisible();
  });

  test('multiple attempts are listed in reverse chronological order', async ({
    page,
  }) => {
    await page.goto(`/collections/${collectionSlug}/puzzles/${puzzleId}`);
    await page.getByRole('tab', { name: 'Attempts' }).click();

    const form = page.getByRole('form', { name: 'Record attempt' });

    await form.getByLabel('Value to test').fill('FIRST');
    await page.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByText('FIRST')).toBeVisible();

    await form.getByLabel('Value to test').fill('SECOND');
    await page.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByText('SECOND')).toBeVisible();

    // SECOND should appear before FIRST (most recent first)
    const items = page.getByRole('listitem');
    const secondIndex = await items
      .filter({ hasText: 'SECOND' })
      .first()
      .evaluate((el) => {
        const list = el.closest('ul') ?? el.parentElement!;
        return Array.from(list.children).indexOf(el);
      });
    const firstIndex = await items
      .filter({ hasText: 'FIRST' })
      .first()
      .evaluate((el) => {
        const list = el.closest('ul') ?? el.parentElement!;
        return Array.from(list.children).indexOf(el);
      });
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});
