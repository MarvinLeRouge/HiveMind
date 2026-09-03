🇬🇧 English | [🇫🇷 Français](api_endpoints.fr.md)

# HiveMind - API Endpoints

[← Back to README](../../README.md)

---

Interactive documentation is available at `/api/docs` (Swagger UI, development only; disabled in production).

All API errors follow the format: `{ error: string, message: string, statusCode: number }`.

Routes marked `✓` require a valid JWT `Authorization: Bearer <token>` header. Routes marked `✓ admin` additionally require `User.isAdmin = true`. Routes marked `✓ owner` or `✓ member` require the corresponding role on the target collection.

---

## Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /auth/register | - | Create account |
| POST | /auth/verify-email | - | Verify email address |
| POST | /auth/login | - | Get access token + set refresh cookie |
| POST | /auth/refresh | - | Rotate tokens from cookie |
| POST | /auth/logout | yes | Clear refresh cookie |
| GET | /auth/me | yes | Return current user |
| PATCH | /auth/me | yes | Update language preference |

## Templates

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /templates | yes | List templates |
| POST | /templates | yes | Create user template |
| GET | /templates/:id | yes | Get template by ID |
| PATCH | /templates/:id | yes | Update own template |
| DELETE | /templates/:id | yes | Delete own template |
| POST | /templates/system | yes admin | Create system template |
| PATCH | /templates/system/:id | yes admin | Update system template |
| DELETE | /templates/system/:id | yes admin | Delete system template |

## Collections

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /collections | yes | List my collections |
| POST | /collections | yes | Create collection |
| GET | /collections/:id | yes member | Get collection |
| PATCH | /collections/:id | yes owner | Update collection |
| DELETE | /collections/:id | yes owner | Delete collection |
| GET | /collections/:id/members | yes member | List members |
| DELETE | /collections/:id/members/:userId | yes owner | Remove member |

## Invitations

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /collections/:id/invitations | yes owner | Send invitation (email dispatched) |
| GET | /invitations/:id | yes | Get invitation |
| POST | /invitations/:id/accept | yes | Accept invitation |
| POST | /invitations/:id/decline | yes | Decline invitation |

## Puzzles

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /collections/:id/puzzles | yes member | List puzzles |
| POST | /collections/:id/puzzles | yes owner | Create puzzle |
| GET | /collections/:id/puzzles/:pid | yes member | Get puzzle |
| PATCH | /collections/:id/puzzles/:pid | yes member | Update puzzle |
| DELETE | /collections/:id/puzzles/:pid | yes owner | Delete puzzle |
| PATCH | /collections/:id/puzzles/reorder | yes owner | Bulk reorder |
| POST | /collections/:id/puzzles/:pid/claim | yes member | Add self as worker |
| DELETE | /collections/:id/puzzles/:pid/claim | yes member | Remove self as worker |

## Notes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /puzzles/:pid/notes | yes member | List notes |
| POST | /puzzles/:pid/notes | yes member | Add note |
| PATCH | /puzzles/:pid/notes/:nid | yes author | Edit own note |
| DELETE | /puzzles/:pid/notes/:nid | yes author | Delete own note |

## Attempts

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /puzzles/:pid/attempts | yes member | List attempts |
| POST | /puzzles/:pid/attempts | yes member | Add attempt |

## Import

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /collections/:id/import/gpx | yes owner | Import GPX file |
| POST | /collections/:id/import/csv/preview | yes owner | Preview CSV columns |
| POST | /collections/:id/import/csv | yes owner | Import CSV with mapping |
