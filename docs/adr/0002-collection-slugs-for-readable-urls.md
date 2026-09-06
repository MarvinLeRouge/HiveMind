# 2. Collection slugs for readable URLs, resolved alongside the UUID

## Status

Accepted

## Context

Collections were originally addressed only by their UUID primary key in
both API routes and frontend URLs, which is correct but unreadable and
unshareable (`/collections/3f2a1c4e-...`).

## Decision

Add a unique, collision-safe `slug` column to `Collection`, generated on
create, and make every collection-scoped lookup accept **either** the slug
or the UUID:

- `findBySlugOrId` in `collection.repository.ts` tries both, so route
  params, middlewares, and services don't need to know which form they
  received.
- `requireMember`/`requireOwner` resolve the collection once and expose the
  resulting UUID as `request.resolvedCollectionId`, so downstream route
  handlers use the resolved ID rather than re-deriving it from
  `request.params.id`. This was added after a first pass accidentally used
  the raw (possibly-slug) param as a foreign key in a couple of handlers.
- The frontend links and navigates using the slug; the UUID stays the
  actual foreign key everywhere in the database.

## Consequences

- URLs are readable and shareable (`/collections/my-geocaching-series`)
  without introducing a second, slug-based foreign key anywhere in the
  schema.
- Any new route handler that needs the collection's ID **must** read
  `request.resolvedCollectionId` instead of `request.params.id`, or it risks
  reintroducing a slug-as-FK bug.
- Renaming a collection changes its slug going forward; old slugs are not
  currently redirected, only the UUID is a stable long-term identifier.
