# Orion CRM

A simplified Customer Relationship Management (CRM) application built with the MERN stack (modernized with TypeScript, Vite, and Prisma).

## Architecture

This project follows a monorepo structure with separate frontend and backend applications:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 22 + Express 5 + TypeScript + Prisma

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

- **Node.js 22 LTS**: JavaScript runtime
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

## Plan de testing périodique

### Types de tests

| Périmètre | Framework | Localisation |
|-----------|-----------|--------------|
| Frontend (React/TypeScript) | Vitest | `client/` |
| Backend (Express/Prisma) | Vitest | `server/` |

### Déclencheurs

| Événement | Jobs exécutés |
|-----------|---------------|
| `push` sur `main` | Audit dépendances → Tests → SonarCloud + Build Docker |
| `pull_request` vers `main` | Idem — bloque le merge si échec |
| Cron hebdomadaire (lundi 3h) | Pipeline complet + alerte GitHub Issue si échec |
| `workflow_dispatch` | Exécution manuelle à la demande |

### Objectifs

- **Validation fonctionnelle** : chaque test unitaire/intégration valide un comportement métier
- **Non-régression** : les tests s'exécutent sur chaque PR pour détecter toute régression avant merge
- **Qualité** : SonarCloud mesure la couverture, les code smells et la dette technique en continu

---

## Plan de sécurité

### Analyse SonarQube Cloud

SonarCloud analyse les sources `client/src` et `server/src` après chaque passage des tests. Il surveille :

- **Vulnérabilités** : failles de sécurité dans le code (injections, mauvaise gestion des secrets, etc.)
- **Code smells** : code fragile ou difficile à maintenir
- **Couverture de tests** : via les rapports LCOV générés par Vitest

### Audit des dépendances (npm audit)

- Les dépendances de **production** sont bloquantes : toute vulnérabilité `high` ou `critical` arrête le pipeline
- Les dépendances de **développement** sont informatives : avertissement sans blocage
- Les paquets obsolètes sont signalés en avertissement

### Scan des images Docker (Trivy)

Les images buildées sont scannées par Trivy avant tout déploiement. Toute vulnérabilité `HIGH` ou `CRITICAL` dans une image arrête le pipeline.

### Analyse dynamique DAST (OWASP ZAP)

L'application est démarrée via Docker Compose puis soumise à un full scan ZAP qui simule des attaques réelles (XSS, injections, etc.). Les faux positifs connus sont exclus via `.zap/rules.tsv`.

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

Le pipeline publie automatiquement les images sur **GitHub Container Registry (GHCR)** après chaque push validé sur `main`.

#### Conditions de déclenchement

La publication n'a lieu que si :
1. L'événement est un `push` sur `main` (pas les PR, pas le cron)
2. Les jobs `trivy` et `dast` ont réussi (images saines, app non vulnérable)

#### Images publiées

| Image | Tags |
|-------|------|
| `ghcr.io/<owner>/p7-client` | `latest`, `<sha>` |
| `ghcr.io/<owner>/p7-server` | `latest`, `<sha>` |

Le tag `latest` pointe toujours sur le dernier build validé. Le tag SHA permet de revenir à une version précise.

#### Commandes importantes

| Commande | Objectif | Définie dans | Exécutée |
|----------|----------|--------------|----------|
| `docker/login-action@v4` | Authentification GHCR via `GITHUB_TOKEN` | `ci.yml` job `publish` | CI push main |
| `docker/build-push-action@v7` | Build + push image vers GHCR | `ci.yml` job `publish` | CI push main |
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
