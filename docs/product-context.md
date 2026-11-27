[🇫🇷 Version française](product-context.fr.md) | 🇬🇧 English version

---

# Product Context - HiveMind

## Concept

Puzzle collections are hard to solve alone, and a group chat loses track of who tried what. HiveMind gives a team one shared place per collection: who is working on which puzzle, what they observed, which values they already tested and with what result, until the final answer.

The domain is deliberately generic: geocaching mystery series, CTF challenges, escape room puzzles, treasure hunts, logic puzzle sets.

## Target user

Small teams of puzzle solvers (friends, clubs, CTF teams) working asynchronously on the same collection. One account per person, collaboration on invitation only. Platform admins only manage the system templates.

## Core vocabulary

| Term | Meaning |
|---|---|
| `collection` | A set of puzzles solved by one team, with its own members and template |
| `puzzle` | One enigma of a collection, with optional metadata (coordinates, difficulty/terrain, hint, spoiler, custom fields) |
| `note` | A per-author, timestamped free-text observation or hypothesis on a puzzle |
| `attempt` | An immutable record of a tested value, its pass/fail result and an optional comment |
| `template` | The set of fields a collection exposes on its puzzles (system templates: `generic`, `geocaching`) |
| `claim` | A member marking themselves as working on a puzzle; non-exclusive, several members can claim the same puzzle (see [ADR 0003](adr/0003-non-exclusive-puzzle-claiming.md)) |
| `owner` / `member` | Per-collection roles: the owner manages the collection and its invitations |

## Features

- **Collections and templates** - choose which puzzle fields are active per collection
- **Puzzles** - metadata, hint and spoiler, external checker URL to verify a value directly
- **Notes and attempts** - a shared, append-only history of what the team observed and tested
- **Collaboration** - email invitations with accept/decline links, non-exclusive claiming
- **Import** - GPX import that fills geocaching fields, CSV import with column-to-field mapping
- **Accounts** - mandatory email verification, JWT access token plus httpOnly refresh cookie
- **Bilingual UI** - English and French, per-user preference

## Non-goals

- Public or open collections: access is by invitation only
- Real-time chat or live co-editing: collaboration is asynchronous
- Solving or checking puzzles on behalf of the user: the checker URL points to an external tool
- Editing or deleting attempts: they stay an immutable record
