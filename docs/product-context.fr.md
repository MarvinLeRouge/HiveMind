🇫🇷 Version française | [🇬🇧 English version](product-context.md)

---

# Contexte produit - HiveMind

## Concept

Une collection d'énigmes se résout difficilement seul, et une discussion de groupe perd vite la trace de qui a essayé quoi. HiveMind donne à une équipe un espace partagé par collection : qui travaille sur quelle énigme, ce qui a été observé, quelles valeurs ont déjà été testées et avec quel résultat, jusqu'à la réponse finale.

Le domaine est volontairement générique : séries de mystery caches en géocaching, challenges CTF, énigmes d'escape game, chasses au trésor, recueils d'énigmes logiques.

## Utilisateur cible

De petites équipes de résolveurs (amis, clubs, équipes CTF) qui travaillent de façon asynchrone sur une même collection. Un compte par personne, collaboration sur invitation uniquement. Les administrateurs de la plateforme ne gèrent que les templates système.

## Vocabulaire

| Terme | Sens |
|---|---|
| `collection` | Un ensemble d'énigmes résolu par une équipe, avec ses membres et son template |
| `puzzle` | Une énigme de la collection, avec des métadonnées optionnelles (coordonnées, difficulté/terrain, indice, spoiler, champs personnalisés) |
| `note` | Une observation ou hypothèse en texte libre, horodatée et propre à son auteur |
| `attempt` | L'enregistrement immuable d'une valeur testée, de son résultat (réussi/échoué) et d'un commentaire optionnel |
| `template` | L'ensemble des champs qu'une collection expose sur ses énigmes (templates système : `generic`, `geocaching`) |
| `claim` | Un membre qui se signale comme travaillant sur une énigme ; non exclusif, plusieurs membres peuvent revendiquer la même énigme (voir [ADR 0003](adr/0003-non-exclusive-puzzle-claiming.md)) |
| `owner` / `member` | Rôles par collection : le propriétaire gère la collection et ses invitations |

## Fonctionnalités

- **Collections et templates** - choisir les champs d'énigme actifs par collection
- **Énigmes** - métadonnées, indice et spoiler, URL de vérification externe pour tester une valeur directement
- **Notes et tentatives** - un historique partagé, en ajout seul, de ce que l'équipe a observé et testé
- **Collaboration** - invitations par email avec liens d'acceptation et de refus, revendication non exclusive
- **Import** - import GPX qui remplit les champs géocaching, import CSV avec correspondance colonnes/champs
- **Comptes** - vérification de l'email obligatoire, access token JWT plus refresh cookie httpOnly
- **Interface bilingue** - anglais et français, selon la préférence de chaque utilisateur

## Hors périmètre

- Collections publiques ou ouvertes : l'accès se fait uniquement sur invitation
- Chat en temps réel ou co-édition en direct : la collaboration est asynchrone
- Résoudre ou vérifier les énigmes à la place de l'utilisateur : l'URL de vérification pointe vers un outil externe
- Modifier ou supprimer des tentatives : elles restent un enregistrement immuable
