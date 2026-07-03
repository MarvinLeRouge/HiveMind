import { test, expect } from '@playwright/test';
import { E2E_USERS } from './global-setup';

// All auth tests start without any stored session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('login with valid credentials redirects to /collections', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USERS.owner.email);
    await page.getByLabel('Password').fill(E2E_USERS.owner.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/collections$/);
  });

  test('login with wrong password shows error and stays on /login', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USERS.owner.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('register a new user redirects to /collections', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/register');
    await page.getByLabel('Username').fill(`e2e-reg-${ts}`);
    await page.getByLabel('Email').fill(`e2e.reg.${ts}@hivemind.test`);
    await page.getByLabel('Password').fill('E2eReg1!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/collections$/);
  });

  test('logout clears session and redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USERS.owner.email);
    await page.getByLabel('Password').fill(E2E_USERS.owner.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/collections$/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to /collections redirects to /login', async ({
    page,
  }) => {
    await page.goto('/collections');
    await expect(page).toHaveURL(/\/login/);
  });

  test('language toggle switches navbar to French then back', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USERS.owner.email);
    await page.getByLabel('Password').fill(E2E_USERS.owner.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/collections$/);

    // Switch to French — locale may switch after PATCH /auth/me completes
    await page.getByRole('button', { name: 'FR' }).click();
    await expect(page.getByText('Déconnexion')).toBeVisible({
      timeout: 10_000,
    });

    // Switch back to English
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByText('Log out')).toBeVisible({ timeout: 10_000 });
  });
});
