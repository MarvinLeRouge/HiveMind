import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { User } from '@prisma/client';
import { AuthService } from '../../src/services/auth.service.js';
import type { AuthRepository } from '../../src/repositories/auth.repository.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  passwordHash: bcrypt.hashSync('password123', 1),
  isAdmin: false,
  createdAt: new Date('2025-01-01T00:00:00Z'),
};

// ── Mocks ────────────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockUser),
    ...overrides,
  } as unknown as AuthRepository;
}

function makeApp(): FastifyInstance {
  return {
    jwt: {
      sign: vi.fn().mockReturnValue('signed-token'),
      verify: vi.fn().mockReturnValue({ sub: mockUser.id }),
    },
  } as unknown as FastifyInstance;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService.register', () => {
  it('creates a user and returns AuthUser', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(null) });
    const service = new AuthService(repo, makeApp());

    const result = await service.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(result.email).toBe('alice@example.com');
    expect(result.username).toBe('alice');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('throws 409 if email is already in use', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(mockUser) });
    const service = new AuthService(repo, makeApp());

    await expect(
      service.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('AuthService.login', () => {
  it('returns user and tokens for valid credentials', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(mockUser),
    });
    const service = new AuthService(repo, makeApp());

    const result = await service.login({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('alice@example.com');
    expect(result.tokens.accessToken).toBe('signed-token');
    expect(result.tokens.refreshToken).toBe('signed-token');
  });

  it('throws 401 for unknown email', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(null) });
    const service = new AuthService(repo, makeApp());

    await expect(
      service.login({ email: 'ghost@example.com', password: 'any' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 for wrong password', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(mockUser),
    });
    const service = new AuthService(repo, makeApp());

    await expect(
      service.login({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('AuthService.refresh', () => {
  it('returns new tokens for a valid refresh token', async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(mockUser),
    });
    const service = new AuthService(repo, makeApp());

    const result = await service.refresh('valid-refresh-token');

    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
  });

  it('throws 401 for an invalid refresh token', async () => {
    const app = {
      jwt: {
        sign: vi.fn(),
        verify: vi.fn().mockImplementation(() => {
          throw new Error('invalid token');
        }),
      },
    } as unknown as FastifyInstance;
    const service = new AuthService(makeRepo(), app);

    await expect(service.refresh('bad-token')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 if user no longer exists', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new AuthService(repo, makeApp());

    await expect(service.refresh('valid-token')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('AuthService.me', () => {
  it('returns the user profile for a valid ID', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(mockUser) });
    const service = new AuthService(repo, makeApp());

    const result = await service.me(mockUser.id);

    expect(result.id).toBe(mockUser.id);
    expect(result.email).toBe(mockUser.email);
  });

  it('throws 401 if user does not exist', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new AuthService(repo, makeApp());

    await expect(service.me('unknown-id')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
