# Deployment Guide — Smart AI Recommendation System

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone <your-repo>
cd smart-ai-recommendation
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set at minimum: API_KEY, PORT

# 3. Initialize and seed the database
npm run migrate
npm run seed

# 4. Start in development mode (with hot-reload)
npm run dev:all

# App available at: http://localhost:3000
# Chat UI:          http://localhost:3000
# Health check:     http://localhost:3000/api/health
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `3000` | HTTP server port |
| `APP_URL` | Yes (prod) | — | Full public URL (for webhook signatures) |
| `DB_TYPE` | No | `sqlite` | `sqlite` (dev) or `postgres` (prod) |
| `DATABASE_URL` | Postgres only | — | PostgreSQL connection string |
| `API_KEY` | Yes | — | Shared key for protected admin endpoints |
| `SESSION_TIMEOUT_MINUTES` | No | `30` | Session inactivity timeout |
| `TWILIO_ACCOUNT_SID` | WhatsApp | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | WhatsApp | — | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | — | e.g. `whatsapp:+14155238886` |
| `META_APP_SECRET` | Instagram | — | Meta app secret for signature verification |
| `META_PAGE_ACCESS_TOKEN` | Instagram | — | Page access token for sending messages |
| `META_VERIFY_TOKEN` | Instagram | — | Token for webhook verification |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS comma-separated origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per minute per IP |

---

## Docker Deployment

### Option A: SQLite (single container, simplest)

```bash
# Build and run
docker build -t smart-ai-recommendation .
docker run -d \
  --name smart-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_TYPE=sqlite \
  -e DB_PATH=/app/data/database.db \
  -e API_KEY=your-secure-key \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  smart-ai-recommendation

# Seed the database
docker exec smart-ai node src/utils/seed.js
```

### Option B: PostgreSQL (production-grade)

```bash
# 1. Set up .env with Postgres credentials
# 2. Start with docker-compose
docker-compose up -d

# 3. Seed products
docker-compose exec app node src/utils/seed.js

# View logs
docker-compose logs -f app
```

---

## Railway Deployment

1. Create a new Railway project
2. Connect your GitHub repository
3. Add a PostgreSQL plugin
4. Set environment variables (copy from `.env.example`)
5. Set `DATABASE_URL` from the Railway Postgres plugin
6. Set `DB_TYPE=postgres`
7. In the deploy settings, set **Start Command**: `node src/app.js`
8. After deploy, run seed: `railway run node src/utils/seed.js`

---

## Heroku Deployment

```bash
# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set config vars
heroku config:set NODE_ENV=production
heroku config:set DB_TYPE=postgres
heroku config:set API_KEY=your-secure-key
heroku config:set APP_URL=https://your-app-name.herokuapp.com
# ... (set all other env vars)

# Deploy
git push heroku main

# Seed products
heroku run node src/utils/seed.js
```

---

## PM2 Production Deployment (VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs smart-ai-recommendation
pm2 monit
```

---

## WhatsApp (Twilio) Setup

1. Create a Twilio account at twilio.com
2. Enable the WhatsApp Sandbox (or production sender)
3. Set webhook URL in Twilio Console:
   - **Incoming messages**: `https://your-domain.com/api/webhook/whatsapp`
   - **Method**: POST
4. Add Twilio credentials to `.env`
5. Test by sending "start" to your Twilio WhatsApp number

---

## Instagram / Meta Setup

1. Create a Meta App at developers.facebook.com
2. Enable "Messenger" product
3. Add a Facebook Page
4. Set webhook:
   - **Callback URL**: `https://your-domain.com/api/webhook/instagram`
   - **Verify Token**: set `META_VERIFY_TOKEN` in `.env` first
   - **Subscriptions**: `messages`, `messaging_postbacks`
5. Generate a Page Access Token and set `META_PAGE_ACCESS_TOKEN`

---

## API Reference

### POST /api/webhook/web
Web chat endpoint.

**Request:**
```json
{
  "userId": "user-123",
  "message": "start",
  "sessionId": "uuid (optional, for resuming)",
  "language": "en"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "response": "Question text...",
  "isComplete": false,
  "question": { "id": "q1", "type": "multiple_choice", ... },
  "questionNumber": 1,
  "totalQuestions": 6,
  "offers": null
}
```

### GET /api/health
Returns `{ "status": "ok", "timestamp": "...", "uptime": 123 }`

### GET /api/products?category=audio&limit=20
Returns paginated product catalog.

### GET /api/session/:id _(requires X-API-Key header)_
Returns full session details.

### POST /api/session/reset/:id _(requires X-API-Key header)_
Deletes a session so the user can start fresh.

---

## Running Tests

```bash
# Unit tests (no DB required)
npm run test:unit

# Integration tests (SQLite, auto-managed)
npm run test:integration

# All tests with coverage
npm run test:coverage

# E2E tests (requires running server)
npm run test:e2e
```
