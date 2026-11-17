import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NodemailerMailerService,
  NoopMailerService,
  type InvitationEmailOptions,
  type VerificationEmailOptions,
} from '../../src/services/mailer.service.js';

// ── Nodemailer mock ───────────────────────────────────────────────────────────

const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockSendMail = vi.fn().mockResolvedValue({});
  const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));
  return { mockSendMail, mockCreateTransport };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_CONFIG = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  ignoreTLS: false,
  user: 'user@example.com',
  pass: 'secret',
  from: 'HiveMind <no-reply@example.com>',
  frontendBaseUrl: 'http://localhost:5173',
};

const OPTS: InvitationEmailOptions = {
  to: 'invitee@example.com',
  invitationId: 'inv-uuid-1',
  collectionName: 'My Collection',
  inviterEmail: 'inviter@example.com',
  expiresAt: new Date('2026-07-07T00:00:00Z'),
};

const VERIFY_OPTS: VerificationEmailOptions = {
  to: 'new-user@example.com',
  token: 'raw-token-123',
};

const REQUIRED_KEYS = [
  'host',
  'user',
  'pass',
  'from',
  'frontendBaseUrl',
] as const;

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({});
  mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
});

describe('NodemailerMailerService.sendInvitationEmail', () => {
  it('throws 502 when SMTP host is missing', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      host: undefined,
    });
    await expect(service.sendInvitationEmail(OPTS)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws 502 when SMTP user is missing', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      user: undefined,
    });
    await expect(service.sendInvitationEmail(OPTS)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws 502 when SMTP pass is missing', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      pass: undefined,
    });
    await expect(service.sendInvitationEmail(OPTS)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws 502 when from address is missing', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      from: undefined,
    });
    await expect(service.sendInvitationEmail(OPTS)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws 502 when frontendBaseUrl is missing', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      frontendBaseUrl: undefined,
    });
    await expect(service.sendInvitationEmail(OPTS)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('creates a transporter with the configured SMTP options', async () => {
    const service = new NodemailerMailerService(BASE_CONFIG);
    await service.sendInvitationEmail(OPTS);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        ignoreTLS: false,
      }),
    );
  });

  it('sends an email to the correct recipient with the collection name in the subject', async () => {
    const service = new NodemailerMailerService(BASE_CONFIG);
    await service.sendInvitationEmail(OPTS);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: BASE_CONFIG.from,
        to: OPTS.to,
        subject: expect.stringContaining('My Collection'),
      }),
    );
  });

  it('includes the acceptance URL in both text and HTML bodies', async () => {
    const service = new NodemailerMailerService(BASE_CONFIG);
    await service.sendInvitationEmail(OPTS);

    const mail = mockSendMail.mock.calls[0][0] as {
      text: string;
      html: string;
    };
    const expectedUrl = 'http://localhost:5173/invitations/inv-uuid-1';
    expect(mail.text).toContain(expectedUrl);
    expect(mail.html).toContain(expectedUrl);
  });

  it('includes the inviter email in the message body', async () => {
    const service = new NodemailerMailerService(BASE_CONFIG);
    await service.sendInvitationEmail(OPTS);

    const mail = mockSendMail.mock.calls[0][0] as { text: string };
    expect(mail.text).toContain('inviter@example.com');
  });

  it('propagates transport errors', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));
    const service = new NodemailerMailerService(BASE_CONFIG);

    await expect(service.sendInvitationEmail(OPTS)).rejects.toThrow(
      'Connection refused',
    );
  });
});

describe('NoopMailerService.sendInvitationEmail', () => {
  it('resolves without throwing or sending anything', async () => {
    const service = new NoopMailerService();
    await expect(service.sendInvitationEmail(OPTS)).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

describe('NodemailerMailerService.sendVerificationEmail', () => {
  it.each(REQUIRED_KEYS)('throws 502 when %s is missing', async (key) => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      [key]: undefined,
    });

    await expect(
      service.sendVerificationEmail(VERIFY_OPTS),
    ).rejects.toMatchObject({ statusCode: 502 });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends the verification link to the new user', async () => {
    const service = new NodemailerMailerService(BASE_CONFIG);
    await service.sendVerificationEmail(VERIFY_OPTS);

    const mail = mockSendMail.mock.calls[0][0] as {
      from: string;
      to: string;
      text: string;
      html: string;
    };
    const expectedUrl =
      'http://localhost:5173/verify-email?token=raw-token-123';
    expect(mail.from).toBe(BASE_CONFIG.from);
    expect(mail.to).toBe('new-user@example.com');
    expect(mail.text).toContain(expectedUrl);
    expect(mail.html).toContain(expectedUrl);
  });

  it('falls back to port 587 without TLS flags when they are not configured', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      port: undefined,
      secure: undefined,
      ignoreTLS: undefined,
    });
    await service.sendVerificationEmail(VERIFY_OPTS);

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      ignoreTLS: false,
      auth: { user: 'user@example.com', pass: 'secret' },
    });
  });

  it('propagates transport errors', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));
    const service = new NodemailerMailerService(BASE_CONFIG);

    await expect(service.sendVerificationEmail(VERIFY_OPTS)).rejects.toThrow(
      'Connection refused',
    );
  });
});

describe('NodemailerMailerService.sendInvitationEmail defaults', () => {
  it('falls back to port 587 without TLS flags when they are not configured', async () => {
    const service = new NodemailerMailerService({
      ...BASE_CONFIG,
      port: undefined,
      secure: undefined,
      ignoreTLS: undefined,
    });
    await service.sendInvitationEmail(OPTS);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false, ignoreTLS: false }),
    );
  });
});

describe('NoopMailerService.sendVerificationEmail', () => {
  it('records the token without sending anything', async () => {
    const service = new NoopMailerService();
    await service.sendVerificationEmail(VERIFY_OPTS);

    expect(service.lastVerificationToken).toBe('raw-token-123');
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
