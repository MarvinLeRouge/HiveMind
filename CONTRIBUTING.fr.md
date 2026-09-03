[🇬🇧 English](CONTRIBUTING.md) | 🇫🇷 Français

# Contribuer a HiveMind

---

## Prerequis

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose

---

## Installation locale

```bash
git clone https://github.com/MarvinLeRouge/HiveMind.git
cd HiveMind
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Voir [docs/operations.fr.md](docs/operations.fr.md) pour les details complets sur la stack locale, les commandes Docker et le deploiement en production.

---

## Nommage des branches

| Prefixe | Quand l'utiliser |
|---------|-----------------|
| `feat/` | Nouvelle fonctionnalite |
| `fix/` | Correction de bug |
| `chore/` | Outillage, config, mise a jour de dependances |
| `docs/` | Documentation uniquement |
| `refactor/` | Restructuration du code sans changement de comportement |
| `test/` | Ajout ou correction de tests |

Utiliser le kebab-case minuscule. Exemple : `feat/puzzle-checker-url`, `fix/invite-email-encoding`.

---

## Format des commits

Suivre [Conventional Commits](https://www.conventionalcommits.org/). Chaque commit doit inclure une section `Modified files:` listant les fichiers touches.

```
<type>(<scope optionnel>): <courte description en mode imperatif, minuscule, sans point final>

Modified files:
- path/to/file-a.ts — ce qui a ete modifie
- path/to/file-b.vue — ce qui a ete modifie
```

Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`.

Exemple :

```
feat(api): add puzzle checker URL validation

Modified files:
- apps/api/src/services/puzzle.service.ts — validate checkerUrl format
- apps/api/tests/unit/puzzle.service.test.ts — add validation tests
```

---

## Conventions de code

- **TypeScript strict mode** - pas de `any`, pas de `@ts-ignore`
- **Schemas Zod** - chaque route Fastify doit avoir un schema d'entree et de sortie
- **JSDoc** - chaque fonction, classe et type exporte doit avoir un commentaire JSDoc
- **Nommage** - `camelCase` pour variables/fonctions, `PascalCase` pour classes/composants, `UPPER_SNAKE_CASE` pour les constantes, `kebab-case` pour les fichiers
- **Pas de code mort** - ne pas laisser de blocs commentes ou d'imports inutilises

---

## Tests

Chaque pull request doit :

- Maintenir la couverture backend >= 80 % (`pnpm --filter api test:coverage`)
- Maintenir la couverture frontend >= 80 % (`pnpm --filter web test:coverage`)
- Ajouter au moins un test unitaire par nouvelle methode de service
- Ajouter au moins un test d'integration par nouvel endpoint API (cas nominal + 401/403 si applicable)

Voir [docs/testing.fr.md](docs/testing.fr.md) pour la configuration de la base de test et les instructions E2E.

---

## Avant d'ouvrir une pull request

```bash
# Lint et formatage
pnpm lint

# Tests backend
pnpm --filter api test

# Tests frontend
pnpm --filter web test

# E2E (necessite la stack Docker complete)
pnpm test:e2e
```

Le workflow CI execute tout cela automatiquement a chaque push.

---

## Checklist pull request

- [ ] La branche suit la convention de nommage
- [ ] Les commits suivent le format Conventional Commits avec la section `Modified files:`
- [ ] Tous les tests passent en local
- [ ] Le nouveau code a une couverture de tests
- [ ] Aucun fichier `.env` ou secret commite
- [ ] La documentation est mise a jour si le comportement a change
