[🇬🇧 English](api_endpoints.md) | 🇫🇷 Français

# HiveMind - Endpoints API

[← Retour au README](../../README.fr.md)

---

La documentation interactive est disponible sur `/api/docs` (Swagger UI, developpement uniquement ; desactive en production).

Toutes les erreurs API suivent le format : `{ error: string, message: string, statusCode: number }`.

Les routes marquees `oui` necessitent un header `Authorization: Bearer <token>` valide. `oui admin` requiert en plus `User.isAdmin = true`. `oui owner` ou `oui membre` requierent le role correspondant sur la collection ciblee.

---

## Auth

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /auth/register | - | Creer un compte |
| POST | /auth/verify-email | - | Verifier l'adresse email |
| POST | /auth/login | - | Obtenir un access token + cookie de refresh |
| POST | /auth/refresh | - | Rotation des tokens depuis le cookie |
| POST | /auth/logout | oui | Effacer le cookie de refresh |
| GET | /auth/me | oui | Retourner l'utilisateur courant |
| PATCH | /auth/me | oui | Mettre a jour la preference de langue |

## Templates

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /templates | oui | Lister les templates |
| POST | /templates | oui | Creer un template utilisateur |
| GET | /templates/:id | oui | Obtenir un template par ID |
| PATCH | /templates/:id | oui | Modifier son propre template |
| DELETE | /templates/:id | oui | Supprimer son propre template |
| POST | /templates/system | oui admin | Creer un template systeme |
| PATCH | /templates/system/:id | oui admin | Modifier un template systeme |
| DELETE | /templates/system/:id | oui admin | Supprimer un template systeme |

## Collections

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /collections | oui | Lister mes collections |
| POST | /collections | oui | Creer une collection |
| GET | /collections/:id | oui membre | Obtenir une collection |
| PATCH | /collections/:id | oui owner | Modifier une collection |
| DELETE | /collections/:id | oui owner | Supprimer une collection |
| GET | /collections/:id/members | oui membre | Lister les membres |
| DELETE | /collections/:id/members/:userId | oui owner | Retirer un membre |

## Invitations

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /collections/:id/invitations | oui owner | Envoyer une invitation (email expedie) |
| GET | /invitations/:id | oui | Obtenir une invitation |
| POST | /invitations/:id/accept | oui | Accepter une invitation |
| POST | /invitations/:id/decline | oui | Decliner une invitation |

## Puzzles

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /collections/:id/puzzles | oui membre | Lister les puzzles |
| POST | /collections/:id/puzzles | oui owner | Creer un puzzle |
| GET | /collections/:id/puzzles/:pid | oui membre | Obtenir un puzzle |
| PATCH | /collections/:id/puzzles/:pid | oui membre | Modifier un puzzle |
| DELETE | /collections/:id/puzzles/:pid | oui owner | Supprimer un puzzle |
| PATCH | /collections/:id/puzzles/reorder | oui owner | Reordonner en masse |
| POST | /collections/:id/puzzles/:pid/claim | oui membre | Se declarer en train de travailler |
| DELETE | /collections/:id/puzzles/:pid/claim | oui membre | Se retirer des travailleurs |

## Notes

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /puzzles/:pid/notes | oui membre | Lister les notes |
| POST | /puzzles/:pid/notes | oui membre | Ajouter une note |
| PATCH | /puzzles/:pid/notes/:nid | oui auteur | Modifier sa note |
| DELETE | /puzzles/:pid/notes/:nid | oui auteur | Supprimer sa note |

## Tentatives

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /puzzles/:pid/attempts | oui membre | Lister les tentatives |
| POST | /puzzles/:pid/attempts | oui membre | Ajouter une tentative |

## Import

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /collections/:id/import/gpx | oui owner | Importer un fichier GPX |
| POST | /collections/:id/import/csv/preview | oui owner | Previsualiser les colonnes CSV |
| POST | /collections/:id/import/csv | oui owner | Importer un CSV avec mapping |
