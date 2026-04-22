# Smart AI Product Recommendation System

A production-ready, multi-channel AI-powered product recommendation system. Guides users through a structured questionnaire and delivers personalised 3-tier product recommendations via a Next.js web chat UI, WhatsApp (Twilio), and Instagram (Meta Messenger)  .

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
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
User logs in (email/password or Google OAuth)
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

- **JWT authentication** — email/password with OTP email verification + Google OAuth 2.0
- **Protected routes** — all pages require authentication; unauthenticated users are redirected to `/login`
- **No auth flash** — pages render `null` until token verification completes, eliminating the 1-second flash
- **Guided questionnaire** — 6 questions with conditional branching (Q4b appears only for $200+ budgets)
- **3-tier recommendations** — Basic (top 2 affordable), Intermediate (top 4 with reasoning), Premium (best match + bundle)
- **Multi-channel** — Web chat (Next.js), WhatsApp via Twilio, Instagram via Meta Messenger
- **Session persistence** — SQLite (dev) or PostgreSQL (prod), sessions survive server restarts
- **Dark-theme Next.js UI** — Glassmorphism, gradient accents, profile dropdown, settings page
- **Language toggle** — EN / PT language support across all pages and recommendations
- **Input validation** — Joi schemas on all endpoints, re-asks on invalid answers (max 3 attempts)
- **Rate limiting** — Per-IP limits on all API routes
- **Security** — Twilio signature verification, Meta HMAC-SHA256 webhook validation
- **Session cleanup** — Cron job removes expired sessions every 10 minutes
- **Graceful shutdown** — SIGTERM/SIGINT handling

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                          Clients                             │
│    Next.js (port 3001)    WhatsApp (Twilio)   Instagram      │
└────────┬──────────────────────┬────────────────────┬─────────┘
         │  /api/* proxy        │                    │
         ▼                      ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                  Express App  (src/app.js, port 3000)        │
│       Middleware: Helmet · CORS · Rate Limit · Validation    │
├──────────────────────────────────────────────────────────────┤
│  AuthController (JWT + Passport Google OAuth)                │
├──────────────────────────────────────────────────────────────┤
│           WebhookController  (unified handler)               │
├──────────────────┬───────────────────────────────────────────┤
│  Questionnaire   │  Recommendation    │  Offer               │
│   Service        │    Service         │  Service             │
│  (flow/parse)    │  (tag scoring)     │  (3-tier build)      │
├──────────────────┴───────────────────┴───────────────────────┤
│       Models: SessionModel · ProductModel                    │
├──────────────────────────────────────────────────────────────┤
│         Database: SQLite (dev) │ PostgreSQL (prod)           │
└──────────────────────────────────────────────────────────────┘
```

### Request flow

```
POST /api/webhook/web  (requires Bearer JWT)
  → requireAuth middleware (verifies JWT)
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
│   │   ├── passport.js               Passport Google OAuth 2.0 strategy
│   │   └── questionnaire.js          Question definitions + branching logic
│   ├── controllers/
│   │   ├── auth.controller.js        JWT login, OTP signup, Google OAuth, logout
│   │   ├── session.controller.js     GET /session/:id, POST /session/reset/:id
│   │   └── webhook.controller.js     Unified handler for web / WhatsApp / Instagram
│   ├── middleware/
│   │   ├── auth.js                   requireAuth (JWT), API key, Twilio, Meta HMAC
│   │   ├── rateLimiter.js            express-rate-limit instances
│   │   └── validation.js             Joi schemas for all endpoints
│   ├── models/
│   │   ├── product.model.js          Products CRUD (SQLite + PostgreSQL)
│   │   ├── session.model.js          Sessions CRUD, expiry, cleanup
│   │   └── user.model.js             Users + temp_users (OTP pending) tables
│   ├── services/
│   │   ├── email.service.js          Nodemailer OTP email sender
│   │   ├── offer.service.js          3-tier offer builder with bundle discount
│   │   ├── questionnaire.service.js  Flow control, answer parsing, branching
│   │   └── recommendation.service.js Tag/budget/keyword scoring engine
│   └── utils/
│       ├── logger.js                 Winston logger (file + console)
│       ├── migrate.js                Run DB migrations (idempotent)
│       ├── seed.js                   Seed sample products
│       └── whatsappFormatter.js      Format messages for WhatsApp/Instagram
├── frontend/                         Next.js 14 App Router frontend
│   ├── app/
│   │   ├── page.tsx                  Main chat UI (protected — requires auth)
│   │   ├── login/page.tsx            Sign-in page (email + Google)
│   │   ├── signup/page.tsx           Registration page (email + Google)
│   │   ├── verify-email/page.tsx     OTP verification step
│   │   ├── forgot-password/page.tsx  Password reset request + OTP confirm
│   │   ├── profile/page.tsx          User profile page (protected)
│   │   ├── settings/page.tsx         Account settings (protected)
│   │   └── auth/callback/page.tsx    Google OAuth redirect handler
│   ├── components/
│   │   ├── Header.tsx                Sticky header with profile dropdown
│   │   └── LeftPanel.tsx             Auth pages marketing panel
│   ├── lib/
│   │   └── api.ts                    Typed API client (all backend calls)
│   ├── next.config.js                Next.js config + /api/* + /auth/* rewrites
│   └── package.json
├── tests/
│   ├── unit/
│   │   ├── questionnaire.test.js
│   │   ├── recommendation.test.js
│   │   └── offer.test.js
│   ├── integration/
│   │   └── api.test.js
│   └── e2e/
│       └── conversation.spec.js
├── data/
│   ├── products.json
│   ├── questionnaire.json
│   └── database.db                   SQLite database (auto-created)
├── logs/
│   ├── app.log
│   └── error.log
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js
└── package.json
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### 1. Install dependencies

```bash
# Backend
cd project
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — see Environment Variables section below
```

### 3. Initialise the database

```bash
npm run migrate   # creates tables (idempotent — safe to re-run)
npm run seed      # inserts sample products
```

### 4. Start both servers

```bash
# Run backend + frontend together
npm run dev:all

# Or separately:
npm run dev            # backend on http://localhost:3000
npm run dev:frontend   # frontend on http://localhost:3001
```

Open **http://localhost:3001** — you will be redirected to `/login`.

### 5. Verify backend

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"...","uptime":12,"environment":"development"}
```

---

## Environment Variables

### Backend (`project/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Backend HTTP port |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `FRONTEND_URL` | No | `http://localhost:3001` | Used for Google OAuth redirect after login |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry (e.g. `7d`, `24h`) |
| `GOOGLE_CLIENT_ID` | Google OAuth | — | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | — | From Google Cloud Console |
| `EMAIL_USER` | OTP email | — | Gmail address used to send OTP codes |
| `EMAIL_PASS` | OTP email | — | Gmail app password (not your account password) |
| `EMAIL_FROM` | No | `EMAIL_USER` | Display name + address for outgoing emails |
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
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,http://localhost:3001` | CORS comma-separated allowed origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Requests per minute per IP |
| `LOG_LEVEL` | No | `info` | Winston log level |

### Frontend (`project/frontend/.env.local`)

```bash
BACKEND_URL=http://localhost:3000   # backend origin for Next.js rewrites
```

> **OTP in dev mode**: If `EMAIL_USER` / `EMAIL_PASS` are not set, OTP codes are printed to the backend console instead of emailed.

---

## Authentication

The system uses **custom JWT authentication** with no external auth SDK dependency.

### Flows

#### Email + Password (with OTP verification)

```
POST /api/auth/send-otp       → sends 6-digit code to email, returns tempUserId
POST /api/auth/verify-otp     → verifies code, creates user, returns { token, user }
POST /api/auth/resend-otp     → resends code to same email
POST /api/auth/login          → email + password login, returns { token, user }
POST /api/auth/forgot-password → sends reset OTP
POST /api/auth/reset-password  → verifies OTP + sets new password
POST /api/auth/logout         → invalidates server-side session
GET  /api/auth/me             → returns current user (requires Bearer token)
```

#### Google OAuth 2.0

```
GET /auth/google              → redirects to Google consent screen
GET /auth/google/callback     → Passport callback → redirects to:
                                {FRONTEND_URL}/auth/callback?token=<jwt>
```

The frontend `/auth/callback` page extracts the token from the URL, stores it in `localStorage`, calls `/api/auth/me`, then redirects to `/`.

### Token storage

The JWT is stored in `localStorage` as `smart_token`. All authenticated API calls include it as:

```
Authorization: Bearer <token>
```

### Route protection

Every protected page uses the same guard pattern:

```tsx
const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('smart_token');
  if (!token) { router.replace('/login'); return; }
  api.getMe()
    .then((me) => { setUser(me); setAuthChecked(true); })
    .catch(() => { router.replace('/login'); });
}, []);

if (!authChecked || !user) return null;  // prevents flash of protected content
```

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
  "timestamp": "2026-04-10T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

### Auth Endpoints

```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me              (requires Authorization: Bearer <token>)
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /auth/google
GET  /auth/google/callback
```

---

### Web Chat Webhook

```
POST /api/webhook/web
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "userId":    "user_abc123",
  "message":   "1",
  "language":  "en",
  "sessionId": "uuid-of-existing-session"
}
```

Response:
```json
{
  "sessionId":      "550e8400-...",
  "response":       "📋 *Question 2/6*\n\nWho is this for?...",
  "isComplete":     false,
  "question":       { "id": "q2", "type": "multiple_choice", "options": { "en": [...], "pt": [...] } },
  "questionNumber": 2,
  "totalQuestions": 6,
  "offers":         null
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
      "product": { "id": 4, "name": "...", "price": 199, "score": 95 },
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

### Product Catalog *(requires `x-api-key` header)*

```
GET /api/products?category=audio
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
Q6: Any specific requirements?              (text, optional)
```

- **Invalid answer**: system re-asks the same question (max 3 attempts, then skips optional questions)
- **Reset**: send `reset` or `restart` at any time (or click ↺ Reset in the UI)
- **Skip optional**: send `skip` on text questions
- **Language**: answers accepted in EN or PT based on the session language setting

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

**Bundle** is added to Premium when the user selected $200+ budget and chose "Yes, bundle sounds great!" — or when the top product scores ≥ 85%.

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

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:3000/auth/google/callback` to **Authorised redirect URIs** (dev)
4. Set env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## Database

The system auto-creates all tables on startup.

### users table

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Display name |
| email | VARCHAR | Unique email address |
| password_hash | VARCHAR | bcrypt hash (null for Google-only accounts) |
| google_id | VARCHAR | Google OAuth subject ID |
| created_at | TIMESTAMP | Registration date |
| last_seen | TIMESTAMP | Last `/api/auth/me` call |

### temp_users table

Holds OTP-pending registrations. Automatically cleaned up after verification or expiry.

### sessions table

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
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
| id | SERIAL | Primary key |
| name | VARCHAR | Product name |
| description | TEXT | Product description |
| price | DECIMAL | Price in USD |
| category | VARCHAR | e.g. `audio` |
| tags | JSON | Array of string tags used for scoring |
| features | JSON | Array of feature strings |
| stock | INTEGER | Inventory count |
| active | BOOLEAN | Only active products are recommended |

---

## Testing

```bash
npm test                   # all tests (unit + integration)
npm run test:unit          # unit tests only
npm run test:integration   # integration tests only
npm run test:coverage      # coverage report
```

Tests use an in-memory SQLite database — no external services needed.

---

## Deployment

### Docker (SQLite — simplest)

```bash
docker build -t smart-ai-recommendation .
docker run -d \
  --name smart-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-min-32-chars \
  -e API_KEY=your-admin-key \
  -e FRONTEND_URL=https://your-frontend.com \
  -v smart-ai-data:/app/data \
  smart-ai-recommendation
```

### Docker Compose (with PostgreSQL)

```bash
cp .env.example .env
# Set DB_TYPE=postgres, DATABASE_URL, JWT_SECRET, API_KEY, etc.
docker compose up -d
```

### Railway / Heroku

The app is 12-factor compatible. Set all required env vars in the dashboard and deploy from the repo root. Run `npm run migrate` as a one-off command after first deploy.

### PM2 (VPS / Ubuntu)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Frontend deployment

The Next.js frontend can be deployed independently to Vercel, Netlify, or any Node.js host:

```bash
cd frontend
npm run build
npm start
```

Set `BACKEND_URL` in the host's environment variables to point at your deployed backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Backend framework | Express 4 |
| Frontend framework | Next.js 14 (App Router) |
| Language | TypeScript (frontend) · JavaScript (backend) |
| Authentication | JWT · Passport.js Google OAuth 2.0 · bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Database (dev) | SQLite via better-sqlite3 |
| Database (prod) | PostgreSQL via pg |
| Validation | Joi |
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
| Dev server | Nodemon + Next.js dev server |

---

## License

MIT
