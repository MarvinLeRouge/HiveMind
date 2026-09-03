[🇬🇧 English](roadmap.md) | 🇫🇷 Français

# HiveMind - Feuille de route

[← Retour au README](../README.fr.md)

---

### V1 - Backend

- [x] BLOCK-01 · Depot & README
- [x] BLOCK-02 · Monorepo & outillage
- [x] BLOCK-03 · Stack Docker de developpement
- [x] BLOCK-04 · Schema de base de donnees & Prisma
- [x] BLOCK-05 · API d'authentification (register, login, refresh, logout)
- [x] BLOCK-06 · API Templates
- [x] BLOCK-07 · API Collections
- [x] BLOCK-08 · API Invitations
- [x] BLOCK-09 · API Puzzles
- [x] BLOCK-10 · API Notes & Tentatives
- [x] BLOCK-11 · Import GPX
- [x] BLOCK-12 · Import CSV
- [x] BLOCK-13 · Passe qualite backend (couverture, JSDoc, Swagger)
- [x] BLOCK-14 · GitHub Actions CI + scaffold CD

### V2 - Frontend

- [x] BLOCK-15 · Setup Vue 3 (routing, Pinia, Tailwind, ofetch)
- [x] BLOCK-16 · UI Authentification (login, register)
- [x] BLOCK-17 · UI Collections (liste, creation, invitation)
- [x] BLOCK-18 · UI Puzzles (tableau, detail, notes, tentatives)
- [x] BLOCK-19 · UI Template builder
- [x] BLOCK-20 · Passe qualite frontend (couverture, a11y, responsive)
- [x] BLOCK-21 · Integration CI frontend + finalisation CD

### Fonctionnalites post-V2

- [x] BLOCK-i18n · Multilinguisme FR/EN (vue-i18n, langue stockee par utilisateur)
- [x] BLOCK-invitation-email · Emails d'invitation SMTP (Nodemailer, NoopMailer en CI)
- [x] BLOCK-claim-workers · Prise en charge non exclusive (table de jointure PuzzleWorker)
- [x] BLOCK-test-isolation · Base de donnees de test dediee (`HiveMind_test` + `DATABASE_URL_TEST`)

### V3 - Qualite & Production

- [x] BLOCK-22 · Suite E2E Playwright (35 tests, Chromium)
- [x] BLOCK-23 · Deploiement production (VPS, Traefik, GHCR, CD SSH)
- [x] BLOCK-24 · Sauvegardes PostgreSQL automatisees (cron quotidien, rotation 7j + 4s)
- [x] BLOCK-25 · Securisation (audit OWASP Top 10, Helmet/CSP, rate limiting, invalidation JWT cote serveur, correctifs CVE)
- [x] BLOCK-26 · Polish design & UX (palette OKLCH accessible, dark mode, responsive mobile, etats vides, gestion d'erreurs, micro-interactions)
- [x] BLOCK-27 · Audit design (impeccable - score 14/20, tokens couleur semantiques OKLCH, focus WCAG ring-2, drag-and-drop clavier, motion accessible)
- [x] BLOCK-28 · Verification d'email a l'inscription (token SHA-256, SMTP Brevo, page /verify-email, renvoi du lien)
