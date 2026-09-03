🇬🇧 English | [🇫🇷 Français](design-system.fr.md)

# HiveMind - Design System

[← Back to README](../README.md)

---

## Overview

HiveMind's design language is built on three constraints: the interface recedes behind the puzzle, information density is assumed, and collaboration is read in structure rather than decoration.

The system was shaped over two passes:

- **BLOCK-26** - accessible OKLCH palette, dark mode, mobile-responsive layout, empty states, error boundaries, micro-interactions
- **BLOCK-27** - formal impeccable audit (score 14/20), producing semantic color tokens, WCAG ring-2 focus rings, keyboard-accessible drag-and-drop, and `prefers-reduced-motion` support

Foundation: Tailwind CSS + shadcn-vue. Custom tokens extend the shadcn token layer; they do not replace it.

---

## Brand personality

Sober, precise, collaborative. The interface steps aside so the puzzle can take center stage - no decorations, no gamification, no analytics dashboard. Information density is a feature, not a problem. Collaboration shows in structure (who does what, when), not in UI chrome.

**Anti-references:**
- The default shadcn-vue starter (generic SaaS blue, no identity)
- Aggressive gamification (badges, leaderboards, XP)
- Heavy corporate dashboards (Jira, SharePoint)

---

## Color tokens

Tokens are defined in `apps/web/src/assets/main.css` using CSS custom properties, in OKLCH for perceptual consistency. The same variable names apply in both light and dark mode; values are swapped via the `.dark` selector.

### Base palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | oklch(1 0 0) | oklch(0.13 0.015 250) | Page background |
| `--foreground` | oklch(0.13 0.015 250) | oklch(0.96 0.005 250) | Primary text |
| `--card` | oklch(1 0 0) | oklch(0.17 0.012 250) | Card surfaces |
| `--muted` | oklch(0.95 0.005 250) | oklch(0.22 0.01 250) | Subdued backgrounds |
| `--muted-foreground` | oklch(0.5 0.02 250) | oklch(0.65 0.02 250) | Secondary text |
| `--border` | oklch(0.9 0.01 250) | oklch(0.28 0.015 250) | Borders, dividers |
| `--input` | oklch(0.9 0.01 250) | oklch(0.28 0.015 250) | Input borders |
| `--ring` | oklch(0.62 0.19 250) | oklch(0.62 0.19 250) | Focus rings |

### Brand colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | oklch(0.62 0.19 250) | CTA buttons, links, active states |
| `--primary-foreground` | oklch(1 0 0) | Text on primary background |
| `--secondary` | oklch(0.95 0.005 250) | Secondary buttons, tags |
| `--secondary-foreground` | oklch(0.13 0.015 250) | Text on secondary background |
| `--accent` | oklch(0.95 0.005 250) | Hover states |
| `--destructive` | oklch(0.55 0.22 27) | Destructive actions, errors |

### Semantic status tokens

Puzzle status colors use semantic tokens rather than raw Tailwind utilities, ensuring dark mode compatibility.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--status-open` | oklch(0.62 0.19 250) | oklch(0.62 0.19 250) | Open puzzles |
| `--status-open-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |
| `--status-progress` | oklch(0.75 0.15 80) | oklch(0.72 0.15 80) | In-progress puzzles |
| `--status-progress-foreground` | oklch(0.2 0.05 80) | oklch(0.95 0.02 80) | - |
| `--status-solved` | oklch(0.65 0.17 145) | oklch(0.62 0.17 145) | Solved puzzles |
| `--status-solved-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |
| `--status-verified` | oklch(0.55 0.18 145) | oklch(0.52 0.18 145) | Verified puzzles |
| `--status-verified-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |

---

## Typography

Base font: system-ui stack (no custom font loaded - keeps the interface fast and legible across devices).

| Role | Class | Notes |
|------|-------|-------|
| Page headings | `text-2xl font-bold tracking-tight` | Collection and puzzle titles |
| Section headings | `text-lg font-semibold` | Panel headers |
| Body text | `text-sm` | Default for most content |
| Muted / secondary | `text-sm text-muted-foreground` | Timestamps, labels, hints |
| Monospace | `font-mono text-sm` | GC codes, coordinates, attempt values |

---

## Spacing and layout

- Base unit: Tailwind's 4px scale (`1 = 4px`).
- Content max-width: `max-w-7xl mx-auto` on main views.
- Card padding: `p-6` on desktop, `p-4` on mobile.
- Section gap: `gap-4` (16px) between related items, `gap-6` (24px) between sections.

---

## Components

### Buttons

Primary action buttons use `h-11` (44px) on mobile to meet WCAG 2.5.5. On desktop, `h-9` (36px) is acceptable. Use `focus-visible:ring-2` throughout - never `focus:ring-1`.

```html
<!-- Primary -->
<button class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm
               font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90
               disabled:cursor-not-allowed disabled:opacity-50
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  Action
</button>
```

### Focus rings

All interactive elements use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. The `focus-visible` pseudo-class ensures rings appear only for keyboard navigation, not mouse clicks.

### PuzzleStatusBadge

Uses semantic status tokens - never raw Tailwind color utilities.

```html
<span :class="`bg-[--status-${status}] text-[--status-${status}-foreground]`">
  {{ t(`puzzle.status.${status}`) }}
</span>
```

### Drag-and-drop (puzzle reordering)

Keyboard-accessible: `[draggable="true"]` elements also respond to arrow keys. Move handlers call the same reorder logic as pointer drag. `aria-grabbed` and `aria-dropeffect` are set on drag start.

---

## Motion

Animations respect `prefers-reduced-motion`. All transitions use the pattern:

```css
@media (prefers-reduced-motion: no-preference) {
  .animate-something {
    transition: transform 150ms ease, opacity 150ms ease;
  }
}
```

Micro-interactions (button hover, card lift, tab indicator slide) use `duration-150` or `duration-200`. No animation exceeds `300ms`.

---

## Dark mode

Dark mode is toggled via the `.dark` class on `<html>`. The preference is stored in `localStorage` and applied before first paint to avoid flash.

All color tokens have dark-mode overrides defined in `.dark { ... }` in `main.css`. Components use only token-based classes - no hardcoded light/dark conditionals in Vue templates.

---

## Accessibility baseline

| Requirement | Implementation |
|---|---|
| Color contrast | All text/background combinations target WCAG AA (4.5:1 for body, 3:1 for large text) |
| Focus indicators | `focus-visible:ring-2` on all interactive elements; ring offset ensures visibility on any background |
| Touch targets | `h-11` (44px) minimum on mobile - meets WCAG 2.5.5 |
| Screen reader labels | `aria-label` on icon-only buttons; `role="alert"` on error messages; `aria-hidden` on decorative SVGs |
| Keyboard navigation | All interactive elements reachable via Tab; drag-and-drop lists support arrow keys |
| Reduced motion | All transitions wrapped in `prefers-reduced-motion: no-preference` |
| Page titles | `document.title` updated on every route change via `router.afterEach` |
