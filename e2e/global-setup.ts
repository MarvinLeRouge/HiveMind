import { chromium } from '@playwright/test';
import * as fs from 'node:fs';

const BASE_URL =
  process.env['E2E_BASE_URL'] ?? 'http://hivemind.marvinlerouge.local';
const API_URL =
  process.env['E2E_API_URL'] ?? 'http://hivemind.marvinlerouge.local/api';
const MAILPIT_URL = process.env['E2E_MAILPIT_URL'] ?? 'http://localhost:8025';

/** Stable E2E test accounts, created once and reused across the suite. */
export const E2E_USERS = {
  owner: {
    username: 'e2e-owner',
    email: 'e2e.owner@hivemind.test',
    password: 'E2eOwner1!',
  },
  member: {
    username: 'e2e-member',
    email: 'e2e.member@hivemind.test',
    password: 'E2eMember1!',
  },
  outsider: {
    username: 'e2e-outsider',
    email: 'e2e.outsider@hivemind.test',
    password: 'E2eOutsider1!',
  },
} as const;

/** Paths to saved browser authentication states. */
export const STORAGE_STATE = {
  owner: 'e2e/.auth/owner.json',
  member: 'e2e/.auth/member.json',
  outsider: 'e2e/.auth/outsider.json',
} as const;

/** Exported API base URL for use in specs. */
export const API_URL_EXPORT = API_URL;

/** Waits until the backend responds with 401 on /auth/me (app is healthy). */
async function waitForApp(): Promise<void> {
  const url = `${API_URL}/auth/me`;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 401) return;
    } catch {
      // service not yet available
    }
    await new Promise<void>((r) => setTimeout(r, 2000));
  }
  throw new Error(`App did not become ready at ${url} within 60s`);
}

interface MailpitMessage {
  ID: string;
  To: Array<{ Address: string }>;
}

interface MailpitMessageDetail {
  Text: string;
}

/**
 * Polls Mailpit until a message addressed to `toEmail` appears, then returns
 * the raw verification token extracted from the link in the email body.
 */
async function fetchVerificationToken(toEmail: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = (await res.json()) as { messages: MailpitMessage[] };

    const msg = data.messages.find((m) =>
      m.To.some((to) => to.Address === toEmail),
    );

    if (msg) {
      const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${msg.ID}`);
      const { Text } = (await detail.json()) as MailpitMessageDetail;
      const match = /verify-email\?token=([a-f0-9]+)/.exec(Text);
      if (match) return match[1];
    }

    await new Promise<void>((r) => setTimeout(r, 500));
  }

  throw new Error(`No verification email found in Mailpit for ${toEmail}`);
}

/** Calls POST /auth/verify-email with the given raw token. */
async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`Failed to verify email (${res.status}): ${body}`);
  }
}

/**
 * Registers an E2E user via the API and verifies their email through Mailpit.
 * Silently ignores 409 (user already exists and is presumed verified).
 */
async function registerUser(user: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (res.status === 201) {
    const token = await fetchVerificationToken(user.email);
    await verifyEmail(token);
  } else if (res.status !== 409) {
    const body = await res.text();
    throw new Error(
      `Failed to register ${user.email} (${res.status}): ${body}`,
    );
  }
}

/** Logs in via the browser UI and saves the session state to disk. */
async function saveStorageState(
  email: string,
  password: string,
  path: string,
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/collections');

  await context.storageState({ path });
  await context.close();
  await browser.close();
}

export default async function globalSetup(): Promise<void> {
  await waitForApp();

  fs.mkdirSync('e2e/.auth', { recursive: true });

  // Register E2E users (idempotent — 409 means user already exists)
  for (const user of Object.values(E2E_USERS)) {
    await registerUser(user);
  }

  // Save authenticated storage states for each role
  for (const [role, user] of Object.entries(E2E_USERS) as [
    keyof typeof E2E_USERS,
    (typeof E2E_USERS)[keyof typeof E2E_USERS],
  ][]) {
    await saveStorageState(user.email, user.password, STORAGE_STATE[role]);
  }
}
