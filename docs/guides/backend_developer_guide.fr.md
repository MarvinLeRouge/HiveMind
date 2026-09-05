🇫🇷 Version française | [🇬🇧 English version](backend_developer_guide.md)

---

# Guide développeur backend

Ce guide couvre les conventions de développement backend au quotidien. Voir
[docs/architecture.md](../architecture.fr.md) pour la carte des couches et le
modèle de rôles/permissions, et
[docs/api/api_endpoints.md](../api/api_endpoints.fr.md) pour la référence
complète des routes.

## Démarrage

```bash
docker compose up -d           # Stack de dev complète (backend · frontend · db)
pnpm --filter api dev          # Ou lancer le backend seul, avec hot reload
npx prisma migrate dev
npx prisma db seed
```

Voir [docs/operations.md](../operations.fr.md) pour le détail de Docker Compose.

## Architecture en couches

Les contrôleurs sont volontairement minces : toute la logique métier vit dans
les services. Les repositories gèrent tous les appels Prisma et n'exposent
aucune logique métier.

```
apps/api/src/
├── routes/        # Définitions de routes + schémas Zod (entrée + sortie)
├── controllers/   # Gestion requête/réponse - délègue aux services
├── services/      # Logique métier - aucun appel Prisma ici
├── repositories/  # Accès aux données Prisma - aucune logique métier ici
├── middlewares/   # authenticate, requireMember, requireOwner
├── plugins/       # swagger, jwt, cookie, cors, multipart, helmet, rate-limit
└── types/         # Types TypeScript locaux
```

Les données circulent dans un seul sens :
`route -> controller -> service -> repository -> Prisma`. Un service
n'importe jamais Prisma directement, et un contrôleur n'importe jamais un
repository directement.

## Ajouter un endpoint

1. Définir les schémas Zod d'entrée/sortie dans `routes/`, à côté de
   l'enregistrement de la route. La requête et la réponse sont toutes deux
   validées.
2. Ajouter une méthode de contrôleur qui parse la requête, appelle le
   service, et met en forme la réponse. Aucune logique métier ici.
3. Implémenter la logique dans le service correspondant. Pour accéder aux
   données, appeler une méthode de repository plutôt que Prisma directement.
4. Ajouter la méthode de repository si elle n'existe pas encore, en gardant
   les appels Prisma isolés à cet endroit.
5. Appliquer le bon middleware (`authenticate`, `requireMember`,
   `requireOwner`) selon le tableau des rôles de
   [docs/architecture.md](../architecture.fr.md#rôles--permissions).
6. Ajouter la route à
   [docs/api/api_endpoints.md](../api/api_endpoints.fr.md) (et son miroir
   anglais).
7. Écrire un test unitaire pour le service (repository mocké) et un test
   d'intégration pour l'endpoint via `fastify.inject()`.

## Ajouter un modèle Prisma ou une migration

```bash
npx prisma migrate dev --name <description>
```

- Mettre à jour `seed.ts` si le nouveau modèle a besoin de données de seed
  (templates système, utilisateur admin, etc.).
- Ne jamais modifier une migration déjà appliquée sur un autre
  environnement ; en créer une nouvelle à la place.
- Supprimer une colonne ou une table est une action destructive et
  nécessite une confirmation explicite avant d'exécuter la migration.

## Conventions de test

```bash
pnpm --filter api test              # Vitest (unitaires + intégration)
pnpm --filter api test:coverage     # Rapport de couverture (cible >= 80 %)
```

- Les tests unitaires vivent dans `apps/api/tests/unit/` : les services sont
  testés avec les repositories mockés, sans base de données.
- Les tests d'intégration vivent dans `apps/api/tests/integration/` : une
  vraie instance Fastify via `fastify.inject()`, exécutée sur une base de
  test dédiée (`DATABASE_URL_TEST`), jamais la base de dev. Voir
  [docs/testing.md](../testing.fr.md) pour la mise en place locale.
- Chaque endpoint est testé sur le chemin nominal ainsi que les scénarios
  401/403/404 pertinents.
- Chaque méthode de service nécessite au moins un test unitaire.

## Conventions

- Les fonctions sont nommées verbe en premier : `createCollection`,
  `claimPuzzle`, `verifyEmail`.
- Chaque fonction, classe et type exporté a un commentaire JSDoc.
- TypeScript strict mode : pas de `any`, pas de `@ts-ignore`.
- Les variables d'environnement sont validées via Zod au démarrage ;
  ajouter toute nouvelle variable à la fois dans `apps/api/.env.example` et
  dans le schéma de démarrage.
- Toutes les erreurs API suivent le format
  `{ error: string, message: string, statusCode: number }`.
- Les messages de commit suivent Conventional Commits avec une liste de
  fichiers obligatoire ; voir le `CLAUDE.md` du dépôt.
