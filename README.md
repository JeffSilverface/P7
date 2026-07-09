# Orion CRM

A simplified Customer Relationship Management (CRM) application built with the MERN stack (modernized with TypeScript, Vite, and Prisma).

## Architecture

This project follows a monorepo structure with separate frontend and backend applications:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 24 + Express 5 + TypeScript + Prisma

## Prerequisites

- **Node.js** >= 24.0.0
- **npm** >= 10.0.0

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd p7-dfsjs
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development).

### 4. Initialize the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Install frontend dependencies

```bash
cd ../client
npm install
```

### 6. Configure frontend environment

```bash
cp .env.example .env
```

## Running the Application

### Start the backend server

```bash
cd server
npm run dev
```

The API will be available at `http://localhost:8080`

### Start the frontend application

In a new terminal:

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:4200`

## Available Scripts

### Backend (server/)

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend (client/)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code

## Project Structure

```
p7-dfsjs-starter/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Application entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── server/                # Backend Express application
│   ├── src/
│   │   ├── controllers/   # Route handlers (HTTP layer)
│   │   ├── services/      # Business logic layer
│   │   ├── repositories/  # Data access layer
│   │   ├── models/        # Data models and schemas
│   │   ├── routes/        # API route definitions
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── README.md
```

## Features

- **Dashboard**: View statistics and overview
- **Contacts Management**: Create, read, update, and delete contacts
- **Organizations Management**: Manage companies and link them to contacts
- **RESTful API**: Well-structured backend with Controller-Service-Repository pattern
- **Type Safety**: Full TypeScript support on frontend and backend
- **Modern UI**: Tailwind CSS with responsive design

## API Endpoints

### Organizations

- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/stats` - Get organization statistics

### Contacts

- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/stats` - Get contact statistics

## Technology Stack

### Frontend

- **React 19**: Modern React with Hooks
- **TypeScript 5.x**: Static typing
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management

### Backend

- **Node.js 24 LTS**: JavaScript runtime
- **Express 5**: Web framework
- **TypeScript 5.x**: Static typing
- **Prisma**: Modern ORM
- **SQLite**: Development database
- **Zod**: Runtime type validation
- **Vitest**: Testing framework

## Development Guidelines

### Code Style

- Use **TypeScript strict mode**
- No `any` types allowed
- Use **functional components** and hooks (no class components)
- Use `async/await` for asynchronous operations (no callbacks)
- Follow the **Controller-Service-Repository** pattern on the backend

### Architecture Principles

- **Separation of Concerns**: Clear separation between UI, business logic, and data access
- **Type Safety**: Define interfaces/types for all data structures
- **Custom Hooks**: Extract complex logic into reusable hooks
- **API Layer**: Centralized API calls in service files
- **Validation**: Use Zod schemas for input validation

## Politique de versioning et releases

### SemVer

Ce projet suit [Semantic Versioning](https://semver.org) : `MAJOR.MINOR.PATCH`

| Incrément | Quand |
|-----------|-------|
| `MAJOR` | Changement incompatible avec la version précédente (breaking change API, migration BDD destructive) |
| `MINOR` | Nouvelle fonctionnalité rétrocompatible |
| `PATCH` | Correction de bug rétrocompatible |

### Créer une version taguée

La publication d'une version versionnée est une action humaine volontaire.

```bash
git tag v1.0.0
git push origin v1.0.0
```

Le pipeline CI se déclenche sur le tag, exécute la validation complète (audit → tests → sonar → build → trivy → ZAP), puis publie les images avec le tag SemVer si tout passe.

### Choix de conception

- **Action humaine requise** : un tag = une décision délibérée de livrer une version stable
- **Pas de release candidate automatique** : les PR sont validées par la CI, le tag marque une version figée
- **Pas de branche par release** : on tague depuis `main` après merge

---

## Plan de testing périodique

### Types de tests

| Périmètre | Framework | Localisation |
|-----------|-----------|--------------|
| Frontend (React/TypeScript) | Vitest | `client/` |
| Backend (Express/Prisma) | Vitest | `server/` |

### Déclencheurs

| Événement | Jobs exécutés |
|-----------|---------------|
| `push` sur `staging` | Audit → Tests → SonarCloud + Build → Trivy → ZAP → publish `:staging` |
| `push` sur `main` | Idem → publish `:latest` |
| `pull_request` vers `staging` ou `main` | Audit → Tests → SonarCloud + Build → Trivy → ZAP (bloque le merge si échec) |
| Cron hebdomadaire (lundi 3h) | Pipeline complet + alerte GitHub Issue si échec |
| `workflow_dispatch` | Exécution manuelle à la demande |

### Objectifs

- **Validation fonctionnelle** : chaque test unitaire/intégration valide un comportement métier
- **Non-régression** : les tests s'exécutent sur chaque PR pour détecter toute régression avant merge
- **Qualité** : SonarCloud mesure la couverture, les code smells et la dette technique en continu

---

## Observabilité — Stack ELK

### Architecture du pipeline de logs

```
React (frontend)
  └── POST /api/logs ──► Express (Winston)
                              │
