import { defineStore } from 'pinia';
import { ofetch } from 'ofetch';
import type { User, AuthResponse } from '@/types/auth';
import i18n, { type Locale, SUPPORTED_LOCALES } from '@/i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      this.syncLocale(data.user.language);
    },

    /** Registers a new account and stores the returned token. */
    async register(
      username: string,
      email: string,
      password: string,
    ): Promise<void> {
      const data = await ofetch<AuthResponse>(`${BASE_URL}/auth/register`, {
        method: 'POST',
        body: { username, email, password },
        credentials: 'include',
      });
      this.accessToken = data.accessToken;
      this.user = data.user;
      this.syncLocale(data.user.language);
    },

    /**
     * Silently refreshes the access token using the httpOnly refresh cookie.
     * Returns true on success, false if the session has expired.
     */
    async refresh(): Promise<boolean> {
      try {
        const data = await ofetch<AuthResponse>(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        this.accessToken = data.accessToken;
        this.user = data.user;
        this.syncLocale(data.user.language);
        return true;
      } catch {
        this.accessToken = null;
        this.user = null;
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
    },

    /**
     * Called on app mount: attempts a silent refresh to restore the session
     * if a refresh cookie is present.
     */
    async init(): Promise<void> {
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
