[🇫🇷 Version française](user_guide.fr.md) | 🇬🇧 English version

---

# User guide

This guide covers using HiveMind to solve puzzle collections as a team:
creating a collection, inviting collaborators, tracking notes and attempts,
and importing puzzles in bulk.

## Getting started

1. Register with an email, username, and password.
2. Confirm your account via the verification link sent to your email before
   your first login.
3. Log in. Your session stays active for 15 minutes at a time, refreshed
   automatically in the background as long as you keep using the app.
4. Set your preferred language (EN/FR) from your account settings; it is saved
   and applied on every future login.

## Collections

A **Collection** groups the puzzles of a single hunt, series, or challenge
(a geocaching mystery series, a CTF, an escape room, a treasure hunt...).

1. Create a collection and give it a name.
2. Pick a **Template** for it, or use one of the system templates
   (`generic`, `geocaching`), to control which fields are active on its
   puzzles (coordinates, difficulty/terrain ratings, hint, spoiler, custom
   fields).
3. As the collection's **owner**, invite collaborators by email from the
   collection's member page. Invitees receive an email with direct accept/decline
   links; once accepted, they become **members** and can start working on
   puzzles.

## Roles

| Action | owner | member |
|---|:-:|:-:|
| Invite / remove members | yes | - |
| Delete collection, edit its config | yes | - |
| Add / edit / reorder puzzles | yes | - |
| Claim a puzzle, add notes and attempts | yes | yes |

An `admin_platform` role also exists at the platform level for managing
system templates; it isn't tied to a specific collection.

## Puzzles

- The owner adds puzzles to the collection, filling in whatever fields the
  collection's template exposes.
- Any member can **claim** a puzzle to signal they're working on it.
  Claiming is non-exclusive: several members can claim the same puzzle at
  once, so the team can see who's actively looking at what without blocking
  anyone.
- A puzzle's status (open, in progress, solved, verified) is updated as work
  progresses.

## Notes and attempts

- **Notes** are free-text, timestamped, and attributed to their author:
  use them for observations, hypotheses, or partial decodings. You can edit
  or delete your own notes; you cannot edit another member's.
- **Attempts** record a concrete value that was tried, with a pass/fail
  result and an optional comment. Attempts are immutable once recorded, kept
  in chronological order, so the team can see what has already been tried
  without re-testing it.
- If the puzzle has a **Checker URL** configured, an attempted value can be
  verified directly against that external checker.

## Importing puzzles

Instead of adding puzzles one by one, an owner can bulk-import them into a
collection:

- **GPX import**: uploads a GPX file and auto-populates puzzles from its
  waypoints (geocaching GC codes and coordinates).
- **CSV import**: uploads a CSV, previews its columns, and lets you map each
  column to a puzzle field before confirming the import.

## Tips

- The interactive API documentation is available at `/api/docs` in
  development, useful if you're scripting your own integrations.
- Switching language mid-session only affects the interface text; it doesn't
  translate collection content (puzzle names, notes, etc.), which stays as
  entered.