Node.js (backend)             │ TCP :5000
  └── Winston ────────────────►
                         Logstash
                              │
                              ▼
                       Elasticsearch
                        (index p7-logs-YYYY.MM.dd)
                              │
                              ▼
                           Kibana :5601
                      (dashboard + Discover)
```

### Démarrage de la stack ELK

```bash
# Stack principale d'abord (crée le réseau p7_default)
docker compose up -d

# Stack ELK ensuite
docker compose -f docker-compose-elk.yml up -d
```

### Composants

| Service | Port | Rôle |
|---|---|---|
| Elasticsearch | 9200 | Stockage et indexation des logs |
| Logstash | 5001 (host) / 5000 (interne) | Réception TCP → indexation ES |
| Kibana | 5601 | Visualisation et dashboards |
| Heartbeat | — | Supervision de disponibilité (uptime) des services |

### Logs collectés

**Backend (Winston)**
- `server_started` — démarrage du serveur
- `http_request` — chaque requête HTTP (method, url, status, duration_ms)
- `route_not_found` — 404 (level: warn)
- `unhandled_error` — exceptions non gérées (level: error)

**Frontend (via /api/logs)**
- `js_error` — erreurs JavaScript capturées par `window.onerror`
- `unhandled_promise` — promesses rejetées non gérées
- `api_error` — erreurs Axios (url, method, status)

Tous les logs frontend sont taggés `source: frontend` pour faciliter le filtrage dans Kibana.

### Dashboard Kibana

**Data View :** `p7-logs-*` — timestamp : `@timestamp`

| Visualisation | Type | Source |
|---|---|---|
| Services présents (Backend, Elasticsearch, Frontend) | Metric — Last value `monitor.status` | `heartbeat-*` |
| Routes API disponibles (Contacts, Organizations) | Table — Last value `monitor.status` | `heartbeat-*` |
| Log volume par niveau | Bar vertical stacked | `p7-logs-*` — Break down: `level.keyword` |
| Total 404 backend | Metric | `p7-logs-*` — filtre `level.keyword : warn` |
| Durée moyenne par route | Bar horizontal | `p7-logs-*` — Average `duration_ms` / `url.keyword` |
| Erreurs API frontend | Bar vertical | `p7-logs-*` — filtre `source.keyword : frontend AND level.keyword : error` |

### Configuration

Les transports de log sont conditionnels :

| Variable d'environnement | Effet |
|---|---|
| `LOGSTASH_HOST=logstash` | Active l'envoi TCP vers Logstash |
| `LOGSTASH_PORT=5000` | Port interne Docker (défaut 5000) |
| `LOG_LEVEL=info` | Niveau minimum de log |

Sans `LOGSTASH_HOST`, les logs restent uniquement dans la console (développement local sans Docker).

---

## Sauvegarde & restauration

Deux scripts sont disponibles dans `scripts/` pour la gestion des sauvegardes SQLite.

### Sauvegarde

```bash
# Sauvegarde quotidienne (rétention 7 jours)
./scripts/backup.sh daily

