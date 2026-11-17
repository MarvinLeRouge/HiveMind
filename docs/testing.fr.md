🇫🇷 Version française | [🇬🇧 English version](testing.md)

# HiveMind - Tests

[← Retour au README](../README.fr.md)

---

## Backend

```bash
pnpm --filter api test              # Lancer tous les tests
pnpm --filter api test:coverage     # Avec rapport de couverture (cible >= 80 %)
```

- **Tests unitaires** - `apps/api/tests/unit/` - logique des services, repositories mockes
- **Tests d'integration** - `apps/api/tests/integration/` - instance Fastify reelle via `fastify.inject()`
- Chaque endpoint est teste pour le cas nominal + scenarios 401/403/404
- Les tests d'integration s'executent contre une base de donnees dediee pour proteger la base de developpement

### Configuration de la base de test (local)

Les tests d'integration s'executent sur `HiveMind_test`, une base dediee dans le conteneur de la stack de dev (`hivemind-db-1`, publie sur `127.0.0.1:5434`). La creer une fois si elle n'existe pas :

```bash
docker compose exec db createdb -U HiveMind HiveMind_test
```

Puis creer le fichier d'environnement de test local a partir de son modele et renseigner le mot de passe de la base :

```bash
cp apps/api/.env.test.example apps/api/.env.test
```

`vitest.config.ts` charge `apps/api/.env.test` s'il existe, donc `pnpm --filter api test:coverage` fonctionne tel quel depuis l'hote. Les variables deja definies dans le shell sont prioritaires sur le fichier. Le global setup des tests applique les migrations et le seed sur `DATABASE_URL_TEST` avant l'execution de la suite.

Hors CI, le global setup refuse de s'executer si le nom de la base cible ne se termine pas par `_test` : un fichier mal configure ne peut donc pas vider la base de dev. En CI, il n'y a ni `.env.test` ni `DATABASE_URL_TEST` : le workflow definit les variables et le service PostgreSQL CI est utilise directement via `DATABASE_URL`.

---

## Frontend

```bash
pnpm --filter web test              # Lancer tous les tests
pnpm --filter web test:coverage     # Avec rapport de couverture (cible >= 80 %)
```

- Environnement JSDOM, Vue Test Utils
- 29 fichiers de tests couvrant les pages (12), les composants dont la racine `App` (6), les stores Pinia (7), le router et les composables (2) et les utilitaires (2)

---

## E2E - Playwright

```bash
pnpm test:e2e       # Necessite la stack Docker complete en cours d'execution
```

35 tests repartis sur 6 fichiers de specs dans `e2e/` a la racine du monorepo. Chromium uniquement. Execute contre la stack Docker complete de production (backend + frontend + DB + mailpit).

| Spec | Tests | Perimetre |
|------|-------|-----------|
| `auth.spec.ts` | 6 | login, mauvais mdp, register, logout, redirect, bascule i18n |
| `collections.spec.ts` | 8 | create, view, settings, delete, invite, acces member/outsider |
| `puzzles.spec.ts` | 10 | liste, add, edit, claim/release, avance statut, delete, acces member |
| `notes.spec.ts` | 5 | add, edit, delete note ; member ne peut pas editer les notes owner |
| `attempts.spec.ts` | 3 | enregistrement, immutabilite, ordre chronologique |
| `import.spec.ts` | 3 | import GPX, preview CSV, import CSV |

---

## Cibles de couverture

| Package | Cible | Mesure |
|---------|-------|--------|
| Backend | >= 80 % | >= 97 % |
| Frontend | >= 80 % | >= 92 % |

La couverture est envoyee a Codecov a chaque execution CI. Les badges sont visibles dans le README.
