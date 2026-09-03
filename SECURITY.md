🇬🇧 English | [🇫🇷 Français](SECURITY.fr.md)

# Security Policy

---

## Reporting a vulnerability

If you discover a security vulnerability in HiveMind, please report it responsibly:

**Contact:** open a [GitHub Security Advisory](https://github.com/MarvinLeRouge/HiveMind/security/advisories/new) (private by default).

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any relevant logs, payloads, or proof-of-concept code

**Response time:** acknowledgment within 72 hours, resolution timeline communicated within 7 days.

Do not open a public GitHub issue for security vulnerabilities.

---

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` branch (latest) | Yes |
| Older tags | No |

Only the current production deployment is actively maintained.

---

## Security measures in place

### Authentication

- JWT access tokens with a 15-minute TTL
- Refresh tokens stored in httpOnly, Secure, SameSite=Strict cookies (not accessible to JavaScript)
- Server-side refresh token invalidation: each token carries a `jti`; logout revokes it in the database
- Email verification required before first login (SHA-256 token, 24-hour TTL, one-time use)

### Transport and headers

- HTTPS enforced in production via Traefik + Let's Encrypt
- HTTP security headers via `@fastify/helmet`: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`

### Input validation

- All API inputs validated with Zod schemas at the route level
- File uploads (GPX, CSV) are size-limited and content-type checked before parsing

### Rate limiting

- `POST /auth/login`: 10 requests / minute per IP
- `POST /auth/register`: 5 requests / minute per IP
- `POST /auth/verify-email` and resend: 3 requests / minute per IP

### Authorization

- Every protected route checks JWT validity via the `authenticate` middleware
- Collection-level access is enforced by `requireMember` and `requireOwner` middleware
- Users can only modify their own notes; attempts are immutable after creation

### Dependencies

- Dependencies are audited with `pnpm audit` as part of the development workflow
- Transitive CVEs identified in the OWASP Top 10 audit (BLOCK-25) have been patched or pinned

---

## OWASP Top 10 audit

HiveMind went through a structured OWASP Top 10 review (BLOCK-25). Findings and mitigations:

| OWASP category | Status |
|---|---|
| A01 Broken Access Control | Mitigated - per-route middleware, collection-scoped roles |
| A02 Cryptographic Failures | Mitigated - HTTPS, httpOnly cookies, SHA-256 verification tokens |
| A03 Injection | Mitigated - Prisma ORM (parameterized queries), Zod input validation |
| A04 Insecure Design | Mitigated - server-side token invalidation, email verification |
| A05 Security Misconfiguration | Mitigated - Helmet headers, Swagger UI disabled in production |
| A06 Vulnerable Components | Mitigated - CVE patching pass on transitive dependencies |
| A07 Auth Failures | Mitigated - rate limiting on auth routes, email verification |
| A08 Software Integrity | Mitigated - GHCR images pinned by SHA in CD workflow |
| A09 Logging Failures | Partial - Fastify request logging active; structured log format not yet enforced |
| A10 SSRF | Low risk - no outbound HTTP calls triggered by user input |
