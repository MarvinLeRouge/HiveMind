import { ofetch } from 'ofetch';
import type { FetchOptions } from 'ofetch';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

/**
 * Returns a pre-configured ofetch instance that:
 * - Adds the Authorization header when an access token is present
 * - On 401, attempts a silent token refresh and retries the request once
 * - On failed refresh, logs out and redirects to /login
 *
 * Must be called within a Vue component setup or composable context (Pinia required).
 */
export function useApi() {
  const auth = useAuthStore();
  const router = useRouter();

  return ofetch.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include',

    onRequest({ options }) {
      if (auth.accessToken) {
        const existing = (options.headers as Record<string, string>) ?? {};
        options.headers = {
          ...existing,
          Authorization: `Bearer ${auth.accessToken}`,
        };
      }
    },

    async onResponseError({ request, response, options }) {
      if (response.status === 401) {
        const refreshed = await auth.refresh();
        if (refreshed) {
          const retryOptions: FetchOptions = {
            ...options,
            headers: {
              ...(options.headers as Record<string, string>),
              Authorization: `Bearer ${auth.accessToken}`,
            },
          };
          return ofetch(request as string, retryOptions);
        }
        await router.push('/login');
      }
    },
  });
}