# Sauvegarde hebdomadaire (rétention 4 semaines)
./scripts/backup.sh weekly
```

Les fichiers sont compressés (`.db.gz`) et horodatés dans `backups/daily/` ou `backups/weekly/`. La rétention est automatique (les plus anciens sont supprimés au-delà du seuil).

### Restauration

```bash
./scripts/restore.sh backups/daily/dev-20260708-120000.db.gz
```

Le script arrête le container serveur, restaure le fichier, redémarre et exécute `prisma migrate deploy` pour aligner le schéma.

---

## Métriques DORA et KPIs

*Période d'observation : juin–juillet 2026 | Source CI : GitHub Actions | Source logs : ELK Stack*

### 4 Métriques DORA

| Métrique | Valeur | Méthode de calcul | Niveau DORA |
|---|---|---|---|
| **Lead Time for Changes** | 7 jours | Premier commit ELK (24/06) → merge staging (01/07) | 🟡 Medium |
| **Deployment Frequency** | ~1,1 merge/jour | 11 merges sur staging en 10 jours (22/06–01/07) | 🟢 High |
| **MTTR** | ~2h | Durée entre premier CI fail et fix validé (session 01/07 : 16h05–16h44) | 🟢 High |
| **Change Failure Rate** | ~15% | Runs échoués / total runs sur PR #17 (CI #90–96) | 🟡 Medium |

**Référence :** Elite = top 25% des équipes selon le rapport DORA 2023.

### 5 KPIs Opérationnels

| KPI | Valeur | Source | Statut |
|---|---|---|---|
| Durée moyenne pipeline CI | 4m 30s | GitHub Actions (moyenne runs #92–96) | 🟢 Stable |
| Couverture tests nouveau code | 93% | SonarCloud / vitest --coverage | 🟢 > 80% requis |
| Taux de succès CI (branch ELK) | ~85% | GitHub Actions historique PR #17 | 🟡 À améliorer |
| Volume logs erreurs/h | < 1 error/h | Kibana — index p7-logs-* | 🟢 Faible |
| Taux 404 API | ~30% des requêtes | Kibana — filtre `level: warn` | 🟡 Normal en dev |

### Analyse commentée

**Points forts**

La **fréquence de déploiement** (1,1 merge/jour) et le **MTTR** (2h) sont dans la catégorie "High" des standards DORA — le pipeline CI/CD est fluide et les corrections arrivent rapidement grâce aux gates automatisés (SonarCloud, Trivy, ZAP).

Le **volume d'erreurs applicatif quasi nul** en conditions normales (confirmé par Kibana) valide la robustesse de la gestion des erreurs Express.

**Points à améliorer**

Le **Lead Time de 7 jours** intègre du temps de découverte d'outils (ELK, Kibana). Sur une feature fonctionnelle connue, ce délai serait de 1–2 jours.

Le **Change Failure Rate à 15%** reflète des échecs de configuration (port 5000 occupé sur macOS, lcov reporter manquant dans le CI) et non des bugs fonctionnels. Ces dettes CI sont désormais corrigées.

**Corrélation ELK → DORA**

Les logs `warn` (404) et `error` dans Kibana constituent un indicateur indirect du Change Failure Rate applicatif. Un seuil d'alerte à 5 `warn`/min ou 1 `error`/min en production serait pertinent pour détecter une régression en temps réel.

---

## Plan de sécurité

### Analyse SonarQube Cloud

SonarCloud analyse les sources `client/src` et `server/src` après chaque passage des tests. Il surveille :

- **Vulnérabilités** : failles de sécurité dans le code (injections, mauvaise gestion des secrets, etc.)
- **Code smells** : code fragile ou difficile à maintenir
- **Couverture de tests** : via les rapports LCOV générés par Vitest

#### Résultats — branch staging (juillet 2026)

| Indicateur | Valeur | Rating |
|---|---|---|
| Bugs | 0 | 🟢 A |
| Vulnérabilités actives | 0 (2 corrigées) | 🟢 A |
| Security Hotspots | 0 | 🟢 A |
| Code Smells | 26 | 🟢 A |
| Duplications | 0% | 🟢 A |
| Complexité cyclomatique | 178 / 1305 lignes | 🟡 Acceptable |
| Complexité cognitive | 76 | 🟡 À surveiller |
| Couverture nouveau code (PRs) | 93% | 🟢 > 80% |

#### Vulnérabilités identifiées

**V1 — CORS trop permissif** *(OWASP A05:2021 — Security Misconfiguration)*

`app.use(cors())` accepte toutes les origines. En production, n'importe quel site peut émettre des requêtes cross-origin vers l'API.

```typescript
// Fix recommandé
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:4200',
}));
```

**V2 — Divulgation de version Express** *(OWASP A05:2021)*

Le header `X-Powered-By: Express` révèle le framework utilisé et permet de cibler des CVE spécifiques.

```typescript
// Fix recommandé — 1 ligne
app.disable('x-powered-by');
```

#### Code Smells prioritaires

**Labels de formulaire non associés (×6)** — `ContactForm.tsx`, `OrganizationForm.tsx`

Violation des règles d'accessibilité WCAG 2.1. Les champs de formulaire ne sont pas liés à leurs labels (`htmlFor` manquant), rendant l'interface inutilisable pour les lecteurs d'écran.

**Ternaire imbriqué** — `ContactForm.tsx`

Complexité cognitive inutile. À extraire dans une variable nommée.

#### Couverture par couche

| Couche | Couverture |
|---|---|
| Controllers (contact, organization) | ~97% |
| Services (contact, organization) | ~100% |
| Repositories | exclus (wrappeurs Prisma) |

### Audit des dépendances (npm audit)

- Les dépendances de **production** sont bloquantes : toute vulnérabilité `high` ou `critical` arrête le pipeline
- Les dépendances de **développement** sont informatives : avertissement sans blocage
- Les paquets obsolètes sont signalés en avertissement

### Scan des images Docker (Trivy)

Les images buildées sont scannées par Trivy avant tout déploiement. Toute vulnérabilité `HIGH` ou `CRITICAL` dans une image arrête le pipeline.

### Analyse dynamique DAST (OWASP ZAP)

L'application est démarrée via Docker Compose puis soumise à un full scan ZAP qui simule des attaques réelles (XSS, injections, etc.). Les faux positifs connus sont exclus via `.zap/rules.tsv`.

### Plan d'actions priorisées

| Priorité | Action | Statut | Référence |
|---|---|---|---|
| 🔴 P1 | Restreindre CORS avec `ALLOWED_ORIGIN` | ✅ Fait | OWASP A05 |
| 🔴 P1 | Désactiver `X-Powered-By` | ✅ Fait | OWASP A05 |
| 🟡 P2 | Ajouter `helmet` (headers HTTP sécurisés) | ✅ Fait | OWASP A05 |
| 🟡 P2 | Tests controllers + services (couverture globale) | ✅ Fait (~97%) | SonarCloud |
| 🟡 P2 | Corriger labels formulaires (accessibilité WCAG) | ✅ Fait | SonarCloud |
| 🟢 P3 | Rate limiting sur `/api/logs` (anti-flood) | ✅ Fait (60 req/min) | OWASP A04 |
| 🟢 P3 | Externaliser toutes les config dans variables d'env | ✅ Fait | OWASP A02 |

### Bonnes pratiques CI

- **Secrets** : `SONAR_TOKEN` stocké dans GitHub Secrets, jamais en clair
- **Supply chain** : `npm install --ignore-scripts` empêche l'exécution de scripts malveillants à l'installation
- **Permissions GitHub** : le workflow déclare `contents: read` et `issues: write` uniquement — principe du moindre privilège
- **Alertes automatiques** : en cas d'échec du cron hebdomadaire, une GitHub Issue est créée ou mise à jour automatiquement

---

## Principes de conteneurisation et de déploiement

### Dockerfiles

**Client** ([client/Dockerfile](client/Dockerfile)) — build multi-stage :
1. Stage `builder` : Node 24-alpine compile le frontend Vite (`npm run build`)
2. Stage final : nginx:alpine sert les fichiers statiques (`dist/`), avec `apk upgrade` pour patcher les vulnérabilités OS

**Server** ([server/Dockerfile](server/Dockerfile)) — build multi-stage :
1. Stage `builder` : Node 24-alpine compile le TypeScript et génère le client Prisma
2. Stage final : Node 24-alpine avec uniquement les dépendances de production (`--omit=dev`), npm/npx supprimés pour réduire la surface d'attaque

### Docker Compose

[docker-compose.yml](docker-compose.yml) orchestre les deux services pour les environnements de test CI et de développement local :

- `p7-server` expose le port `8080`, monte un volume persistant pour la base SQLite
- `p7-client` expose le port `4200` (nginx), démarre après `p7-server`
- Les migrations Prisma s'exécutent automatiquement au démarrage du serveur

### Stratégie de déploiement

Le pipeline publie automatiquement les images sur **GitHub Container Registry (GHCR)** après chaque push validé sur `staging` ou `main`.

#### Flux de livraison

```
feature → staging  CI complet → image :staging (préprod)
                       ↓
                  PR vers main
                  (approbation humaine + tests obligatoires)
                       ↓
          main → CI complet → image :latest (prod)
