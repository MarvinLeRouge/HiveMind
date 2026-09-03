[🇬🇧 English](architecture.md) | 🇫🇷 Français

# HiveMind - Architecture

[← Retour au README](../README.fr.md)

---

## Structure du depot

```
HiveMind/
├── apps/
│   ├── api/                    # Backend Fastify 5
│   │   ├── src/
│   │   │   ├── routes/         # Definitions de routes + schemas Zod
│   │   │   ├── controllers/    # Gestion requetes/reponses
│   │   │   ├── services/       # Logique metier
│   │   │   ├── repositories/   # Acces donnees Prisma
│   │   │   ├── middlewares/    # authenticate, requireMember, requireOwner
│   │   │   ├── plugins/        # Plugins Fastify (swagger, jwt, cors, cookie, multipart, helmet, rate-limit)
│   │   │   └── types/          # Types TypeScript locaux
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   │       ├── unit/           # Tests services (repositories mockes)
│   │       └── integration/    # Tests endpoints via fastify.inject()
│   └── web/                    # Frontend Vue 3
│       ├── src/
│       │   ├── pages/          # Composants de niveau route
│       │   ├── components/     # Composants UI reutilisables (shadcn-vue)
│       │   ├── stores/         # Stores Pinia
│       │   ├── router/         # Vue Router + garde d'authentification
│       │   ├── composables/    # Fonctions de composition partagees
│       │   ├── i18n/           # Configuration vue-i18n + fichiers de locale FR/EN
│       │   └── types/          # Types TypeScript locaux
│       └── tests/
├── packages/
│   └── shared/                 # Types TypeScript + schemas Zod partages
│       └── src/
│           ├── schemas/        # Schemas Zod partages entre api et web
│           └── types/          # Types TypeScript inferes des schemas
├── .github/workflows/
│   ├── ci.yml                  # Lint + tests unitaires + integration + Codecov
│   ├── e2e.yml                 # E2E Playwright (35 tests, Chromium, gate CD)
│   └── build-deploy.yml        # Build images + deploiement VPS
├── docker-compose.yml          # Stack de dev (hot reload)
├── docker-compose.prod.yml     # Stack de prod (labels Traefik)
└── pnpm-workspace.yaml
```

---

## Backend - architecture en couches

Les controllers sont minces : toute la logique metier se trouve dans les services. Les repositories gerent tous les appels Prisma sans exposer de logique metier.

```
apps/api/src/
├── routes/        # Definitions de routes + schemas Zod (entree + sortie)
├── controllers/   # Gestion requetes/reponses - delegue aux services
├── services/      # Logique metier - aucun appel Prisma ici
├── repositories/  # Acces donnees Prisma - aucune logique metier ici
├── middlewares/   # authenticate, requireMember, requireOwner
├── plugins/       # Plugins Fastify : swagger, jwt, cookie, cors, multipart, helmet, rate-limit
└── types/         # Types TypeScript locaux
```

**Format des erreurs :** toutes les erreurs API suivent `{ error: string, message: string, statusCode: number }`.

**Variables d'environnement** validees via Zod au demarrage ; le processus s'arrete avec un message clair si une variable requise est absente.

---

## Frontend - Vue 3 Composition API

Les pages delegent aux stores Pinia. Les composants sont reutilisables et bases sur shadcn-vue. Le client ofetch gere les en-tetes JWT et le refresh silencieux du token sur les 401.

```
apps/web/src/
├── pages/         # Composants de niveau route
├── components/    # Composants UI reutilisables (bases sur shadcn-vue)
├── stores/        # Stores Pinia (useAuthStore, useCollectionStore, etc.)
├── router/        # Vue Router + garde d'authentification
├── composables/   # Fonctions de composition partagees
├── i18n/          # Configuration vue-i18n + fichiers de locale FR/EN
└── types/         # Types TypeScript locaux
```

---

## Package partage

```
packages/shared/src/
├── schemas/       # Schemas Zod partages entre api et web
└── types/         # Types TypeScript inferes des schemas Zod
```

---

## Roles et permissions

| Action | admin_platform | owner | membre |
|---|:-:|:-:|:-:|
| Gerer les templates systeme | oui | - | - |
| Creer une collection | oui | oui | oui |
| Inviter des membres | oui | oui | - |
| Supprimer une collection | oui | oui | - |
| Modifier la config d'une collection | oui | oui | - |
| Ajouter / modifier / reordonner les puzzles | oui | oui | - |
| Revendiquer un puzzle (travailler dessus) | oui | oui | oui |
| Ajouter une note | oui | oui | oui |
| Ajouter une tentative | oui | oui | oui |
| Changer le statut d'un puzzle | oui | oui | oui |

Le role d'un utilisateur est par collection (`CollectionMember.role`). `User.isAdmin = true` confere les droits `admin_platform` globalement.
