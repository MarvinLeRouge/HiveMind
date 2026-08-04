import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/auth';
import i18n from '../../src/i18n';

// ── Mock ofetch ───────────────────────────────────────────────────────────────

vi.mock('ofetch', () => ({
  ofetch: vi.fn(),
}));

import { ofetch } from 'ofetch';
const mockFetch = vi.mocked(ofetch);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  isAdmin: false,
  language: 'en',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockAuthResponse = { accessToken: 'token-abc', user: mockUser };

const ACCESS_TOKEN_KEY = 'hivemind_access_token';

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
  });

  describe('login', () => {
    it('sets accessToken, user, and localStorage on success', async () => {
      mockFetch.mockResolvedValueOnce(mockAuthResponse);
      const auth = useAuthStore();

      await auth.login('alice@example.com', 'Password123!');

      expect(auth.accessToken).toBe('token-abc');
      expect(auth.user).toEqual(mockUser);
      expect(auth.isAuthenticated).toBe(true);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('token-abc');
    });

    it('throws and leaves state unchanged on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401'));
      const auth = useAuthStore();

      await expect(auth.login('bad@example.com', 'wrong')).rejects.toThrow();
      expect(auth.isAuthenticated).toBe(false);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });
  });

  describe('register', () => {
    it('returns the server response without setting local session state', async () => {
      const mockResponse = {
        message: 'Check your inbox!',
        user: mockUser,
      };
      mockFetch.mockResolvedValueOnce(mockResponse);
      const auth = useAuthStore();

      const result = await auth.register(
        'alice',
        'alice@example.com',
        'Password123!',
      );

      expect(result).toEqual(mockResponse);
      expect(auth.accessToken).toBeNull();
      expect(auth.user).toBeNull();
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });

    it('throws when the API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Email already taken'));
      const auth = useAuthStore();

      await expect(
        auth.register('alice', 'alice@example.com', 'Password123!'),
      ).rejects.toThrow('Email already taken');
    });
  });

  describe('verifyEmail', () => {
    it('calls the verify-email endpoint with the token', async () => {
      mockFetch.mockResolvedValueOnce({ message: 'Email verified.' });
      const auth = useAuthStore();

      await expect(auth.verifyEmail('raw-token-abc')).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/verify-email'),
        expect.objectContaining({ body: { token: 'raw-token-abc' } }),
      );
    });

    it('throws when the token is invalid or expired', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid token'));
      const auth = useAuthStore();

      await expect(auth.verifyEmail('bad-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('refresh', () => {
    it('returns true, updates state, and persists token to localStorage when cookie is valid', async () => {
      mockFetch
        .mockResolvedValueOnce({ accessToken: 'token-abc' })
        .mockResolvedValueOnce(mockUser);
      const auth = useAuthStore();

      const result = await auth.refresh();

      expect(result).toBe(true);
      expect(auth.accessToken).toBe('token-abc');
      expect(auth.user).toEqual(mockUser);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('token-abc');
    });

    it('returns false, clears state, and removes localStorage token when cookie is expired', async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'old-token');
      mockFetch.mockRejectedValueOnce(new Error('401'));
      const auth = useAuthStore();
      auth.accessToken = 'old-token';
      auth.user = mockUser;

      const result = await auth.refresh();

      expect(result).toBe(false);
      expect(auth.accessToken).toBeNull();
      expect(auth.user).toBeNull();
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears state and localStorage even when the API call fails', async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'token-abc');
      mockFetch.mockRejectedValueOnce(new Error('network'));
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = mockUser;

      await auth.logout();

      expect(auth.accessToken).toBeNull();
      expect(auth.user).toBeNull();
      expect(auth.isAuthenticated).toBe(false);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });

    it('clears state and localStorage on successful logout', async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'token-abc');
      mockFetch.mockResolvedValueOnce(undefined);
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = mockUser;

      await auth.logout();

      expect(auth.isAuthenticated).toBe(false);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });
  });

  describe('init', () => {
    it('restores session from localStorage when a valid stored token is present', async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'token-abc');
      mockFetch.mockResolvedValueOnce(mockUser); // GET /auth/me
      const auth = useAuthStore();

      await auth.init();

      expect(auth.isAuthenticated).toBe(true);
      expect(auth.accessToken).toBe('token-abc');
      expect(auth.user).toEqual(mockUser);
      // refresh (POST /auth/refresh) must NOT have been called
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('falls through to cookie refresh when the stored token is rejected by the server', async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-token');
      mockFetch
        .mockRejectedValueOnce(new Error('401')) // GET /auth/me fails
        .mockResolvedValueOnce({ accessToken: 'token-new' }) // POST /auth/refresh
        .mockResolvedValueOnce(mockUser); // GET /auth/me (via refresh)
      const auth = useAuthStore();

      await auth.init();

      expect(auth.isAuthenticated).toBe(true);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('token-new');
    });

    it('restores session when a valid refresh cookie is present and no localStorage token', async () => {
      mockFetch
        .mockResolvedValueOnce({ accessToken: 'token-abc' })
        .mockResolvedValueOnce(mockUser);
      const auth = useAuthStore();

      await auth.init();

      expect(auth.isAuthenticated).toBe(true);
      expect(auth.user).toEqual(mockUser);
    });

    it('leaves state unauthenticated when no valid session exists', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401'));
      const auth = useAuthStore();

      await auth.init();

      expect(auth.isAuthenticated).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('patches the API, updates user.language, and syncs the locale', async () => {
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = { ...mockUser };
      mockFetch.mockResolvedValueOnce({ ...mockUser, language: 'fr' });

      await auth.setLanguage('fr');

      expect(auth.user?.language).toBe('fr');
      expect(i18n.global.locale.value).toBe('fr');
    });

    it('still syncs locale when user is null', async () => {
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = null;
      mockFetch.mockResolvedValueOnce({ ...mockUser, language: 'fr' });

      await auth.setLanguage('fr');

      expect(i18n.global.locale.value).toBe('fr');
    });
  });

  describe('syncLocale', () => {
    it('sets locale to fr for a supported language', () => {
      const auth = useAuthStore();
      auth.syncLocale('fr');
      expect(i18n.global.locale.value).toBe('fr');
    });

    it('falls back to en for an unsupported language', () => {
      const auth = useAuthStore();
      auth.syncLocale('de');
      expect(i18n.global.locale.value).toBe('en');
    });
  });
});
