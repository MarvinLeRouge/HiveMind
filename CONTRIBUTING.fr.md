🇫🇷 Version française | [🇬🇧 English version](CONTRIBUTING.md)

---

# Contribuer à HiveMind

## Prérequis

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose

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

Voir [docs/operations.fr.md](docs/operations.fr.md) pour les détails complets sur la stack locale, les commandes Docker et le déploiement en production.

## Lancer les tests

```bash
pnpm --filter api test          # tests unitaires et d'intégration backend
pnpm --filter web test          # tests frontend
pnpm test:e2e                   # E2E, nécessite la stack Docker complète
```

Chaque pull request doit maintenir une couverture backend et frontend d'au moins 80 % (`pnpm --filter api test:coverage`, `pnpm --filter web test:coverage`). Voir [docs/testing.fr.md](docs/testing.fr.md) pour la configuration de la base de test et les instructions E2E.

## Workflow

1. Forker le dépôt et créer une branche à partir de `main`.
2. Faire la modification, avec des tests qui la couvrent.
3. Commiter en suivant la convention ci-dessous.
4. Pousser et ouvrir une pull request vers `main`.
5. La CI doit passer avant la revue.

## Nommage des branches

| Préfixe | Quand l'utiliser |
|---------|-----------------|
| `feat/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `chore/` | Outillage, config, mise à jour de dépendances |
| `docs/` | Documentation uniquement |
| `refactor/` | Restructuration du code sans changement de comportement |
| `test/` | Ajout ou correction de tests |

Utiliser le kebab-case minuscule. Exemple : `feat/puzzle-checker-url`, `fix/invite-email-encoding`.

## Convention de commit

Suivre [Conventional Commits](https://www.conventionalcommits.org/), impératif, minuscules, sans point final, avec une section `Modified files:` obligatoire :

```
<type>(<scope optionnel>): <résumé court>

Modified files:
- chemin/vers/fichier-a.ts - ce qui a été modifié
- chemin/vers/fichier-b.vue - ce qui a été modifié
```

Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`.

Exemple :

```
feat(api): add puzzle checker URL validation

Modified files:
- apps/api/src/services/puzzle.service.ts - validate checkerUrl format
- apps/api/tests/unit/puzzle.service.test.ts - add validation tests
```

## Style de code

- **TypeScript strict mode** - pas de `any`, pas de `@ts-ignore`
- **Schémas Zod** - chaque route Fastify doit avoir un schéma d'entrée et de sortie
- **JSDoc** - chaque fonction, classe et type exporté doit avoir un commentaire JSDoc
- **Nommage** - `camelCase` pour variables/fonctions, `PascalCase` pour classes/composants, `UPPER_SNAKE_CASE` pour les constantes, `kebab-case` pour les fichiers
- **Pas de code mort** - ne pas laisser de blocs commentés ou d'imports inutilisés

La CI rejettera toute pull request qui ne passe pas ces vérifications.

## Code de conduite

Ce projet suit un [Code de conduite](CODE_OF_CONDUCT.fr.md). En participant, vous vous engagez à le respecter.

## Licence

En contribuant, vous acceptez que vos contributions soient distribuées sous la licence du projet (voir [LICENSE](LICENSE)).

---

## Avant d'ouvrir une pull request

```bash
pnpm lint                       # lint et formatage
pnpm --filter api test          # tests backend
pnpm --filter web test          # tests frontend
pnpm test:e2e                   # E2E, nécessite la stack Docker complète
```

Le workflow CI exécute tout cela automatiquement à chaque push.

## Checklist pull request

- [ ] La branche suit la convention de nommage
- [ ] Les commits suivent le format Conventional Commits avec la section `Modified files:`
- [ ] Tous les tests passent en local
- [ ] Le nouveau code a une couverture de tests
- [ ] Aucun fichier `.env` ou secret commité
- [ ] La documentation est mise à jour si le comportement a changé