```

- **Porte humaine** : merger `staging` → `main` nécessite une PR approuvée manuellement
- **Gardes-fous** : PR bloquée si tests échouent ou branche pas à jour (ruleset GitHub)

#### Conditions de déclenchement

La publication n'a lieu que si :
1. L'événement est un `push` sur `staging` ou `main` (pas les PR, pas le cron)
2. Les jobs `trivy` et `dast` ont réussi (images saines, app non vulnérable)

#### Images publiées

| Image | Tags produits |
|-------|--------------|
| `ghcr.io/<owner>/p7-client` | `staging` (push staging), `latest` (push main), `v1.0.0` (tag), `sha-abc1234` (toujours) |
| `ghcr.io/<owner>/p7-server` | `staging` (push staging), `latest` (push main), `v1.0.0` (tag), `sha-abc1234` (toujours) |

`docker/metadata-action@v6` génère automatiquement les tags selon le déclencheur.

#### Commandes importantes

| Commande | Objectif | Définie dans | Exécutée |
|----------|----------|--------------|----------|
| `docker/login-action@v4` | Authentification GHCR via `GITHUB_TOKEN` | `ci.yml` job `publish` | CI push staging, main ou tag |
| `docker/metadata-action@v6` | Génère les tags d'image selon le déclencheur | `ci.yml` job `publish` | CI push staging, main ou tag |
| `docker/build-push-action@v7` | Build + push image vers GHCR | `ci.yml` job `publish` | CI push staging, main ou tag |
| `docker compose build` | Build local pour scan Trivy/ZAP | `ci.yml` job `build` | CI tous déclencheurs |

#### Authentification

`GITHUB_TOKEN` est injecté automatiquement par GitHub Actions — aucun secret supplémentaire à configurer. Permission `packages: write` déclarée dans le workflow.

#### Utilisation des images publiées

```bash
docker pull ghcr.io/<owner>/p7-client:latest
docker pull ghcr.io/<owner>/p7-server:latest
```

---

## License

MIT
