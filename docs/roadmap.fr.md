🇫🇷 Version française | [🇬🇧 English version](roadmap.md)

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

## Section 5 - Maintenance

- [x] FIX-001 - Corriger les failles de fast-jwt (confusion d'algorithme critique, JWT non signes, contournement des claims)
- [x] FIX-002 - Corriger les failles de severite haute (XSS vue-i18n et Vue SSR, DoS zod, busboy et source-map-js, vite)
- [x] FIX-003 - Corriger les failles de severite moyenne et basse (fast-uri, glob, vitest, fastify, fast-xml-parser, csv-parse, postcss-selector-parser)
- [x] CI-001 - Lancer la CI sur la PR du bot changelog pour que son auto-merge aboutisse
- [x] FIX-004 - Retirer upgrade-insecure-requests de la CSP de l'API (Swagger UI local vide)
- [x] CHORE-001 - Ajouter la configuration Dependabot (npm, docker, github-actions)
- [x] CHORE-002 - Passer vitest et @vitest/coverage-v8 en version 5
- [x] TEST-001 - Combler les trous de couverture par fichier (tous les fichiers api et web a 80 % ou plus, code mort supprime)
- [x] CHORE-004 - Charger un fichier d'environnement de test local pour les tests api et refuser les bases hors test
- [x] CHORE-003 - Migrer vers Prisma 7 (prisma.config.ts, driver adapter ; PR Dependabot #145)
- [x] CHORE-005 - Charger la config prod uniquement depuis shared/env (le backend charge secrets.env), supprimer l'interpolation via compose/.env
- [x] FIX-005 - Déployer les images taguées avec le SHA du commit plutôt que `latest` (`IMAGE_TAG` n'était jamais fixé)
- [x] CHORE-006 - Aligner le runtime Node sur la 26 LTS (CI, images Docker, engines, @types/node, docs)
- [x] CHORE-007 - Ignorer les majeures Prisma dans Dependabot jusqu'à la migration Prisma 7 (CHORE-003)
- [x] FIX-006 - Corriger l'alerte ReDoS de effect (haute, tirée par @prisma/config de Prisma 6)
- [x] CI-002 - Passer chaque GitHub Action sur sa majeure actuelle épinglée par SHA de commit, workflow changelog sur Node 26, groupe Dependabot actions unique
- [x] CI-003 - Renommer le workflow de déploiement en build-push-deploy.yml, deux jobs explicites (Build & push, Deploy), sans changement fonctionnel
- [x] CHORE-008 - Mettre à jour l'outillage frontend : TypeScript 6.0, Vite 8, Vue Router 5, vue-tsc 3, ESLint 10 avec eslint-plugin-vue 10
- [x] CI-004 - Relever le seuil de couverture de 80 % à 85 % (seuils et docs)
