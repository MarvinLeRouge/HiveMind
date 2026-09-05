🇫🇷 Version française | [🇬🇧 English version](README.md)

# HiveMind

> Une plateforme collaborative pour resoudre des collections d'enigmes de maniere asynchrone.

[![Statut](https://img.shields.io/badge/statut-production-brightgreen)](https://github.com/MarvinLeRouge/HiveMind)
[![CI](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml)
[![E2E](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml)
[![CD](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml)
[![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev)
[![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)
[![Backend coverage](https://img.shields.io/codecov/c/github/MarvinLeRouge/HiveMind/main?flag=backend&label=backend&logo=codecov)](https://app.codecov.io/gh/MarvinLeRouge/HiveMind)
[![Frontend coverage](https://img.shields.io/codecov/c/github/MarvinLeRouge/HiveMind/main?flag=frontend&label=frontend&logo=codecov)](https://app.codecov.io/gh/MarvinLeRouge/HiveMind)

---

## Concept

Les collections d'enigmes sont difficiles a resoudre seul. HiveMind permet a une equipe de les attaquer ensemble - en suivant qui travaille sur quoi, en consignant les observations et les tentatives de solution, et en progressant vers une reponse finale.

Le domaine est intentionnellement generique : series de mysteres en geocaching, defis CTF, puzzles d'escape room, chasses au tresor, ensembles de puzzles logiques - toute collection d'enigmes qui beneficie d'un suivi collaboratif.

Chaque **Collection** contient des **Puzzles**. Chaque puzzle peut recevoir des **Notes** libres (observations, hypotheses) et des **Tentatives** (valeurs concretes testees contre une URL de verification optionnelle). Un systeme de **Templates** flexible permet a chaque collection d'exposer uniquement les champs pertinents pour son type d'enigme.

---

## Chiffres cles

| Metrique | Valeur |
|----------|--------|
| Endpoints API | 43 (auth, templates, collections, invitations, puzzles, notes, tentatives, import) |
| Couverture de tests backend | >= 97 % |
| Couverture de tests frontend | >= 92 % |
| Langues | FR, EN (preference par utilisateur) |
| Tests E2E | 35 (auth, collections, puzzles, notes, tentatives, import) |

---

## Fonctionnalites

- **Collections** - creer et nommer une collection d'enigmes, configurer les champs actifs
- **Puzzles** - ajouter des puzzles avec metadonnees optionnelles : coordonnees, difficulte/terrain, indice, spoiler, champs personnalises
- **Notes** - observations libres par auteur, horodatees, sur chaque puzzle
- **Tentatives** - enregistrements immuables de valeurs testees, avec resultat succes/echec et commentaire optionnel
- **Checker URL** - associer un lien de verification externe a un puzzle ; les valeurs tentees peuvent etre verifiees directement
- **Templates** - definir quels champs sont actifs sur les puzzles ; templates systeme fournis (`generic`, `geocaching`)
- **Collaboration** - inviter des membres par email ; les invites recoivent un email avec des liens directs pour accepter ou decliner
- **Prise en charge non exclusive** - plusieurs membres peuvent se declarer en train de travailler sur le meme puzzle simultanement
- **Roles** - roles `owner` et `member` par collection ; les admins plateforme gerent les templates systeme
- **Interface multilingue** - FR/EN ; la preference de langue est stockee par utilisateur et synchronisee entre les sessions
- **Import GPX** - importer une pocket query Geocaching pour peupler automatiquement les puzzles avec coordonnees, difficulte, terrain et codes GC
- **Import CSV** - importer un tableur avec mapping flexible colonne vers champ
- **Verification d'email** - activation du compte requise avant le premier login ; lien de verification envoye via Brevo SMTP
- **Auth JWT** - access token (15 min) + cookie httpOnly de refresh (7 jours)
- **Swagger UI** - documentation API interactive auto-generee sur `/docs` (developpement uniquement ; desactive en production)

---

## Stack technique

| Couche | Technologie | |
|--------|-------------|--|
| Gestionnaire de paquets | pnpm workspaces | [![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm)](https://pnpm.io) |
| Runtime | Node.js 20 LTS | [![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org) |
| Backend | Fastify 5 + TypeScript | [![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev) |
| Validation | Zod + fastify-type-provider-zod | [![Zod](https://img.shields.io/badge/zod-3-3e67b1)](https://zod.dev) |
| ORM | Prisma 6 | [![Prisma](https://img.shields.io/badge/prisma-6-2d3748?logo=prisma)](https://prisma.io) |
| Base de donnees | PostgreSQL 16 | [![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org) |
| Auth | JWT + cookie httpOnly | |
| Docs API | @fastify/swagger + Swagger UI | |
| Frontend | Vue 3 + Vite + Vue Router + Pinia | [![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org) |
| UI | Tailwind CSS + shadcn-vue | [![Tailwind](https://img.shields.io/badge/tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com) |
| i18n | vue-i18n v9 (FR + EN) | |
| Client HTTP | ofetch | |
| Tests backend | Vitest + fastify.inject() | [![Vitest](https://img.shields.io/badge/vitest-3-6e9f18?logo=vitest)](https://vitest.dev) |
| Tests frontend | Vitest + Vue Test Utils | |
| Tests E2E | Playwright | [![Playwright](https://img.shields.io/badge/playwright-1-2ead33?logo=playwright)](https://playwright.dev) |
| Linting | ESLint + Prettier | |
| Pre-commit | Husky + lint-staged | |
| CI/CD | GitHub Actions | [![GitHub Actions](https://img.shields.io/badge/github%20actions-2088ff?logo=github-actions)](https://github.com/features/actions) |
| Conteneurs | Docker Compose | [![Docker](https://img.shields.io/badge/docker-compose-2496ed?logo=docker)](https://docs.docker.com/compose/) |
| Registre | GitHub Container Registry (GHCR) | |
| Production | VPS + Traefik + Let's Encrypt | |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.fr.md) | Structure du depot, couches backend, structure frontend, roles |
| [Endpoints API](docs/api/api_endpoints.fr.md) | Reference complete des endpoints, groupes par domaine |
| [Tests](docs/testing.fr.md) | Configuration et commandes des tests backend, frontend et E2E |
| [Operations](docs/operations.fr.md) | Installation locale, Docker, pipeline CI/CD, deploiement, sauvegarde |
| [Feuille de route](docs/roadmap.fr.md) | Blocs completes de V1 a V3 |
| [Design system](docs/design-system.fr.md) | Tokens OKLCH, dark mode, patterns d'accessibilite |
| [Contribuer](CONTRIBUTING.fr.md) | Comment contribuer, conventions de branches et commits |
| [Securite](SECURITY.fr.md) | Divulgation responsable et mesures de securite |
| [Changelog](CHANGELOG.md) | Genere automatiquement depuis l'historique Conventional Commits |

---

## A propos

HiveMind est un projet portfolio concu pour explorer et demontrer le developpement full-stack avec un ecosysteme Node.js moderne : Fastify pour une API performante et fortement typee, Prisma pour un acces ergonomique a la base de donnees, Vue 3 pour un frontend reactif, et GitHub Actions pour un pipeline CI/CD de qualite production.

La securite a ete traitee comme une contrainte de premier ordre : le code a fait l'objet d'un audit OWASP Top 10 ayant abouti a des en-tetes HTTP de securite (Helmet, CSP), un rate limiting sur les endpoints sensibles, une invalidation cote serveur des refresh tokens et des correctifs CVE cibles sur les dependances transitives. La verification d'email est imposee a l'inscription pour limiter les risques d'enumeration de comptes et de spam.

La qualite du design a fait l'objet de deux passes : un sprint de polish (BLOCK-26) centre sur une palette OKLCH accessible, le dark mode et la mise en page mobile ; puis un audit formel avec le framework impeccable (BLOCK-27, score 14/20) ayant produit des tokens couleur semantiques, des anneaux de focus conformes WCAG, un drag-and-drop accessible au clavier et le support de prefers-reduced-motion.

Le projet a ete concu avec un usage reel en tete - specifiquement les series de mysteres en geocaching collaboratif - mais le modele de domaine est intentionnellement generique et applicable a toute collection d'enigmes.

---

## Licence

[MIT](LICENSE) - Jean Ceugniet
