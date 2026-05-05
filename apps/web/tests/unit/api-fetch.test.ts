import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/auth';
import { apiFetch } from '../../src/lib/api-fetch';

vi.mock('ofetch', () => ({ ofetch: vi.fn() }));

import { ofetch } from 'ofetch';
const mockFetch = vi.mocked(ofetch);

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('apiFetch', () => {
  it('calls ofetch without Authorization when unauthenticated', async () => {
    mockFetch.mockResolvedValueOnce({ data: 'ok' });

    await apiFetch('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/test',
      expect.objectContaining({ credentials: 'include' }),
    );
    const opts = mockFetch.mock.calls[0][1] as Record<string, unknown>;
    expect(
      (opts.headers as Record<string, string>)['Authorization'],
    ).toBeUndefined();
  });

  it('injects Authorization header when a token is present', async () => {
    const auth = useAuthStore();
    auth.accessToken = 'my-token';
    mockFetch.mockResolvedValueOnce({ data: 'ok' });

    await apiFetch('/test');

    const opts = mockFetch.mock.calls[0][1] as Record<string, unknown>;
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer my-token',
    );
  });

  it('retries with a new token after a successful 401 refresh', async () => {
    const auth = useAuthStore();
    auth.accessToken = 'old-token';
    vi.spyOn(auth, 'refresh').mockResolvedValueOnce(true);
    mockFetch
      .mockRejectedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ data: 'retried' });

    const result = await apiFetch('/test');

    expect(result).toEqual({ data: 'retried' });
    expect(auth.refresh).toHaveBeenCalledOnce();
  });

  it('clears auth state and rethrows when 401 refresh fails', async () => {
    const auth = useAuthStore();
    auth.accessToken = 'old-token';
    auth.user = {
      id: '1',
      username: 'u',
      email: 'e',
      isAdmin: false,
      createdAt: '',
    };
    vi.spyOn(auth, 'refresh').mockResolvedValueOnce(false);
    const err = { status: 401 };
    mockFetch.mockRejectedValueOnce(err);

    await expect(apiFetch('/test')).rejects.toEqual(err);
    expect(auth.accessToken).toBeNull();
    expect(auth.user).toBeNull();
  });

  it('rethrows non-401 errors without refreshing', async () => {
    const auth = useAuthStore();
    vi.spyOn(auth, 'refresh');
    const err = { status: 500 };
    mockFetch.mockRejectedValueOnce(err);

    await expect(apiFetch('/test')).rejects.toEqual(err);
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});
