🇫🇷 Version française | [🇬🇧 English version](user_guide.md)

---

# Guide utilisateur

Ce guide couvre l'utilisation de HiveMind pour résoudre des collections de
puzzles en équipe : créer une collection, inviter des collaborateurs, suivre
notes et tentatives, et importer des puzzles en masse.

## Démarrage

1. Créez un compte avec un email, un nom d'utilisateur et un mot de passe.
2. Confirmez votre compte via le lien de vérification envoyé par email avant
   votre première connexion.
3. Connectez-vous. Votre session reste active 15 minutes à la fois,
   rafraîchie automatiquement en arrière-plan tant que vous utilisez
   l'application.
4. Définissez votre langue préférée (EN/FR) depuis les paramètres de votre
   compte ; elle est enregistrée et appliquée à chaque future connexion.

## Collections

Une **Collection** regroupe les puzzles d'une même chasse, série ou défi
(une série de mystères geocaching, un CTF, un escape room, une chasse au
trésor...).

1. Créez une collection et donnez-lui un nom.
2. Choisissez un **Template** pour elle, ou utilisez l'un des templates
   système (`generic`, `geocaching`), pour contrôler quels champs sont
   actifs sur ses puzzles (coordonnées, difficulté/terrain, indice, spoiler,
   champs personnalisés).
3. En tant que **owner** de la collection, invitez des collaborateurs par
   email depuis la page des membres. Les personnes invitées reçoivent un
   email avec des liens directs d'acceptation/refus ; une fois acceptée,
   elles deviennent **membres** et peuvent commencer à travailler sur les
   puzzles.

## Rôles

| Action | owner | member |
|---|:-:|:-:|
| Inviter / retirer des membres | oui | - |
| Supprimer la collection, modifier sa config | oui | - |
| Ajouter / modifier / réordonner les puzzles | oui | - |
| Se déclarer sur un puzzle, ajouter notes et tentatives | oui | oui |

Un rôle `admin_platform` existe aussi au niveau plateforme pour gérer les
templates système ; il n'est lié à aucune collection en particulier.

## Puzzles

- Le owner ajoute les puzzles à la collection, en remplissant les champs
  exposés par le template de la collection.
- Tout membre peut se **déclarer** (« claim ») sur un puzzle pour signaler
  qu'il y travaille. La déclaration n'est pas exclusive : plusieurs membres
  peuvent se déclarer sur le même puzzle en même temps, pour que l'équipe
  voie qui regarde activement quoi sans bloquer personne.
- Le statut d'un puzzle (ouvert, en cours, résolu, vérifié) est mis à jour
  au fur et à mesure de l'avancement.

## Notes et tentatives

- Les **Notes** sont du texte libre, horodaté, attribué à leur auteur :
  utilisez-les pour des observations, des hypothèses, ou des décodages
  partiels. Vous pouvez modifier ou supprimer vos propres notes ; vous ne
  pouvez pas modifier celle d'un autre membre.
- Les **Tentatives** enregistrent une valeur concrète testée, avec un
  résultat succès/échec et un commentaire optionnel. Les tentatives sont
  immuables une fois enregistrées, conservées en ordre chronologique, pour
  que l'équipe voie ce qui a déjà été essayé sans avoir à le retester.
- Si le puzzle dispose d'une **Checker URL** configurée, une valeur tentée
  peut être vérifiée directement auprès de ce vérificateur externe.

## Importer des puzzles

Plutôt que d'ajouter les puzzles un par un, un owner peut les importer en
masse dans une collection :

- **Import GPX** : téléverse un fichier GPX et auto-remplit les puzzles à
  partir de ses waypoints (codes GC et coordonnées geocaching).
- **Import CSV** : téléverse un CSV, prévisualise ses colonnes, et permet
  de faire correspondre chaque colonne à un champ de puzzle avant de
  confirmer l'import.

## Astuces

- La documentation interactive de l'API est disponible sur `/api/docs` en
  développement, utile si vous scriptez vos propres intégrations.
- Changer de langue en cours de session n'affecte que le texte de
  l'interface ; cela ne traduit pas le contenu des collections (noms de
  puzzles, notes, etc.), qui reste tel qu'il a été saisi.
