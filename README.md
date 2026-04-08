# Smart AI Product Recommendation System

A production-ready, multi-channel AI-powered product recommendation system. Guides users through a structured questionnaire and delivers personalised 3-tier product recommendations via a dark-theme web chat UI, WhatsApp (Twilio), and Instagram (Meta Messenger).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Questionnaire Flow](#questionnaire-flow)
- [Recommendation Engine](#recommendation-engine)
- [Channel Integration](#channel-integration)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Overview

This system is **not a chatbot** — it is a system-driven guided questionnaire. The system asks every question; the user only provides answers. No free-form intent recognition or topic switching is involved.

```
User opens chat
      │
      ▼
System asks Q1 → User answers → System asks Q2 → … → System asks Q6
      │
      ▼
Scoring engine matches answers against product catalog
      │
      ▼
3-tier recommendations returned (Basic / Intermediate / Premium)
```

---

## Features

- **Guided questionnaire** — 6 questions with conditional branching (Q4b appears only for $200+ budgets)
- **3-tier recommendations** — Basic (top 2 affordable), Intermediate (top 4 with reasoning), Premium (best match + bundle)
- **Multi-channel** — Web chat, WhatsApp via Twilio, Instagram via Meta Messenger
- **Session persistence** — SQLite (dev) or PostgreSQL (prod), sessions survive server restarts
- **Dark-theme UI** — Glassmorphism, gradient accents, SVG icons, quick-reply buttons
- **Input validation** — Joi schemas on all endpoints, re-asks on invalid answers (max 3 attempts)
- **Rate limiting** — Per-IP limits on all API routes
- **Security** — Twilio signature verification, Meta HMAC-SHA256 webhook validation, API key auth for admin routes
- **Session cleanup** — Cron job removes expired sessions every 10 minutes
- **Graceful shutdown** — SIGTERM/SIGINT handling
- **50 passing tests** — Unit + integration coverage

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Clients                         │
│   Web Browser    WhatsApp (Twilio)   Instagram (Meta)│
└────────┬─────────────────┬──────────────────┬───────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────┐
│              Express App  (src/app.js)               │
│  Middleware: Helmet · CORS · Rate Limit · Validation │
├─────────────────────────────────────────────────────┤
│           WebhookController  (unified handler)       │
├───────────────┬──────────────────────────────────────┤
│ Questionnaire │  Recommendation  │  Offer            │
│   Service     │    Service       │  Service          │
│  (flow/parse) │  (tag scoring)   │  (3-tier build)   │
├───────────────┴──────────────────┴──────────────────┤
│       Models: SessionModel · ProductModel            │
├─────────────────────────────────────────────────────┤
│         Database: SQLite (dev) │ PostgreSQL (prod)   │
└─────────────────────────────────────────────────────┘
```

### Request flow

```
POST /api/webhook/web
  → validate(schemas.webMessage)
  → WebhookController.handleWeb
      → SessionModel.findActiveByUserChannel   (find or create session)
      → QuestionnaireService.processAnswer     (validate + advance question)
      → OfferService.generate                  (when last question answered)
          → RecommendationService.score        (tag + budget + keyword scoring)
      → JSON response with { sessionId, response, question, offers }
```

---

## Project Structure

```
project/
├── src/
│   ├── app.js                        Express server, routes, startup
│   ├── config/
│   │   ├── database.js               SQLite / PostgreSQL init + table creation
│   │   └── questionnaire.js          Question definitions + branching logic
│   ├── controllers/
│   │   ├── session.controller.js     GET /session/:id, POST /session/reset/:id, GET /products
│   │   └── webhook.controller.js     Unified handler for web / WhatsApp / Instagram
│   ├── middleware/
│   │   ├── auth.js                   API key auth, Twilio signature, Meta HMAC
│   │   ├── rateLimiter.js            express-rate-limit instances
│   │   └── validation.js             Joi schemas for all endpoints
│   ├── models/
│   │   ├── product.model.js          Products CRUD (SQLite + PostgreSQL)
│   │   └── session.model.js          Sessions CRUD, expiry, cleanup
│   ├── services/
│   │   ├── offer.service.js          3-tier offer builder with bundle discount
│   │   ├── questionnaire.service.js  Flow control, answer parsing, branching
│   │   └── recommendation.service.js Tag/budget/keyword scoring engine
│   └── utils/
│       ├── logger.js                 Winston logger (file + console)
│       ├── migrate.js                Run DB migrations (idempotent)
│       ├── seed.js                   Seed sample products
│       └── whatsappFormatter.js      Format messages for WhatsApp/Instagram
├── web/
│   ├── index.html                    Dark-theme chat UI (vanilla JS, no framework)
│   └── favicon.svg                   SVG favicon (gradient sparkle icon)
├── tests/
│   ├── unit/
│   │   ├── questionnaire.test.js     Service unit tests
│   │   ├── recommendation.test.js    Scoring engine tests
│   │   └── offer.test.js             Tier-building tests
│   ├── integration/
│   │   └── api.test.js               Full HTTP endpoint tests (supertest)
│   └── e2e/
│       └── conversation.spec.js      Playwright end-to-end flow
├── data/
│   ├── products.json                 Sample product catalog (6 products)
│   ├── questionnaire.json            Question definitions (reference copy)
│   └── database.db                  SQLite database (auto-created)
├── logs/
│   ├── app.log                       Combined log (rotating, 10MB max)
│   └── error.log                     Error-only log
├── .env.example                      Environment variable template
├── Dockerfile                        Multi-stage Docker build
├── docker-compose.yml                SQLite + PostgreSQL compose configs
├── ecosystem.config.js               PM2 process manager config
├── package.json
└── DEPLOYMENT.md                     Detailed deployment guide
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### 1. Install dependencies

```bash
cd project
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set API_KEY
```

### 3. Initialise the database

```bash
npm run migrate   # creates tables (idempotent — safe to re-run)
npm run seed      # inserts 6 sample products
```

### 4. Start development server

```bash
npm run dev       # nodemon with hot-reload
```

Open **http://localhost:3000** — the chat UI loads instantly.

### 5. Verify

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"...","uptime":12,"environment":"development"}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `DB_TYPE` | No | `sqlite` | `sqlite` or `postgres` |
| `DB_PATH` | No | `./data/database.db` | SQLite file path |
| `DATABASE_URL` | Postgres only | — | Full PostgreSQL connection string |
| `DB_SSL` | No | `false` | Set `true` to enable SSL for Postgres |
| `API_KEY` | Yes | — | Shared secret for admin endpoints (`x-api-key` header) |
| `APP_URL` | Prod/WhatsApp | — | Full public URL e.g. `https://your-app.railway.app` |
| `SESSION_TIMEOUT_MINUTES` | No | `30` | Session inactivity timeout |
| `SESSION_CLEANUP_INTERVAL_MINUTES` | No | `10` | How often expired sessions are purged |
| `TWILIO_ACCOUNT_SID` | WhatsApp | — | From Twilio console |
| `TWILIO_AUTH_TOKEN` | WhatsApp | — | From Twilio console |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | — | e.g. `whatsapp:+14155238886` |
| `META_APP_SECRET` | Instagram | — | From Meta developer dashboard |
| `META_PAGE_ACCESS_TOKEN` | Instagram | — | Long-lived page token |
| `META_VERIFY_TOKEN` | Instagram | — | Any secret string you choose |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS comma-separated allowed origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Requests per minute per IP |
| `LOG_LEVEL` | No | `info` | Winston log level |

---

## API Reference

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

### Web Chat Webhook

```
POST /api/webhook/web
Content-Type: application/json
```

Request body:
```json
{
  "userId":    "web_abc123",
  "message":   "1",
  "language":  "en",
  "sessionId": "uuid-of-existing-session"  // optional
}
```

Response:
```json
{
  "sessionId":     "550e8400-...",
  "response":      "📋 *Question 2/6*\n\nWho is this for?...",
  "isComplete":    false,
  "question":      { "id": "q2", "type": "multiple_choice", "options": {...} },
  "questionNumber": 2,
  "totalQuestions": 6,
  "offers":        null
}
```

When all questions are answered, `isComplete: true` and `offers` is populated:

```json
{
  "isComplete": true,
  "offers": {
    "basic":        [ { "id": 1, "name": "...", "price": 49, "score": 65 } ],
    "intermediate": [ { "id": 3, "name": "...", "price": 149, "score": 85, "reason": "..." } ],
    "premium": {
      "product": { "id": 4, "name": "...", "price": 199, "score": 95, "isHighConfidence": true },
      "bundle":  { "items": ["Premium carry case", "3-year warranty"], "totalPrice": 228.69, "savings": 25.41 }
    }
  }
}
```

---

### WhatsApp Webhook (Twilio)

```
POST /api/webhook/whatsapp
```

Twilio sends URL-encoded form data. The system responds `<Response/>` (TwiML) and proactively sends the reply via Twilio API.

---

### Instagram Webhook (Meta)

```
GET  /api/webhook/instagram   # Hub verification challenge
POST /api/webhook/instagram   # Incoming message events
```

---

### Session Management *(requires `x-api-key` header)*

```
GET  /api/session/:id           # Get full session state
POST /api/session/reset/:id     # Delete session (user starts over)
```

---

### Product Catalog

```
GET /api/products?category=audio&limit=20&offset=0
```

Response:
```json
{
  "products": [ { "id": 1, "name": "...", "price": 49, "tags": [...], "features": [...] } ],
  "count": 6
}
```

---

## Questionnaire Flow

```
Q1: What problem are you trying to solve?   (multiple choice)
Q2: Who is this product for?                (multiple choice)
Q3: What is most important to you?          (multiple choice)
Q4: What is your budget range?              (multiple choice)
  └─ IF answer = "$200+" → Q4b: Bundle interest?   (conditional branch)
Q5: How urgently do you need this?          (multiple choice)
Q6: Any specific requirements?             (text, optional)
```

- **Invalid answer**: system re-asks the same question (max 3 attempts, then skips optional questions)
- **Reset**: send `reset` or `restart` at any time
- **Skip optional**: send `skip` on text questions

---

## Recommendation Engine

Scoring is tag-based (0–100 points total):

| Signal | Points | Logic |
|---|---|---|
| Budget compatibility | 25 | Full if price within range; partial credit within 20% overflow |
| Tag overlap | 20 | Proportional to % of user tags matched on product |
| Feature keyword match | 25 | Free-text Q6 keywords matched against product features + description |
| Category heuristic | 30 | Awarded based on tag alignment score |

Products are sorted by score descending. The 3 tiers are built from this sorted list:

| Tier | Products | Minimum Score |
|---|---|---|
| Basic | Top 2, cheapest first | 50 |
| Intermediate | Top 4, by score | 50 |
| Premium | #1 product + optional bundle | Any (flags `isHighConfidence` if ≥ 85) |

**Bundle** is added to Premium when the user selected $200+ budget (triggers Q4b) and chose "Yes, bundle sounds great!" — or when the top product scores ≥ 85%.

---

## Channel Integration

### WhatsApp via Twilio

1. Create a Twilio account and activate a WhatsApp Sandbox or approved number
2. Set webhook URL to `https://your-domain.com/api/webhook/whatsapp`
3. Set env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
4. Twilio signature verification is enforced in production automatically

### Instagram via Meta

1. Create a Meta developer app and configure a Messenger webhook
2. Set webhook URL to `https://your-domain.com/api/webhook/instagram`
3. Use `META_VERIFY_TOKEN` for the hub verification step
4. Set env vars: `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_VERIFY_TOKEN`

---

## Database

The system auto-creates all tables on startup — no manual migration needed for a fresh install.

### sessions table

| Column | Type | Description |
|---|---|---|
| id | UUID / TEXT | Primary key |
| channel | VARCHAR | `web`, `whatsapp`, `instagram` |
| user_id | VARCHAR | Platform user ID |
| current_question_index | INTEGER | 0-based index into question flow |
| responses | JSON | Array of `{ questionId, answerIndex, answerText, skipped }` |
| completed | BOOLEAN | True when all questions answered |
| recommendations | JSON | Stored offer result after completion |
| metadata | JSON | Language, invalid attempt counters, etc. |
| expires_at | TIMESTAMP | Auto-extended on each interaction |

### products table

| Column | Type | Description |
|---|---|---|
| id | SERIAL / INTEGER | Primary key |
| name | VARCHAR | Product name |
| description | TEXT | Product description |
| price | DECIMAL | Price in USD |
| category | VARCHAR | e.g. `audio` |
| tags | JSON | Array of string tags used for scoring |
| features | JSON | Array of feature strings |
| images | JSON | Array of image URLs |
| stock | INTEGER | Inventory count |
| active | BOOLEAN | Only active products are recommended |

---

## Testing

```bash
npm test              # all tests (unit + integration)
npm run test:unit     # unit tests only
npm run test:integration  # integration tests only (requires running DB)
npm run test:coverage # coverage report
```

Tests use an in-memory SQLite database — no external services needed.

Current coverage: **50 tests, all passing**.

---

## Deployment

### Docker (SQLite — simplest)

```bash
docker build -t smart-ai-recommendation .
docker run -d \
  --name smart-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e API_KEY=your-secret-key \
  -v smart-ai-data:/app/data \
  smart-ai-recommendation
```

### Docker Compose (with PostgreSQL)

```bash
cp .env.example .env
# Set DB_TYPE=postgres, DATABASE_URL, API_KEY etc.
docker compose up -d
```

### Railway / Heroku

The app is 12-factor compatible. Set all required env vars in the dashboard and deploy from the repo root. The `npm run migrate` and `npm run seed` can be run as a one-off command after first deploy.

### PM2 (VPS / Ubuntu)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database (dev) | SQLite via better-sqlite3 |
| Database (prod) | PostgreSQL via pg |
| Validation | Joi |
| Authentication | API key + Twilio HMAC + Meta HMAC-SHA256 |
| Rate limiting | express-rate-limit |
| Logging | Winston |
| Security headers | Helmet |
| Compression | compression |
| Scheduled jobs | node-cron |
| WhatsApp | Twilio |
| Instagram | Meta Messenger API |
| Testing | Jest + Supertest + Playwright |
| Process manager | PM2 |
| Containerisation | Docker + Docker Compose |
| Dev server | Nodemon |

---

## License

MIT
