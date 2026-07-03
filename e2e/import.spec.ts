import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { STORAGE_STATE, E2E_USERS } from './global-setup';
import { API_URL } from './helpers/api';

/**
 * Import tests use the Playwright APIRequestContext directly (no browser UI).
 * GPX/CSV import has no frontend — all import features are API-only.
 */
test.describe('Import (API)', () => {
  test.use({ storageState: STORAGE_STATE.owner });

  let collectionId: string;
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const authRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: E2E_USERS.owner.email,
        password: E2E_USERS.owner.password,
      },
    });
    const auth = (await authRes.json()) as { accessToken: string };
    accessToken = auth.accessToken;

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
      data: { name: 'E2E Import Suite', templateId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const col = (await colRes.json()) as { id: string; slug: string };
    collectionId = col.id;
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_URL}/collections/${collectionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  test('GPX import creates puzzles from waypoints', async ({ request }) => {
    const gpxPath = path.resolve('e2e/fixtures/sample.gpx');
    const gpxBuffer = fs.readFileSync(gpxPath);

    const res = await request.post(
      `${API_URL}/collections/${collectionId}/import/gpx`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          file: {
            name: 'sample.gpx',
            mimeType: 'application/gpx+xml',
            buffer: gpxBuffer,
          },
        },
      },
    );

    expect(res.status()).toBe(201);
    const body = (await res.json()) as { created: number };
    expect(body.created).toBeGreaterThan(0);

    // Verify puzzles were actually created
    const puzzlesRes = await request.get(
      `${API_URL}/collections/${collectionId}/puzzles`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const puzzles = (await puzzlesRes.json()) as Array<{ id: string }>;
    expect(puzzles.length).toBeGreaterThanOrEqual(body.created);
  });

  test('CSV preview returns column names without creating puzzles', async ({
    request,
  }) => {
    const csvPath = path.resolve('e2e/fixtures/sample.csv');
    const csvBuffer = fs.readFileSync(csvPath);

    const before = await request.get(
      `${API_URL}/collections/${collectionId}/puzzles`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const countBefore = ((await before.json()) as Array<unknown>).length;

    const res = await request.post(
      `${API_URL}/collections/${collectionId}/import/csv/preview`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          file: {
            name: 'sample.csv',
            mimeType: 'text/csv',
            buffer: csvBuffer,
          },
        },
      },
    );

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { columns: string[] };
    expect(Array.isArray(body.columns)).toBe(true);
    expect(body.columns.length).toBeGreaterThan(0);

    // Preview must not create puzzles
    const after = await request.get(
      `${API_URL}/collections/${collectionId}/puzzles`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(((await after.json()) as Array<unknown>).length).toBe(countBefore);
  });

  test('CSV import creates puzzles with mapped columns', async ({
    request,
  }) => {
    // First get preview to know the column names
    const csvPath = path.resolve('e2e/fixtures/sample.csv');
    const csvBuffer = fs.readFileSync(csvPath);

    const previewRes = await request.post(
      `${API_URL}/collections/${collectionId}/import/csv/preview`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          file: {
            name: 'sample.csv',
            mimeType: 'text/csv',
            buffer: csvBuffer,
          },
        },
      },
    );
    const { columns } = (await previewRes.json()) as { columns: string[] };

    // Map the first column to "title" (required mapping)
    const titleColumn = columns[0];

    const importRes = await request.post(
      `${API_URL}/collections/${collectionId}/import/csv`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          file: {
            name: 'sample.csv',
            mimeType: 'text/csv',
            buffer: csvBuffer,
          },
          mapping: JSON.stringify({ title: titleColumn }),
        },
      },
    );

    expect(importRes.status()).toBe(201);
    const body = (await importRes.json()) as { created: number };
    expect(body.created).toBeGreaterThan(0);
  });
});
