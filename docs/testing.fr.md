[🇬🇧 English](testing.md) | 🇫🇷 Français

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

Les tests d'integration necessitent une base PostgreSQL separee. A creer une fois :

```bash
createdb HiveMind_test
```

Puis ajouter la chaine de connexion dans `apps/api/.env` :

```env
DATABASE_URL_TEST=postgresql://postgres@localhost:5432/HiveMind_test
```

Quand `DATABASE_URL_TEST` est defini, le global setup des tests applique les migrations et le seed sur cette base avant l'execution de la suite. En CI, `DATABASE_URL_TEST` est absent - le service PostgreSQL CI est utilise directement via `DATABASE_URL`.

---

## Frontend

```bash
pnpm --filter web test              # Lancer tous les tests
pnpm --filter web test:coverage     # Avec rapport de couverture (cible >= 80 %)
```

- Environnement JSDOM, Vue Test Utils
- 26 fichiers de tests couvrant les pages (12), les composants reutilisables (5), les stores Pinia (7) et les utilitaires (2)

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
