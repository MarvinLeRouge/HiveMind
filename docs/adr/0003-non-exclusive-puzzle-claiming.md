# 3. Non-exclusive puzzle claiming via a PuzzleWorker join table

## Status

Accepted (supersedes the original exclusive-claim design)

## Context

The first implementation of "claiming" a puzzle stored a single
`workingOnId` foreign key directly on `Puzzle`, making claiming exclusive:
one member at a time, with a 409 response if someone else already claimed
it. In practice, on a collaborative puzzle collection, several members
legitimately want to look at the same puzzle at once without blocking each
other, and the exclusivity check added friction without a corresponding
benefit.

## Decision

Replace the single `workingOnId` column with a `PuzzleWorker` join table
(many-to-many between `Puzzle` and `User`):

- `POST .../puzzles/:pid/claim` adds the current user as a worker; `DELETE`
  removes them. Both are idempotent from the caller's point of view and
  never return a 409 for a conflicting claim.
- `puzzle.repository.ts` exposes `addWorker`/`removeWorker` and includes the
  full `workers` list on every puzzle read, instead of a single nullable
  `workingOnId`.
- The service layer drops the exclusivity check on claim and the ownership
  check on unclaim: any member can claim, and any member can remove
  themselves (removing another member's claim is not exposed).

## Consequences

- Multiple members can claim the same puzzle simultaneously; the UI shows
  the full list of current workers as a signal, not a lock.
- The API's claim/unclaim endpoints are simpler: no conflict status code to
  handle on either the backend or frontend.
- The migration drops `workingOnId` from `Puzzle`; any external consumer of
  the old field would need to switch to reading the `workers` array.
