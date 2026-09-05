🇫🇷 Version française | [🇬🇧 English version](operations.md)

# HiveMind - Operations

[← Retour au README](../README.fr.md)

---

## Table des matieres

- [Developpement local](#developpement-local)
- [Docker](#docker)
- [Pipeline CI/CD](#pipeline-cicd)
- [Deploiement en production](#deploiement-en-production)
- [Sauvegarde & restauration](#sauvegarde--restauration)

---

## Developpement local

### Prerequis

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose
- Traefik en fonctionnement local avec un reseau Docker `traefik-public`
- `hivemind.marvinlerouge.local` ajoute dans `/etc/hosts` :

```bash
echo "127.0.0.1 hivemind.marvinlerouge.local" | sudo tee -a /etc/hosts
```

### Installation

```bash
# Cloner le depot
git clone https://github.com/MarvinLeRouge/HiveMind.git
cd HiveMind

# Installer les dependances
pnpm install

# Copier les fichiers d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Demarrer la stack complete (backend · frontend · base de donnees)
docker compose up -d

# Appliquer les migrations et peupler la base de donnees
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

L'application est accessible :

| Service | URL |
|---------|-----|
| Frontend | http://hivemind.marvinlerouge.local |
| API | http://hivemind.marvinlerouge.local/api |
| Swagger UI | http://hivemind.marvinlerouge.local/api/docs |

Les identifiants admin par defaut sont definis dans `apps/api/.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

---

## Docker

### Stack de developpement

| Service | Description | Port |
|---------|-------------|------|
| `backend` | API Fastify avec hot reload | 3000 |
| `frontend` | Serveur Vite dev | 5173 |
| `db` | PostgreSQL 16 avec volume nomme `pgdata` | 5432 |

```bash
# Demarrer la stack de developpement complete
docker compose up -d

# Suivre tous les logs
docker compose logs -f

# Suivre uniquement les logs backend
docker compose logs -f backend

# Arreter et supprimer les conteneurs
docker compose down
```

### Stack de production

La stack de production s'execute sur un VPS derriere Traefik avec TLS Let's Encrypt. Les conteneurs sont nommes `hivemind-backend`, `hivemind-frontend` et `hivemind-db`. Tous les services partagent le reseau Docker externe `traefik-public`.

```bash
# Verifier l'etat de la stack de production
docker compose -f docker-compose.prod.yml ps

# Suivre les logs de production
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Pipeline CI/CD

### Pre-commit (automatique a chaque `git commit`)

Husky + lint-staged :

- Fichiers stages `*.{ts,vue}` → `eslint --fix` → `prettier --write`
- Le commit est bloque si le lint ne peut pas auto-corriger

### Workflow CI (`ci.yml`)

Declenche sur push + PR vers `main`. Ignore `docs/**` et `**.md`. Utilise `dorny/paths-filter` pour ignorer les apps inchangees.

| Job | Etapes |
|-----|--------|
| `backend` | lint → typecheck → Vitest (unitaire + integration) → Codecov |
| `frontend` | lint → typecheck → Vitest → Codecov |

La couverture est envoyee a Codecov via OIDC - aucun token requis pour les depots publics.

### Workflow E2E (`e2e.yml`)

Declenche sur push vers `main` et `workflow_dispatch`. Construit la stack Docker de production complete, applique les migrations, seed la base, puis execute les 35 tests Playwright. Le workflow CD est conditionne au succes de l'E2E via `workflow_run`.

### Workflow CD (`build-deploy.yml`)

Declenche par le succes du workflow E2E via `workflow_run`, et sur `workflow_dispatch` (contournement hotfix).

1. Resolution du SHA exact du commit + nom du depot en minuscules
2. Build et push des images Docker `backend` + `frontend` vers GHCR (tags `sha` + `latest`)
   - Le frontend recoit `VITE_API_BASE_URL` en argument de build (compile par Vite au moment du build)
3. Deploiement SSH sur le VPS :
   - Recuperation de `docker-compose.prod.yml` au SHA exact
   - Pull des nouvelles images
   - Demarrage de la base de donnees, attente du health check
   - Execution de `prisma migrate deploy`
   - Demarrage de tous les services avec `--remove-orphans`

---

## Deploiement en production

### Premier deploiement

Secrets GitHub requis :

| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_HOST` | Nom d'hote ou IP du VPS |
| `DEPLOY_SSH_USER` | Utilisateur SSH sur le VPS |
| `DEPLOY_SSH_PRIVATE_KEY` | Cle privee SSH avec acces au VPS |
| `VITE_API_BASE_URL` | URL publique de l'API compilee dans le frontend (ex. `https://example.com/api`) |

Le VPS doit avoir Docker installe, le reseau Docker `traefik-public` cree, et un fichier `.env` de production au chemin reference dans `docker-compose.prod.yml`.

Au premier deploiement, executer le seed de la base manuellement :

```bash
docker exec hivemind-backend node node_modules/.bin/prisma db seed
```

### Deploiement manuel

Pour declencher un deploiement manuel : aller dans **Actions → Build & Deploy → Run workflow** sur GitHub.

---

## Sauvegarde & restauration

La base de donnees de production est sauvegardee quotidiennement via une tache cron sur le VPS (`0 2 * * *`). Les sauvegardes sont des exports `pg_dump` comprimes en gzip avec la rotation suivante :

- **7 sauvegardes quotidiennes** - une par jour, ecrasee apres 7 jours
- **4 sauvegardes hebdomadaires** - chaque dimanche, ecrasee apres 4 semaines

### Procedure de restauration

```bash
# 1. Copier le fichier de sauvegarde sur le VPS si necessaire
scp backup.sql.gz user@vps:/tmp/

# 2. Creer une base temporaire pour verification
docker exec hivemind-db createdb -U HiveMind hivemind_restore

# 3. Restaurer dans la base temporaire
gunzip -c /tmp/backup.sql.gz | docker exec -i hivemind-db psql -U HiveMind -d hivemind_restore

# 4. Verifier la restauration (nombre de tables, comptages, controles ponctuels)
docker exec -it hivemind-db psql -U HiveMind -d hivemind_restore -c "\dt"

# 5. Si verifiee, arreter la stack, restaurer dans la base live, puis redemarrer
docker compose -f docker-compose.prod.yml down
gunzip -c /tmp/backup.sql.gz | docker exec -i hivemind-db psql -U HiveMind -d HiveMind
docker compose -f docker-compose.prod.yml up -d
```
