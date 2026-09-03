[🇬🇧 English](SECURITY.md) | 🇫🇷 Français

# Politique de securite

---

## Signaler une vulnerabilite

Si vous decouvrez une vulnerabilite de securite dans HiveMind, merci de la signaler de maniere responsable :

**Contact :** ouvrir un [GitHub Security Advisory](https://github.com/MarvinLeRouge/HiveMind/security/advisories/new) (prive par defaut).

Inclure :

- Une description de la vulnerabilite et de son impact potentiel
- Les etapes pour reproduire le probleme
- Tous logs, payloads ou code de preuve de concept pertinents

**Delai de reponse :** accusé de reception sous 72 heures, delai de resolution communique sous 7 jours.

Ne pas ouvrir d'issue GitHub publique pour les vulnerabilites de securite.

---

## Versions supportees

| Version | Supportee |
|---------|-----------|
| Branche `main` (derniere) | Oui |
| Tags plus anciens | Non |

Seul le deploiement de production actuel est activement maintenu.

---

## Mesures de securite en place

### Authentification

- Access tokens JWT avec une TTL de 15 minutes
- Refresh tokens stockes dans des cookies httpOnly, Secure, SameSite=Strict (non accessibles en JavaScript)
- Invalidation des refresh tokens cote serveur : chaque token porte un `jti` ; la deconnexion le revoque en base de donnees
- Verification d'email requise avant le premier login (token SHA-256, TTL 24h, usage unique)

### Transport et headers

- HTTPS impose en production via Traefik + Let's Encrypt
- Headers de securite HTTP via `@fastify/helmet` : `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`

### Validation des entrees

- Toutes les entrees API sont validees avec des schemas Zod au niveau de la route
- Les fichiers uploades (GPX, CSV) sont limites en taille et leur type de contenu est verifie avant le parsing

### Rate limiting

- `POST /auth/login` : 10 requetes / minute par IP
- `POST /auth/register` : 5 requetes / minute par IP
- `POST /auth/verify-email` et renvoi : 3 requetes / minute par IP

### Autorisation

- Chaque route protegee verifie la validite du JWT via le middleware `authenticate`
- L'acces au niveau collection est applique par les middlewares `requireMember` et `requireOwner`
- Les utilisateurs ne peuvent modifier que leurs propres notes ; les tentatives sont immuables apres creation

### Dependances

- Les dependances sont auditees avec `pnpm audit` dans le workflow de developpement
- Les CVE transitives identifiees lors de l'audit OWASP Top 10 (BLOCK-25) ont ete corrigees ou epinglees

---

## Audit OWASP Top 10

HiveMind a fait l'objet d'une revue OWASP Top 10 structuree (BLOCK-25). Constats et mesures :

| Categorie OWASP | Statut |
|---|---|
| A01 Broken Access Control | Attenué - middleware par route, roles par collection |
| A02 Cryptographic Failures | Attenué - HTTPS, cookies httpOnly, tokens de verification SHA-256 |
| A03 Injection | Attenué - ORM Prisma (requetes parametrees), validation Zod |
| A04 Insecure Design | Attenué - invalidation de tokens cote serveur, verification d'email |
| A05 Security Misconfiguration | Attenué - headers Helmet, Swagger UI desactive en production |
| A06 Vulnerable Components | Attenué - passe de correction CVE sur les dependances transitives |
| A07 Auth Failures | Attenué - rate limiting sur les routes auth, verification d'email |
| A08 Software Integrity | Attenué - images GHCR epinglees par SHA dans le workflow CD |
| A09 Logging Failures | Partiel - logging Fastify actif ; format de log structure pas encore impose |
| A10 SSRF | Risque faible - aucun appel HTTP sortant declenche par une entree utilisateur |
