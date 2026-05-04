[🇬🇧 English](README.md) | 🇫🇷 Français

# HiveMind

> Une plateforme collaborative pour résoudre des collections d'énigmes de manière asynchrone.

[![Statut](https://img.shields.io/badge/statut-en%20développement-yellow)](https://github.com/MarvinLeRouge/HiveMind)
[![CI](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml)
[![E2E](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml)
[![CD](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml)
[![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev)
[![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)
[![Codecov backend](https://codecov.io/gh/MarvinLeRouge/HiveMind/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/MarvinLeRouge/HiveMind)
[![Codecov frontend](https://codecov.io/gh/MarvinLeRouge/HiveMind/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/MarvinLeRouge/HiveMind)

---

## Concept

Les collections d'énigmes sont difficiles à résoudre seul. HiveMind permet à une équipe de les attaquer ensemble — en suivant qui travaille sur quoi, en consignant les observations et les tentatives de solution, et en progressant vers une réponse finale.

Le domaine est intentionnellement générique : séries de mystères en géocaching, défis CTF, puzzles d'escape room, chasses au trésor, ensembles de puzzles logiques — toute collection d'énigmes qui bénéficie d'un suivi collaboratif.

Chaque **Collection** contient des **Puzzles**. Chaque puzzle peut recevoir des **Notes** libres (observations, hypothèses) et des **Tentatives** (valeurs concrètes testées contre une URL de vérification optionnelle). Un système de **Templates** flexible permet à chaque collection d'exposer uniquement les champs pertinents pour son type d'énigme.

---

## Chiffres clés

| Métrique | Valeur |
|----------|--------|
| Endpoints API | — |
| Couverture de tests backend | — |
| Couverture de tests frontend | — |
| Fichiers de specs E2E | — |

---

## Fonctionnalités

- **Collections** — créer et nommer une collection d'énigmes, configurer les champs actifs
- **Puzzles** — ajouter des puzzles avec métadonnées optionnelles : coordonnées, difficulté/terrain, indice, spoiler, champs personnalisés
- **Notes** — observations libres par auteur, horodatées, sur chaque puzzle
- **Tentatives** — enregistrements immuables de valeurs testées, avec résultat succès/échec et commentaire optionnel
- **Checker URL** — associer un lien de vérification externe à un puzzle ; les valeurs tentées peuvent être vérifiées directement
- **Templates** — définir quels champs sont actifs sur les puzzles ; templates système fournis (`generic`, `geocaching`)
- **Collaboration** — inviter des membres par email ; le propriétaire contrôle l'accès, les membres contribuent notes et tentatives
- **Rôles** — rôles `owner` et `member` par collection ; les admins plateforme gèrent les templates système
- **Import GPX** — importer une pocket query Geocaching pour peupler automatiquement les puzzles avec coordonnées, difficulté, terrain et codes GC
- **Import CSV** — importer un tableur avec mapping flexible colonne → champ
- **Auth JWT** — access token (15 min) + cookie httpOnly de refresh (7 jours)
- **Swagger UI** — documentation API interactive auto-générée sur `/docs`

---

## Architecture

```
HiveMind/
├── apps/
│   ├── api/                    # Backend Fastify 5
│   │   ├── src/
│   │   │   ├── routes/         # Définitions de routes + schémas Zod
│   │   │   ├── controllers/    # Gestion requêtes/réponses
│   │   │   ├── services/       # Logique métier
│   │   │   ├── repositories/   # Accès données Prisma
│   │   │   ├── middlewares/    # authenticate, requireMember, requireOwner
│   │   │   ├── plugins/        # Plugins Fastify (swagger, jwt, cors, cookie)
│   │   │   └── types/          # Types TypeScript locaux
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   │       ├── unit/           # Tests services (repositories mockés)
│   │       └── integration/    # Tests endpoints via fastify.inject()
│   └── web/                    # Frontend Vue 3
│       ├── src/
│       │   ├── pages/          # Composants de niveau route
│       │   ├── components/     # Composants UI réutilisables (shadcn-vue)
│       │   ├── stores/         # Stores Pinia
│       │   ├── router/         # Vue Router + garde d'authentification
│       │   ├── composables/    # Fonctions de composition partagées
│       │   └── types/          # Types TypeScript locaux
│       └── tests/
├── packages/
│   └── shared/                 # Types TypeScript + schémas Zod partagés
│       └── src/
│           ├── schemas/        # Schémas Zod partagés entre api et web
│           └── types/          # Types TypeScript inférés des schémas
├── .github/workflows/
│   ├── ci.yml                  # Lint + tests unitaires + intégration
│   ├── e2e.yml                 # E2E Playwright (conditionne le CD)
│   └── build-deploy.yml        # Build images + déploiement VPS
├── docker-compose.yml          # Stack de dev (hot reload)
├── docker-compose.prod.yml     # Stack de prod (labels Traefik)
└── pnpm-workspace.yaml
```

### Backend — architecture en couches

Les controllers sont minces : toute la logique métier se trouve dans les services. Les repositories gèrent tous les appels Prisma sans exposer de logique métier.

### Frontend — Vue 3 Composition API

Les pages délèguent aux stores Pinia. Les composants sont réutilisables et basés sur shadcn-vue. Le client ofetch gère les en-têtes JWT et le refresh silencieux du token sur les 401.

---

## Tests

### Backend

```bash
pnpm --filter api test              # Lancer tous les tests
pnpm --filter api test:coverage     # Avec rapport de couverture (cible ≥ 80 %)
```

- **Tests unitaires** — `apps/api/tests/unit/` — logique des services, repositories mockés
- **Tests d'intégration** — `apps/api/tests/integration/` — instance Fastify réelle via `fastify.inject()`
- Chaque endpoint est testé pour le cas nominal + scénarios 401/403/404

### Frontend

```bash
pnpm --filter web test              # Lancer tous les tests
pnpm --filter web test:coverage     # Avec rapport de couverture (cible ≥ 80 %)
```

- Environnement JSDOM, Vue Test Utils
- Composants, composables et stores Pinia testés

### E2E — Playwright *(V3)*

```bash
pnpm test:e2e       # Nécessite la stack Docker complète en cours d'exécution
```

Fichiers de specs dans `e2e/` à la racine du monorepo. Chromium uniquement. Exécuté contre la stack Docker complète.

---

## CI/CD

### Pre-commit (automatique à chaque `git commit`)

Husky + lint-staged :

- Fichiers stagés `*.{ts,vue}` → `eslint --fix` → `prettier --write`
- Le commit est bloqué si le lint ne peut pas auto-corriger

### Workflow CI (`ci.yml`)

Déclenché sur push + PR vers `main`. Ignore `docs/**` et `**.md`.

| Job | Étapes |
|-----|--------|
| `backend` | lint → Vitest unitaire → Vitest intégration → Codecov |
| `frontend` | lint → Vitest → Codecov |

### Workflow E2E (`e2e.yml`)

Déclenché sur push vers `main` + `workflow_dispatch`. Démarre la stack Docker, exécute les migrations et le seed, lance la suite Playwright. **Conditionne le workflow CD** via `workflow_run`.

### Workflow CD (`build-deploy.yml`)

Déclenché par le succès E2E ou `workflow_dispatch` (contournement hotfix).

1. Résolution du SHA du commit
2. Build et push des images `backend` + `frontend` vers GHCR (tags `sha-xxxxxxx` + `latest`)
3. Déploiement SSH : récupération de `docker-compose.prod.yml` au SHA exact, pull des images, `docker compose up -d --remove-orphans`, `prisma migrate deploy`

---

## Docker

| Service | Description | Port |
|---------|-------------|------|
| `backend` | API Fastify avec hot reload (dev) | 3000 |
| `frontend` | Serveur Vite dev / Nginx (prod) | 5173 |
| `db` | PostgreSQL 16 avec volume nommé `pgdata` | 5432 |

```bash
# Démarrer la stack de développement complète
docker compose up -d

# Suivre tous les logs
docker compose logs -f

# Suivre uniquement les logs backend
docker compose logs -f api

# Arrêter et supprimer les conteneurs
docker compose down
```

---

## Endpoints API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /auth/register | — | Créer un compte |
| POST | /auth/login | — | Obtenir un access token + cookie |
| POST | /auth/refresh | — | Rotation des tokens depuis le cookie |
| POST | /auth/logout | ✓ | Effacer le cookie de refresh |
| GET | /auth/me | ✓ | Retourner l'utilisateur courant |
| GET | /templates | ✓ | Lister les templates |
| POST | /templates | ✓ | Créer un template utilisateur |
| PATCH | /templates/:id | ✓ | Modifier son propre template |
| DELETE | /templates/:id | ✓ | Supprimer son propre template |
| GET | /collections | ✓ | Lister mes collections |
| POST | /collections | ✓ | Créer une collection |
| GET | /collections/:id | ✓ membre | Obtenir une collection |
| PATCH | /collections/:id | ✓ owner | Modifier une collection |
| DELETE | /collections/:id | ✓ owner | Supprimer une collection |
| GET | /collections/:id/members | ✓ membre | Lister les membres |
| DELETE | /collections/:id/members/:userId | ✓ owner | Retirer un membre |
| POST | /collections/:id/invitations | ✓ owner | Envoyer une invitation |
| GET | /invitations/:id | ✓ | Obtenir une invitation |
| POST | /invitations/:id/accept | ✓ | Accepter une invitation |
| POST | /invitations/:id/decline | ✓ | Décliner une invitation |
| GET | /collections/:id/puzzles | ✓ membre | Lister les puzzles |
| POST | /collections/:id/puzzles | ✓ owner | Créer un puzzle |
| GET | /collections/:id/puzzles/:pid | ✓ membre | Obtenir un puzzle |
| PATCH | /collections/:id/puzzles/:pid | ✓ membre | Modifier un puzzle |
| DELETE | /collections/:id/puzzles/:pid | ✓ owner | Supprimer un puzzle |
| PATCH | /collections/:id/puzzles/reorder | ✓ owner | Réordonner en masse |
| POST | /collections/:id/puzzles/:pid/claim | ✓ membre | Réclamer un puzzle |
| DELETE | /collections/:id/puzzles/:pid/claim | ✓ membre | Libérer un puzzle |
| GET | /puzzles/:pid/notes | ✓ membre | Lister les notes |
| POST | /puzzles/:pid/notes | ✓ membre | Ajouter une note |
| PATCH | /puzzles/:pid/notes/:nid | ✓ auteur | Modifier sa note |
| DELETE | /puzzles/:pid/notes/:nid | ✓ auteur | Supprimer sa note |
| GET | /puzzles/:pid/attempts | ✓ membre | Lister les tentatives |
| POST | /puzzles/:pid/attempts | ✓ membre | Ajouter une tentative |
| POST | /collections/:id/import/gpx | ✓ owner | Importer un fichier GPX |
| POST | /collections/:id/import/csv/preview | ✓ owner | Prévisualiser les colonnes CSV |
| POST | /collections/:id/import/csv | ✓ owner | Importer un CSV avec mapping |

---

## Installation

### Prérequis

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose

### Développement local

```bash
# Cloner le dépôt
git clone https://github.com/MarvinLeRouge/HiveMind.git
cd HiveMind

# Installer les dépendances
pnpm install

# Copier les fichiers d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Démarrer la stack complète (backend · frontend · base de données)
docker compose up -d

# Appliquer les migrations et peupler la base de données
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed

# L'application est maintenant accessible :
#   API :          http://localhost:3000
#   Swagger UI :   http://localhost:3000/docs
#   Frontend :     http://localhost:5173
```

---

## Stack technique

| Couche | Technologie | |
|--------|-------------|--|
| Gestionnaire de paquets | pnpm workspaces | [![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm)](https://pnpm.io) |
| Runtime | Node.js 20 LTS | [![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org) |
| Backend | Fastify 5 + TypeScript | [![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev) |
| Validation | Zod + fastify-type-provider-zod | [![Zod](https://img.shields.io/badge/zod-3-3e67b1)](https://zod.dev) |
| ORM | Prisma 6 | [![Prisma](https://img.shields.io/badge/prisma-6-2d3748?logo=prisma)](https://prisma.io) |
| Base de données | PostgreSQL 16 | [![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org) |
| Auth | JWT + cookie httpOnly | |
| Docs API | @fastify/swagger + Swagger UI | |
| Frontend | Vue 3 + Vite + Vue Router + Pinia | [![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org) |
| UI | Tailwind CSS + shadcn-vue | [![Tailwind](https://img.shields.io/badge/tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com) |
| Client HTTP | ofetch | |
| Tests backend | Vitest + fastify.inject() | [![Vitest](https://img.shields.io/badge/vitest-2-6e9f18?logo=vitest)](https://vitest.dev) |
| Tests frontend | Vitest + Vue Test Utils | |
| Tests E2E | Playwright | [![Playwright](https://img.shields.io/badge/playwright-1-2ead33?logo=playwright)](https://playwright.dev) |
| Linting | ESLint + Prettier | |
| Pre-commit | Husky + lint-staged | |
| CI/CD | GitHub Actions | [![GitHub Actions](https://img.shields.io/badge/github%20actions-2088ff?logo=github-actions)](https://github.com/features/actions) |
| Conteneurs | Docker Compose | [![Docker](https://img.shields.io/badge/docker-compose-2496ed?logo=docker)](https://docs.docker.com/compose/) |
| Registre | GitHub Container Registry (GHCR) | |
| Production | VPS + Traefik + Let's Encrypt | |

---

## Feuille de route

### V1 — Backend

- [x] BLOCK-01 · Dépôt & README
- [x] BLOCK-02 · Monorepo & outillage
- [x] BLOCK-03 · Stack Docker de développement
- [x] BLOCK-04 · Schéma de base de données & Prisma
- [x] BLOCK-05 · API d'authentification (register, login, refresh, logout)
- [x] BLOCK-06 · API Templates
- [x] BLOCK-07 · API Collections
- [x] BLOCK-08 · API Invitations
- [x] BLOCK-09 · API Puzzles
- [x] BLOCK-10 · API Notes & Tentatives
- [x] BLOCK-11 · Import GPX
- [x] BLOCK-12 · Import CSV
- [x] BLOCK-13 · Passe qualité backend (couverture, JSDoc, Swagger)
- [x] BLOCK-14 · GitHub Actions CI + scaffold CD

### V2 — Frontend

- [ ] BLOCK-15 · Setup Vue 3 (routing, Pinia, Tailwind, ofetch)
- [ ] BLOCK-16 · UI Authentification (login, register)
- [ ] BLOCK-17 · UI Collections (liste, création, invitation)
- [ ] BLOCK-18 · UI Puzzles (tableau, détail, notes, tentatives)
- [ ] BLOCK-19 · UI Template builder
- [ ] BLOCK-20 · Passe qualité frontend (couverture, a11y, responsive)
- [ ] BLOCK-21 · Intégration CI frontend + finalisation CD

### V3 — Qualité & Production

- [ ] BLOCK-22 · Suite E2E Playwright
- [ ] BLOCK-23 · Déploiement production (Traefik, GHCR, SSH)
- [ ] BLOCK-24 · Sauvegardes PostgreSQL automatisées

---

## À propos

HiveMind est un projet portfolio conçu pour explorer et démontrer le développement full-stack avec un écosystème Node.js moderne : Fastify pour une API performante et fortement typée, Prisma pour un accès ergonomique à la base de données, Vue 3 pour un frontend réactif, et GitHub Actions pour un pipeline CI/CD de qualité production.

Le projet a été conçu avec un usage réel en tête — spécifiquement les séries de mystères en géocaching collaboratif — mais le modèle de domaine est intentionnellement générique et applicable à toute collection d'énigmes.

---

## Licence

[MIT](LICENSE) — Jean Ceugniet
