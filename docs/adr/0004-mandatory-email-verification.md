# 4. Mandatory email verification before first login

## Status

Accepted

## Context

Registration originally created an active account immediately, with no
proof that the provided email address was reachable or owned by the
registrant. This leaves the door open to account enumeration (probing which
emails are registered) and to throwaway/abusive account creation.

## Decision

Require email verification before a newly registered account can log in:

- Registration creates the `User` with `emailVerified = false` and issues a
  `VerificationToken` (SHA-256 hash of a random token, 24-hour TTL,
  one-time use).
- The verification link is emailed to the user; `POST /auth/verify-email`
  consumes the token and flips `emailVerified` to `true`.
- `POST /auth/login` rejects unverified accounts, with a message distinct
  enough from "wrong password" to guide the user toward re-checking their
  inbox, but not so distinct that it reveals whether an email is
  registered.
- Seed users (admin accounts) are created pre-verified, since they don't go
  through the registration flow.

## Consequences

- A new user has one extra step (checking their inbox) before their first
  login, deferred from being blocking at registration time.
- The mailer dependency (Brevo SMTP in production, a no-op mailer in tests)
  is now on the critical path for onboarding a new user, not just for
  invitations.
- Verification tokens must be cleaned up or expire predictably; the 24-hour
  TTL is enforced at verification time, not by a background job.
