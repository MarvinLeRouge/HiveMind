import { defineStore } from 'pinia';
import { ofetch } from 'ofetch';
import type { User, AuthResponse, RegisterResponse } from '@/types/auth';
import i18n, { type Locale, SUPPORTED_LOCALES } from '@/i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Key used to persist the short-lived access token across page loads.
// Allows Playwright storageState to capture it so E2E tests can restore
// a session without consuming the httpOnly refresh cookie on every test.
const ACCESS_TOKEN_KEY = 'hivemind_access_token';

/**
 * Global authentication store.
 * Manages current user state and JWT access token.
 * Uses raw ofetch directly to avoid circular dependency with useApi.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
  }),

  getters: {
    /** True when a valid access token is present. */
    isAuthenticated: (state): boolean => !!state.accessToken,
  },

  actions: {
    /** Logs in with email + password and stores the returned token. */
    async login(email: string, password: string): Promise<void> {
      const data = await ofetch<AuthResponse>(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });
      this.accessToken = data.accessToken;
      this.user = data.user;
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      this.syncLocale(data.user.language);
    },

    /**
     * Registers a new account and sends a verification email.
     * Returns the server message to display to the user.
     * The user cannot log in until they verify their email.
     */
    async register(
      username: string,
      email: string,
      password: string,
    ): Promise<RegisterResponse> {
      return ofetch<RegisterResponse>(`${BASE_URL}/auth/register`, {
        method: 'POST',
        body: { username, email, password },
      });
    },

    /**
     * Verifies the user's email using the token from the verification link.
     * Throws on invalid or expired token.
     */
    async verifyEmail(token: string): Promise<void> {
      await ofetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        body: { token },
      });
    },

    /**
     * Silently refreshes the access token using the httpOnly refresh cookie.
     * Returns true on success, false if the session has expired.
     * The /auth/refresh endpoint returns only { accessToken }; the user profile
     * is fetched separately via GET /auth/me with the new token.
     */
    async refresh(): Promise<boolean> {
      try {
        const { accessToken } = await ofetch<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          { method: 'POST', credentials: 'include' },
        );
        this.accessToken = accessToken;
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        const user = await ofetch<User>(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        this.user = user;
        this.syncLocale(user.language);
        return true;
      } catch {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return false;
      }
    },

    /**
     * Calls the logout endpoint and clears local state.
     * API errors are swallowed — the session is always cleared locally.
     */
    async logout(): Promise<void> {
      try {
        await ofetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}` }
            : {},
          credentials: 'include',
        });
      } catch {
        // Ignore network / server errors; local state is always cleared.
      }
      this.accessToken = null;
      this.user = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    /**
     * Called on app mount: restores the session from localStorage if a valid
     * access token is present, otherwise falls back to a silent cookie refresh.
     */
    async init(): Promise<void> {
      const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        try {
          const user = await ofetch<User>(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
          });
          this.accessToken = stored;
          this.user = user;
          this.syncLocale(user.language);
          return;
        } catch {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
      }
      await this.refresh();
    },

    /**
     * Updates the user's preferred language via the API and syncs the i18n locale.
     */
    async setLanguage(language: Locale): Promise<void> {
      const data = await ofetch<User>(`${BASE_URL}/auth/me`, {
        method: 'PATCH',
        body: { language },
        headers: this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {},
        credentials: 'include',
      });
      if (this.user) {
        this.user = { ...this.user, language: data.language };
      }
      this.syncLocale(data.language);
    },

    syncLocale(language: string): void {
      const locale = SUPPORTED_LOCALES.includes(language as Locale)
        ? (language as Locale)
        : 'en';
      i18n.global.locale.value = locale;
    },
  },
});
