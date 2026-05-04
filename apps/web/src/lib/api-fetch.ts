import { ofetch } from 'ofetch';
import type { FetchOptions } from 'ofetch';
import { useAuthStore } from '@/stores/auth';

/**
 * Authenticated ofetch wrapper used by Pinia stores.
 * Injects the JWT Authorization header and retries once after a silent
 * token refresh on 401. Throws on all other errors.
 */
export async function apiFetch<T>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  const auth = useAuthStore();

  const withAuth = (): FetchOptions => ({
    ...options,
    credentials: 'include',
    headers: {
      ...(options?.headers as Record<string, string>),
      ...(auth.accessToken
        ? { Authorization: `Bearer ${auth.accessToken}` }
        : {}),
    },
  });

  try {
    return await ofetch<T>(url, withAuth());
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : 0;

    if (status === 401) {
      const refreshed = await auth.refresh();
      if (refreshed) return ofetch<T>(url, withAuth());
      auth.accessToken = null;
      auth.user = null;
    }
    throw err;
  }
}
