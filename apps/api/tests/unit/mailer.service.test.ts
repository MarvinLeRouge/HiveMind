import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NodemailerMailerService,
  NoopMailerService,
  type InvitationEmailOptions,
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
