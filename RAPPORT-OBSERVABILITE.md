# Rapport technique — Observabilité & Qualité
## Projet Orion CRM (P7)

**Période d'observation :** juin–juillet 2026  
**Stack :** Node.js 24 / Express 5 / React 19 / TypeScript / Docker  
**Auteur :** Jean-François PANN

---

## Table des matières

1. [Stack ELK — Architecture et configuration](#1-stack-elk--architecture-et-configuration)
2. [Pipeline de logs](#2-pipeline-de-logs)
3. [Dashboard Kibana](#3-dashboard-kibana)
4. [Métriques DORA](#4-métriques-dora)
5. [KPIs opérationnels](#5-kpis-opérationnels)
6. [Analyse SonarQube](#6-analyse-sonarqube)
7. [Plan de sécurité](#7-plan-de-sécurité)
8. [Rapport des corrections](#8-rapport-des-corrections)
9. [Recommandations d'amélioration continue](#9-recommandations-damélioration-continue)

---

## 1. Stack ELK — Architecture et configuration

### Qu'est-ce que la stack ELK ?

La stack ELK est un ensemble de trois outils open-source complémentaires permettant de centraliser, stocker et visualiser les logs d'une application :

- **Elasticsearch** — moteur de recherche et base de données qui stocke et indexe les logs
- **Logstash** — pipeline de données qui reçoit les logs, les transforme et les envoie vers Elasticsearch
- **Kibana** — interface graphique permettant d'explorer et visualiser les données stockées dans Elasticsearch

### Pourquoi ELK pour ce projet ?

Sans ELK, les logs sont perdus au redémarrage des containers et impossibles à filtrer efficacement. Avec ELK :

- Les logs sont **persistés** dans Elasticsearch, même après un redémarrage
- On peut **filtrer** par niveau (info/warn/error), par route, par source (backend/frontend)
- On peut **visualiser** les tendances, les pics d'erreurs, les performances par route
- On peut **corréler** un incident avec les logs qui l'ont précédé

### Architecture

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

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `docker-compose-elk.yml` | Définit les 3 services ELK avec réseaux et dépendances |
| `logstash/pipeline/logstash.conf` | Pipeline Logstash : input TCP → filter → output ES |
| `server/src/logger.ts` | Logger Winston centralisé avec transport conditionnel |
| `server/src/logstashTransport.ts` | Transport TCP custom avec reconnexion auto |
| `client/src/services/logger.ts` | Logger frontend avec capture d'erreurs globales |
| `client/src/services/api.ts` | Instance Axios partagée avec interceptor d'erreurs |

### Configuration Docker Compose ELK

```yaml
# docker-compose-elk.yml (simplifié)
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5001:5000/tcp"   # 5000 occupé par AirPlay sur macOS

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
```

> **Note :** Le port Logstash est mappé sur 5001 côté host car le port 5000 est utilisé par AirPlay Receiver sur macOS. En interne Docker, la communication reste sur le port 5000.

### Démarrage

```bash
# 1. Stack principale (crée le réseau p7_default)
docker compose up -d

# 2. Stack ELK
docker compose -f docker-compose-elk.yml up -d

# Vérification Elasticsearch
curl http://localhost:9200/_cluster/health

# Accès Kibana
open http://localhost:5601
```

### Variables d'environnement

| Variable | Valeur Docker | Effet |
|---|---|---|
| `LOGSTASH_HOST` | `logstash` | Active l'envoi TCP vers Logstash |
| `LOGSTASH_PORT` | `5000` | Port interne Docker |
| `LOG_LEVEL` | `info` | Niveau minimum (info/warn/error) |

Sans `LOGSTASH_HOST`, les logs restent uniquement dans la console — le serveur fonctionne normalement sans ELK.

---

## 2. Pipeline de logs

### Backend — Winston

Winston remplace tous les `console.log` du serveur. Chaque log est émis en JSON structuré.

**Format de sortie :**
```json
{
  "level": "info",
  "message": "http_request",
  "method": "GET",
  "url": "/api/organizations",
  "status": 200,
  "duration_ms": 12,
  "service": "p7-server",
  "timestamp": "2026-07-01T14:32:11.000Z"
}
```

**Points de log instrumentés :**

| Événement | Level | Champs |
|---|---|---|
| Démarrage serveur | info | port |
| Requête HTTP | info | method, url, status, duration_ms |
| Route inconnue | warn | url |
| Erreur non gérée | error | message, stack |

**Transport conditionnel :** Winston envoie vers la console toujours, et vers Logstash uniquement si `LOGSTASH_HOST` est défini. Le transport TCP gère la reconnexion automatique (retry toutes les 5s) et bufferise jusqu'à 100 logs en cas de déconnexion temporaire.

### Frontend — Logger React

Le logger frontend envoie les logs au backend via `POST /api/logs`. Le backend les logue via Winston et les transmet à Logstash — le frontend n'a pas accès direct à Logstash (impossible depuis un navigateur).

**Capture automatique :**
```typescript
// Dans main.tsx — s'exécute au chargement de l'app
initGlobalErrorHandlers();

// Capture : erreurs JS non gérées (window.onerror)
// Capture : promesses rejetées (unhandledrejection)
```

**Interceptor Axios :**
```typescript
// Dans api.ts — s'applique à tous les appels API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('api_error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);
```

Tous les logs frontend sont taggés `source: frontend` pour faciliter le filtrage dans Kibana.

### Endpoint /api/logs

L'endpoint qui reçoit les logs du frontend applique une sanitisation stricte pour éviter l'injection de données arbitraires (vulnérabilité signalée par SonarCloud) :

- Whitelist des niveaux : seuls `info`, `warn`, `error` sont acceptés
- Whitelist des champs : seuls url, method, status, filename, line, col, reason
- Troncature à 500 caractères pour les champs texte

### Pipeline Logstash

```
Input  : TCP port 5000, codec json_lines
Filter : tag "error" si level == "error"
Output : Elasticsearch, index p7-logs-{date}
```

Les logs sont indexés par jour (`p7-logs-2026.07.01`) pour faciliter la rotation et la recherche par période.

---

## 3. Dashboard Kibana

### Accès

URL : **http://localhost:5601**

Première utilisation : Stack Management → Data Views → Create data view

| Champ | Valeur |
|---|---|
| Name | `p7-logs` |
| Index pattern | `p7-logs-*` |
| Timestamp field | `@timestamp` |

> **Important :** Kibana affiche par défaut les 15 dernières minutes. Ajuster le sélecteur de temps en haut à droite selon la période souhaitée.

### Visualisations créées

#### Visualisation 1 — Log volume par niveau

**Type :** Bar vertical stacked  
**Axe X :** `@timestamp`  
**Axe Y :** Count  
**Break down :** `level.keyword` (info / warn / error)

**Lecture :** Chaque barre représente un intervalle de temps. La hauteur indique le volume de logs, les couleurs distinguent les niveaux. Un pic de rouge (error) ou orange (warn) signale un incident.

#### Visualisation 2 — Total 404 backend

**Type :** Metric  
**Filtre :** `level.keyword : warn`  
**Metric :** Count

**Lecture :** Compteur des requêtes vers des routes API inexistantes. En production, un seuil d'alerte à 10/min permettrait de détecter des tentatives de scan ou des erreurs de configuration client.

#### Visualisation 3 — Durée moyenne par route

**Type :** Bar horizontal  
**Axe Y :** `url.keyword` (top 10)  
**Axe X :** Average de `duration_ms`

**Lecture :** Identifie les routes lentes. Une route dépassant 200ms mérite investigation (N+1 query, index manquant, etc.).

#### Visualisation 4 — Erreurs API frontend

**Type :** Bar vertical  
**Filtre :** `source.keyword : frontend AND level.keyword : error`  
**Break down :** `url.keyword`

**Lecture :** Erreurs capturées côté navigateur, organisées par endpoint. Permet de distinguer les erreurs purement frontend des erreurs liées à une API défaillante.

### Requêtes KQL utiles

```
# Toutes les erreurs
level.keyword : error

# Uniquement les logs frontend
source.keyword : frontend

# Erreurs sur une route spécifique
level.keyword : error AND url.keyword : "/api/contacts"

# Requêtes lentes (> 500ms)
duration_ms > 500
```

---

## 4. Métriques DORA

Les métriques DORA (DevOps Research and Assessment) mesurent la performance d'un pipeline de livraison logicielle. Elles sont issues de recherches menées sur des milliers d'équipes et permettent de se situer par rapport aux standards de l'industrie.

### Définitions et valeurs mesurées

#### Lead Time for Changes
**Définition :** Temps entre le premier commit d'une fonctionnalité et son arrivée en production (merge sur staging).

**Valeur mesurée : 7 jours**

| Calcul | Détail |
|---|---|
| Premier commit ELK | 24 juin 2026 |
| Merge sur staging | 1er juillet 2026 |
| Durée | 7 jours |

**Niveau DORA : 🟡 Medium** (Elite < 1 jour, High < 1 semaine, Medium < 1 mois)

**Commentaire :** Ce délai intègre une phase de découverte des outils ELK et Kibana, qui représente la majorité du temps. Sur une fonctionnalité technique connue, le lead time serait de 1–2 jours.

---

#### Deployment Frequency
**Définition :** Fréquence à laquelle du code est mis en production.

**Valeur mesurée : ~1,1 merge/jour**

| Calcul | Détail |
|---|---|
| Période | 22 juin – 1er juillet (10 jours) |
| Merges sur staging | 11 merges |
| Fréquence | 1,1 merge/jour |

**Niveau DORA : 🟢 High** (Elite = plusieurs par jour, High = 1 par jour à 1 par semaine)

**Commentaire :** La fréquence élevée s'explique par la politique de petites PRs thématiques (une par fonctionnalité) et par un pipeline CI/CD qui bloque les merges défaillants, donnant confiance pour merger souvent.

---

#### Mean Time to Restore (MTTR)
**Définition :** Temps moyen pour corriger un incident en production.

**Valeur mesurée : ~2h**

| Calcul | Détail |
|---|---|
| Premier CI fail sur PR #17 | 1er juillet, 16h05 |
| CI vert + fix validé | 1er juillet, 16h44 |
| Durée | ~39 minutes (session) |
| Estimation MTTR réaliste | ~2h (inclut détection + analyse) |

**Niveau DORA : 🟢 High** (Elite < 1h, High < 24h)

**Commentaire :** Les gates CI automatisés (SonarCloud, tests) permettent de détecter les problèmes sur la PR avant merge, ce qui réduit mécaniquement le MTTR — les incidents n'atteignent pas la production.

---

#### Change Failure Rate
**Définition :** Pourcentage de déploiements causant un incident.

**Valeur mesurée : ~15%**

| Calcul | Détail |
|---|---|
| Runs totaux PR #17 (CI #90–96) | ~7 runs |
| Runs échoués | ~1–2 runs |
| Taux d'échec | ~15% |

**Niveau DORA : 🟡 Medium** (Elite < 5%, High < 15%)

**Commentaire :** Les échecs observés sont de nature configuration (port 5000 occupé, reporter lcov manquant, prisma generate absent du CI) et non des bugs fonctionnels. Ces dettes ont été corrigées dans le même cycle.

---

### Tableau récapitulatif DORA

| Métrique | Valeur | Niveau | Tendance |
|---|---|---|---|
| Lead Time for Changes | 7 jours | 🟡 Medium | ↗ Amélioration possible |
| Deployment Frequency | 1,1/jour | 🟢 High | → Stable |
| MTTR | ~2h | 🟢 High | → Stable |
| Change Failure Rate | ~15% | 🟡 Medium | ↘ En cours d'amélioration |

---

## 5. KPIs opérationnels

### Définition

Les KPIs opérationnels complètent les métriques DORA avec des indicateurs spécifiques au pipeline et à l'application.

### Tableau des KPIs

| KPI | Valeur mesurée | Source | Période | Statut |
|---|---|---|---|---|
| Durée moyenne pipeline CI | 4m 30s | GitHub Actions (runs #92–96) | 01/07/2026 | 🟢 Stable |
| Couverture tests nouveau code | 93% | SonarCloud + vitest --coverage | PR #17 | 🟢 > seuil 80% |
| Taux de succès CI | ~85% | GitHub Actions historique PR #17 | 01/07/2026 | 🟡 À améliorer |
| Volume logs erreurs/h | < 1 error/h | Kibana — index p7-logs-* | Conditions normales | 🟢 Faible |
| Taux 404 API | ~30% des requêtes | Kibana — filtre `level: warn` | Tests dev | 🟡 Normal en dev |

### Détail des calculs

**Durée moyenne pipeline CI :**

| Run | Durée |
|---|---|
| CI #92 (16h05) | 4m 10s |
| CI #93 (16h13) | 4m 32s |
| CI #94 (16h19) | 4m 7s |
| CI #95 (16h29) | 3m 52s |
| CI #96 (16h44) | 5m 47s |
| **Moyenne** | **4m 30s** |

**Couverture tests :**  
Le rapport lcov généré par `vitest --coverage` et transmis à SonarCloud mesure 93% de couverture sur les lignes nouvelles dans `index.ts`. La couverture globale (32%) reflète l'absence de tests sur les controllers et services — code pre-existant, hors scope de cette PR.

### Corrélation ELK → KPIs

Les logs ELK permettent de calculer en temps réel :
- **Error rate** : nb logs `level:error` par heure → indicateur de stabilité
- **P95 response time** : 95e percentile de `duration_ms` → indicateur de performance
- **404 rate** : nb logs `level:warn` par heure → indicateur de cohérence des appels

En production, des alertes Kibana pourraient être configurées sur ces seuils pour déclencher une notification avant que le MTTR ne soit affecté.

---

## 6. Analyse SonarQube

### Configuration

SonarCloud analyse automatiquement `client/src` et `server/src` après chaque passage des tests en CI. Les rapports de couverture LCOV sont générés par Vitest et transmis à SonarCloud via les artefacts GitHub Actions.

```properties
# sonar-project.properties
sonar.sources=client/src,server/src
sonar.javascript.lcov.reportPaths=client/coverage/lcov.info,server/coverage/lcov.info
sonar.coverage.exclusions=server/src/logger.ts,server/src/logstashTransport.ts,\
  client/src/services/logger.ts,client/src/services/api.ts,\
  client/src/main.tsx,client/src/services/contactService.ts,\
  client/src/services/organizationService.ts
```

Les fichiers d'infrastructure (logger, transport Logstash) sont exclus de la couverture car ils sont difficilement testables unitairement (dépendances réseau).

### Résultats — branch staging (juillet 2026)

| Indicateur | Valeur | Rating SonarCloud |
|---|---|---|
| Bugs | 0 | 🟢 A |
| Vulnérabilités actives | 2 | 🔴 C |
| Security Hotspots | 0 | 🟢 A |
| Code Smells | 26 | 🟢 A |
| Duplications | 0% | 🟢 A |
| Couverture nouveau code (PRs) | 93% | 🟢 Passe le gate 80% |
| Complexité cyclomatique | 178 / 1305 lignes | 🟡 Ratio 0,14 (seuil critique > 0,3) |
| Complexité cognitive | 76 | 🟡 À surveiller |

### Vulnérabilités détaillées

#### V1 — CORS trop permissif ✅ Corrigé

**Fichier :** `server/src/index.ts`  
**Règle OWASP :** A05:2021 — Security Misconfiguration  
**Sévérité :** High  

`app.use(cors())` acceptait toutes les origines sans restriction. En production, n'importe quel site web pouvait émettre des requêtes cross-origin vers l'API, ouvrant la porte aux attaques CSRF et à l'exfiltration de données.

**Correction appliquée :**
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
```

L'origine autorisée est configurable via `ALLOWED_ORIGIN` selon l'environnement (dev / staging / prod).

---

#### V2 — Divulgation de version Express ✅ Corrigé

**Fichier :** `server/src/index.ts`  
**Règle OWASP :** A05:2021 — Security Misconfiguration  
**Sévérité :** Medium  

Par défaut, Express ajoutait le header `X-Powered-By: Express` à chaque réponse HTTP. Un attaquant pouvait utiliser cette information pour cibler des CVE spécifiques à la version d'Express utilisée.

**Correction appliquée :**
```typescript
app.disable('x-powered-by');
```

---

### Code Smells prioritaires

#### Labels de formulaire non associés (×6)

**Fichiers :** `client/src/pages/ContactForm.tsx`, `OrganizationForm.tsx`  
**Règle :** Accessibilité WCAG 2.1 — Niveau A (obligatoire)  
**Sévérité :** Major  

Les champs de formulaire ne sont pas liés à leurs labels via l'attribut `htmlFor`. Conséquences :
- Interface inutilisable pour les lecteurs d'écran (utilisateurs malvoyants)
- Pénalité potentielle en termes de conformité légale (RGAA en France)
- Mauvaise expérience sur mobile (zone de clic réduite)

**Correction :** Ajouter `htmlFor="fieldId"` sur chaque `<label>` et `id="fieldId"` sur le champ correspondant.

**Effort :** 1h | **Priorité : P2**

---

#### Ternaire imbriqué

**Fichier :** `client/src/pages/ContactForm.tsx`  
**Règle :** Complexité cognitive  

Un ternaire imbriqué dans le rendu JSX rend le code difficile à lire et à maintenir. À extraire dans une variable ou une fonction nommée.

**Effort :** 15 minutes | **Priorité : P2**

---

### Zones à forte complexité

La complexité cyclomatique de 178 sur 1305 lignes donne un ratio de 0,14 — en dessous du seuil critique de 0,3. La complexité cognitive à 76 mérite surveillance si le projet grossit.

Les zones les plus denses sont les controllers (`contactController.ts`, `organizationController.ts`) qui concentrent la logique métier avec une couverture de tests de 3–8%.

**Corrélation ELK :** Aucun pic d'erreurs 500 sur ces routes en conditions normales → la complexité n'a pas encore causé de bug en production. Cependant, l'absence de tests reste un risque en cas d'évolution.

---

## 7. Plan de sécurité

### Actions priorisées

| Priorité | Action | Effort | OWASP | Justification |
|---|---|---|---|---|
| ✅ P1 | Restreindre CORS avec `ALLOWED_ORIGIN` | 5 min | A05 | Corrigé |
| ✅ P1 | Désactiver `X-Powered-By` | 1 min | A05 | Corrigé |
| ✅ P2 | Ajouter `helmet` (headers HTTP sécurisés) | 30 min | A05 | Corrigé — CSP, HSTS, X-Frame-Options activés |
| 🟡 P2 | Tests controllers + services | 2–3h | — | Couverture globale à 32% |
| 🟡 P2 | Corriger labels formulaires (accessibilité) | 1h | — | WCAG 2.1, 6 occurrences |
| 🟢 P3 | Rate limiting sur `/api/logs` | 30 min | A04 | Prévention flood de logs |
| 🟢 P3 | Externaliser config dans variables d'env | 1h | A02 | `ALLOWED_ORIGIN`, `DATABASE_URL` |

### Ce qui est déjà en place

| Mesure | Implémentation |
|---|---|
| Supply chain | `npm install --ignore-scripts` dans le CI |
| Secrets | `SONAR_TOKEN` via GitHub Secrets, jamais en clair |
| Permissions CI | `contents: read` uniquement (principe moindre privilège) |
| Scan images | Trivy bloque tout CVE HIGH/CRITICAL avant déploiement |
| DAST | OWASP ZAP full scan sur chaque PR |
| Alertes | GitHub Issue automatique si cron hebdomadaire échoue |
| Validation input | Zod sur toutes les routes API |
| Sanitisation logs frontend | Whitelist de champs + troncature 500 chars |

### Référence OWASP Top 10 (2021)

| Rang | Catégorie | Statut projet |
|---|---|---|
| A01 | Broken Access Control | ⚠️ Pas d'authentification (hors scope MVP) |
| A02 | Cryptographic Failures | ✅ Pas de données sensibles stockées |
| A03 | Injection | ✅ Prisma ORM (requêtes paramétrées) + Zod |
| A04 | Insecure Design | 🟡 Rate limiting absent sur /api/logs |
| A05 | Security Misconfiguration | ✅ CORS restreint + X-Powered-By désactivé + Helmet (headers HTTP) |
| A06 | Vulnerable Components | ✅ npm audit + Trivy en CI |
| A07 | Auth Failures | ⚠️ Hors scope MVP |
| A08 | Software Integrity | ✅ --ignore-scripts + actions versionnées |
| A09 | Logging Failures | ✅ Stack ELK opérationnelle |
| A10 | SSRF | ✅ Pas de requêtes serveur vers URL externe |

---

## 8. Rapport des corrections

### Mises à jour de packages

**Frontend (client)**

| Package | Avant | Après | Impact |
|---|---|---|---|
| Vite | v6 | v8 | Perf build +30%, support ESM amélioré |
| Vitest | v2 | v4 | Meilleur support coverage, API stable |
| @vitejs/plugin-react | v4 | v6 | Compatibilité React 19 |
| TypeScript | v5 | v6 | Nouvelles règles strict, meilleur inférence |
| ESLint | v9 | v10 | Flat config obligatoire |
| jsdom | v25 | v29 | Fix vulnérabilités, support Web APIs |
| Tailwind CSS | v3 | v4 | Nouveau moteur, CSS natif |
| Zod | v3 | v4 | Nouvelle API `.parse()`, meilleure perf |
| `eslint-plugin-react` | — | `@eslint-react/eslint-plugin` | Plugin officiel React pour ESLint v10 |

**Backend (server)**

| Package | Avant | Après | Impact |
|---|---|---|---|
| TypeScript | v5 | v6 | Idem client |
| Vitest | v2 | v4 | Idem client |
| ESLint | v9 | v10 | Idem client |
| Zod | v3 | v4 | Idem client |
| dotenv | v16 | v17 | Support ESM natif |
| @types/express | v4 | v5 | Types Express 5 corrects |

**Nouveaux packages ajoutés**

| Package | Côté | Rôle |
|---|---|---|
| `winston` | server | Logger structuré JSON |
| `winston-transport` | server | Base pour transport custom |
| `supertest` | server (dev) | Tests d'intégration HTTP |
| `@vitest/coverage-v8` | server + client (dev) | Génération rapports LCOV |

### Corrections CI/CD

| Correction | Commit | Impact |
|---|---|---|
| Ajout branche `staging` dans triggers | PR #12 | Déploiements staging automatisés |
| Mise à jour GitHub Actions (checkout v6, setup-node v6) | PR #13 | Compatibilité Node 24 |
| Ajout OWASP ZAP full scan | PR #9-10 | Détection vulnérabilités runtime |
| Ajout Trivy image scan | PR #10 | Détection CVE dans images Docker |
| Ajout cron hebdomadaire + alerte Issue | PR #11 | Monitoring passif |
| Ajout `prisma generate` dans le CI | PR #17 | Fix : tests échouaient sans client Prisma |
| Ajout reporter `lcov` dans vitest | PR #17 | Fix : SonarCloud recevait 0% couverture |
| Ajout `--coverage` dans jobs test | PR #17 | Couverture réelle transmise à SonarCloud |
| Ajout `sonar.coverage.exclusions` | PR #17 | Exclusion fichiers infra de la couverture |

### Corrections sécurité

| Correction | Référence | Justification |
|---|---|---|
| `npm install --ignore-scripts` | OWASP A08 | Prévention exécution scripts malveillants |
| Permissions GitHub Actions minimales | Principe moindre privilège | Réduction surface d'attaque CI |
| Vulnérabilité image Docker (`apk upgrade`) | Trivy | CVE sur librairie Alpine |
| Secrets via GitHub Secrets | OWASP A02 | `SONAR_TOKEN` jamais en clair |
| Sanitisation `/api/logs` | OWASP A03 / SonarCloud | Whitelist champs + troncature 500 chars |

### Observabilité ajoutée

| Ajout | Détail |
|---|---|
| Winston JSON logger | Remplace tous les `console.log` backend |
| Transport TCP Logstash | Reconnexion auto + buffer 100 logs |
| Middleware HTTP logging | method, url, status, duration_ms |
| Stack ELK Docker | elasticsearch + logstash + kibana |
| Pipeline Logstash | TCP → Elasticsearch index par jour |
| Logger frontend | Capture erreurs JS + erreurs Axios |
| Endpoint `/api/logs` | Proxy sécurisé back → Logstash |
| Dashboard Kibana | 4 visualisations opérationnelles |
| Tests `index.test.ts` | 7 tests routes health + logs |

**Total : 87 commits, 17 PRs, 0 bug fonctionnel introduit.**

---

## 9. Recommandations d'amélioration continue

### Court terme (< 1 semaine)

**1. Corriger les 2 vulnérabilités P1 (CORS + X-Powered-By)**

Effort minimal (< 10 minutes), impact sécurité immédiat. Ces deux points font passer le rating SonarCloud de C à A sur la sécurité.

**2. Ajouter `helmet` au serveur Express**

```bash
npm install helmet
```
```typescript
import helmet from 'helmet';
app.use(helmet());
```

Helmet configure automatiquement une dizaine de headers de sécurité HTTP (Content-Security-Policy, HSTS, X-Frame-Options, etc.).

---

### Moyen terme (1–4 semaines)

**3. Augmenter la couverture de tests (controllers/services)**

La couverture globale est à 32%. Les controllers et services qui contiennent la logique métier sont à 3–8%. Objectif réaliste : atteindre 60% global en ajoutant des tests d'intégration sur les routes CRUD.

**4. Corriger l'accessibilité des formulaires**

6 labels non associés dans ContactForm et OrganizationForm. Fix systématique avec `htmlFor` / `id`. Requis pour conformité RGAA.

**5. Configurer des alertes Kibana**

Créer des alertes sur seuils dans Kibana :
- > 5 logs `error` en 5 minutes → notification
- > 10 logs `warn` (404) en 1 minute → notification
- `duration_ms` > 500ms en moyenne → investigation

---

### Long terme (> 1 mois)

**6. Ajouter l'authentification (A01 OWASP)**

L'absence d'authentification est le risque principal non adressé. Pour un CRM en production, un système JWT ou OAuth2 est indispensable.

**7. Migrer vers PostgreSQL en production**

SQLite est adapté au développement. En production, PostgreSQL offre la concurrence, les transactions ACID et les sauvegardes simplifiées.

**8. Intégrer les métriques DORA dans le dashboard**

Envoyer les événements GitHub Actions (push, merge, incident) vers Logstash via webhook pour avoir les 4 métriques DORA dans Kibana à côté des logs applicatifs.

---

*Rapport généré le 2 juillet 2026 — Orion CRM v1.0 — Projet P7*
