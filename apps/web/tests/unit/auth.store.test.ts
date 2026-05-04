import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/auth';

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
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockAuthResponse = { accessToken: 'token-abc', user: mockUser };

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
  });

  describe('login', () => {
    it('sets accessToken and user on success', async () => {
      mockFetch.mockResolvedValueOnce(mockAuthResponse);
      const auth = useAuthStore();

      await auth.login('alice@example.com', 'Password123!');

      expect(auth.accessToken).toBe('token-abc');
      expect(auth.user).toEqual(mockUser);
      expect(auth.isAuthenticated).toBe(true);
    });

    it('throws and leaves state unchanged on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401'));
      const auth = useAuthStore();

      await expect(auth.login('bad@example.com', 'wrong')).rejects.toThrow();
      expect(auth.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('sets accessToken and user on success', async () => {
      mockFetch.mockResolvedValueOnce(mockAuthResponse);
      const auth = useAuthStore();

      await auth.register('alice', 'alice@example.com', 'Password123!');

      expect(auth.accessToken).toBe('token-abc');
      expect(auth.user).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    it('returns true and updates state when cookie is valid', async () => {
      mockFetch.mockResolvedValueOnce(mockAuthResponse);
      const auth = useAuthStore();

      const result = await auth.refresh();

      expect(result).toBe(true);
      expect(auth.accessToken).toBe('token-abc');
    });

    it('returns false and clears state when cookie is expired', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401'));
      const auth = useAuthStore();
      auth.accessToken = 'old-token';
      auth.user = mockUser;

      const result = await auth.refresh();

      expect(result).toBe(false);
      expect(auth.accessToken).toBeNull();
      expect(auth.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears state even when the API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'));
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = mockUser;

      await auth.logout();

      expect(auth.accessToken).toBeNull();
      expect(auth.user).toBeNull();
      expect(auth.isAuthenticated).toBe(false);
    });

    it('clears state on successful logout', async () => {
      mockFetch.mockResolvedValueOnce(undefined);
      const auth = useAuthStore();
      auth.accessToken = 'token-abc';
      auth.user = mockUser;

      await auth.logout();

      expect(auth.isAuthenticated).toBe(false);
    });
  });

  describe('init', () => {
    it('restores session when a valid refresh cookie is present', async () => {
      mockFetch.mockResolvedValueOnce(mockAuthResponse);
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
});
