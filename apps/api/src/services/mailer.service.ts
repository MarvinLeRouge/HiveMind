import nodemailer from 'nodemailer';

/** Data required to send an invitation email. */
export interface InvitationEmailOptions {
  to: string;
  invitationId: string;
  collectionName: string;
  inviterEmail: string;
  expiresAt: Date;
}

/** Data required to send an email verification email. */
export interface VerificationEmailOptions {
  to: string;
  token: string;
}

/** Contract for outbound email delivery. */
export interface MailerService {
  /** Sends an invitation email to the given recipient. Throws on delivery failure. */
  sendInvitationEmail(opts: InvitationEmailOptions): Promise<void>;
  /** Sends an email verification link to a newly registered user. Throws on delivery failure. */
  sendVerificationEmail(opts: VerificationEmailOptions): Promise<void>;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  ignoreTLS: boolean;
  user: string;
  pass: string;
  from: string;
  frontendBaseUrl: string;
}

/**
 * Production email service backed by nodemailer over SMTP.
 * Throws 502 if SMTP configuration is incomplete at send time.
 */
export class NodemailerMailerService implements MailerService {
  constructor(private readonly config: Partial<SmtpConfig>) {}

  /** @inheritdoc */
  async sendVerificationEmail(opts: VerificationEmailOptions): Promise<void> {
    const { host, user, pass, from, frontendBaseUrl } = this.config;

    if (!host || !user || !pass || !from || !frontendBaseUrl) {
      throw Object.assign(
        new Error(
          'Email service is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, and FRONTEND_BASE_URL.',
        ),
        { statusCode: 502 },
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port: this.config.port ?? 587,
      secure: this.config.secure ?? false,
      ignoreTLS: this.config.ignoreTLS ?? false,
      auth: user && pass ? { user, pass } : undefined,
    });

    const verifyUrl = `${frontendBaseUrl}/verify-email?token=${opts.token}`;

    await transporter.sendMail({
      from,
      to: opts.to,
      subject: 'Verify your HiveMind account',
      text: [
        `Hello,`,
        ``,
        `Please verify your email address by opening the link below:`,
        verifyUrl,
        ``,
        `This link expires in 24 hours.`,
        ``,
        `If you did not create a HiveMind account, you can safely ignore this email.`,
      ].join('\n'),
      html: `
        <p>Hello,</p>
        <p>Please verify your email address to activate your HiveMind account.</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:10px 20px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">
            Verify email address
          </a>
        </p>
        <p style="color:#71717a;font-size:13px;">This link expires in 24 hours.</p>
        <p style="color:#71717a;font-size:13px;">
          If you did not create a HiveMind account, you can safely ignore this email.
        </p>
      `,
    });
  }

  /** @inheritdoc */
  async sendInvitationEmail(opts: InvitationEmailOptions): Promise<void> {
    const { host, port, secure, user, pass, from, frontendBaseUrl } =
      this.config;

    if (!host || !user || !pass || !from || !frontendBaseUrl) {
      throw Object.assign(
        new Error(
          'Email service is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, and FRONTEND_BASE_URL.',
        ),
        { statusCode: 502 },
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port: port ?? 587,
      secure: secure ?? false,
      ignoreTLS: this.config.ignoreTLS ?? false,
      auth: user && pass ? { user, pass } : undefined,
    });

    const acceptUrl = `${frontendBaseUrl}/invitations/${opts.invitationId}`;
    const expiryStr = opts.expiresAt.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await transporter.sendMail({
      from,
      to: opts.to,
      subject: `You've been invited to join "${opts.collectionName}" on HiveMind`,
      text: [
        `Hello,`,
        ``,
        `${opts.inviterEmail} has invited you to collaborate on the collection "${opts.collectionName}" on HiveMind.`,
        ``,
        `To accept this invitation, open the link below:`,
        acceptUrl,
        ``,
        `This invitation expires on ${expiryStr}.`,
        ``,
        `If you were not expecting this invitation, you can safely ignore this email.`,
      ].join('\n'),
      html: `
        <p>Hello,</p>
        <p>
          <strong>${opts.inviterEmail}</strong> has invited you to collaborate on the collection
          <strong>&ldquo;${opts.collectionName}&rdquo;</strong> on HiveMind.
        </p>
        <p>
          <a href="${acceptUrl}"
             style="display:inline-block;padding:10px 20px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">
            Accept invitation
          </a>
        </p>
        <p>This invitation expires on ${expiryStr}.</p>
        <p style="color:#71717a;font-size:13px;">
          If you were not expecting this invitation, you can safely ignore this email.
        </p>
      `,
    });
  }
}

/**
 * No-op mailer used in test environments — does not send any email.
 * Exposes the last verification token for test assertions.
 */
export class NoopMailerService implements MailerService {
  /** The raw verification token from the most recent sendVerificationEmail call. */
  lastVerificationToken: string | undefined = undefined;

  /** @inheritdoc */
  async sendInvitationEmail(): Promise<void> {}

  /** @inheritdoc */
  async sendVerificationEmail(opts: VerificationEmailOptions): Promise<void> {
    this.lastVerificationToken = opts.token;
  }
}
