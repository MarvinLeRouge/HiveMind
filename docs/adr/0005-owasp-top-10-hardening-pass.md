# 5. Dedicated OWASP Top 10 hardening pass (BLOCK-25)

## Status

Accepted

## Context

Authentication, transport, and dependency security had grown incrementally
alongside features, without a structured review against a recognized
baseline. Before treating HiveMind as production-ready, the project needed
a single pass explicitly checked against the OWASP Top 10 rather than
continuing to add security-adjacent fixes opportunistically.

## Decision

Run a dedicated hardening block (BLOCK-25) scoped explicitly to the OWASP
Top 10, and record the resulting mapping in [SECURITY.md](../../SECURITY.md)
so future changes can be checked against the same baseline instead of
starting from scratch:

- **Server-side refresh token invalidation**: a `RefreshToken` table stores
  a hash of each issued token with a `jti` (to prevent hash collisions);
  logout deletes the stored token, and rotation replaces it on each refresh.
- **Rate limiting** via `@fastify/rate-limit`, applied globally and with
  tighter per-route limits on `register`, `login`, `refresh`, and the
  collection invite endpoint.
- **HTTP security headers** via `@fastify/helmet` (CSP, `X-Frame-Options`,
  `Referrer-Policy`, etc.).
- **Stricter secrets**: JWT secrets are validated at startup to be at least
  32 characters, via the existing Zod environment schema.
- **Upload validation**: GPX/CSV import handlers reject unexpected MIME
  types before parsing.
- **Access control fix**: `GET /invitations/:id` now returns 403 when the
  requester isn't the invitee, closing a cross-user read.
- **Dependency patching**: transitive CVEs (`fast-jwt`, `fast-uri`) pinned
  via `pnpm` overrides after the audit surfaced them.

## Consequences

- [SECURITY.md](../../SECURITY.md) documents the OWASP category ↔
  mitigation mapping directly, so a reviewer doesn't have to reconstruct it
  from commit history.
- Logout and refresh now require a database round-trip (token lookup and
  rotation), a deliberate cost trade-off for server-side revocation over a
  purely stateless refresh token.
- A09 (Logging Failures) was left as **partial**: Fastify's default request
  logging is active, but a structured log format was explicitly deferred
  rather than bundled into this pass.
