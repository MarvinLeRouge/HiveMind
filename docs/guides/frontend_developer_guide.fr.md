🇫🇷 Version française | [🇬🇧 English version](frontend_developer_guide.md)

---

# Guide développeur frontend

Ce guide couvre les conventions de développement frontend au quotidien. Voir
[docs/architecture.md](../architecture.fr.md) pour la vue d'ensemble de la
structure et [docs/design-system.md](../design-system.fr.md) pour le langage
visuel actuel.

## Démarrage

```bash
docker compose up -d           # Stack de dev complète (backend · frontend · db)
pnpm --filter web dev          # Ou lancer le frontend seul (Vite HMR)
```

Voir [docs/operations.md](../operations.fr.md) pour le détail de Docker Compose.

## Structure

```
apps/web/src/
├── pages/         # Composants de niveau route
├── components/    # Composants UI réutilisables (basés sur shadcn-vue)
├── stores/        # Stores Pinia (useAuthStore, useCollectionStore, etc.)
├── router/        # Vue Router + garde d'authentification
├── composables/   # Fonctions de composition partagées
├── i18n/          # Configuration vue-i18n + fichiers de locale EN/FR
└── types/         # Types TypeScript locaux
```

Les pages délèguent aux stores Pinia pour les données et les mutations ; les
composants restent présentationnels autant que possible.

## Ajouter une page

1. Créer le composant de page sous `pages/`.
2. Ajouter un store Pinia sous `stores/` si la page a besoin de son propre
   état, en suivant le patron des stores existants (`useCollectionStore`,
   `usePuzzleStore`, etc.) : état, indicateurs loading/error, actions
   appelant le client API.
3. Enregistrer la route dans `router/`, en appliquant la garde
   d'authentification si la page nécessite un utilisateur connecté.
4. Ajouter tout nouveau texte d'interface à la fois dans
   `i18n/locales/en.json` et `fr.json` ; ne jamais coder en dur du texte
   visible par l'utilisateur.
5. Ajouter un fichier de test `.spec.ts` à côté de la page.

## Appels API et authentification

- Tous les appels HTTP passent par le client `ofetch` partagé, qui attache
  le token JWT d'accès et rafraîchit silencieusement en cas de 401 avant de
  retenter une fois.
- Ne jamais appeler `fetch` directement depuis un composant ou un store ;
  ajouter une méthode au store concerné (ou à un composable si elle est
  partagée entre plusieurs stores).
- Les formes des payloads de requête/réponse viennent de `packages/shared`,
  et ne sont pas redéfinies localement, pour que backend et frontend ne
  puissent pas diverger.

## Conventions de style

- Utiliser les propriétés CSS personnalisées définies dans
  `apps/web/src/assets/main.css` (voir
  [docs/design-system.md](../design-system.fr.md)) plutôt que de coder en
  dur des couleurs ou des espacements.
- Les couleurs de statut de puzzle utilisent les tokens sémantiques
  `--status-*`, pas des utilitaires de couleur Tailwind bruts, pour rester
  correctes en mode sombre.
- Respecter l'anneau `:focus-visible` et le support
  `prefers-reduced-motion` déjà en place.

## Conventions de test

```bash
pnpm --filter web test              # Vitest + Vue Test Utils
pnpm --filter web test:coverage     # Rapport de couverture (cible >= 80 %)
```

Faire correspondre la structure des tests à celle du code source : le
fichier de spec d'une page est à côté de la page, celui d'un store à côté du
store. Environnement JSDOM.

## Internationalisation

Tout texte visible par l'utilisateur passe par `vue-i18n`, avec `en.json` et
`fr.json` maintenus synchronisés dans `i18n/locales/`. Le sélecteur de
langue persiste la préférence de l'utilisateur via `PATCH /auth/me`.
