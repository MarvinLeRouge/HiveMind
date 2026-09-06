# 1. JWT access token with an httpOnly refresh cookie

## Status

Accepted

## Context

The API needs stateless request authentication for a Vue SPA consumed both
by the browser and, potentially, other clients, while keeping the token
that grants long-lived access out of reach of JavaScript (and therefore of
XSS-based theft).

## Decision

Split authentication into two tokens with different lifetimes and storage:

- A short-lived JWT **access token** (15 minutes), returned in the response
  body and attached by the frontend as an `Authorization: Bearer` header.
- A longer-lived **refresh token** (7 days), stored in an httpOnly, Secure,
  `SameSite=Strict` cookie, never exposed to client-side JavaScript.

The frontend's `ofetch` client silently calls `POST /auth/refresh` on a 401
and retries the original request once, so the short access token TTL stays
invisible to the user.

## Consequences

- A stolen access token has a narrow 15-minute window of usefulness.
- The refresh token can't be exfiltrated via XSS, since it never touches
  JavaScript-accessible storage.
- CSRF exposure on the refresh cookie is mitigated by `SameSite=Strict`
  rather than a separate CSRF token.
- Every protected request potentially costs a silent refresh round-trip
  right after the access token expires; this is deemed acceptable given the
  low request volume of the application.
