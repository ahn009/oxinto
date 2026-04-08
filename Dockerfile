# ── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS base

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Production image ─────────────────────────────────────
FROM node:20-alpine

# Install runtime deps for SQLite native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

# Copy node_modules from build stage
COPY --from=base /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeapp:nodejs src/ ./src/
COPY --chown=nodeapp:nodejs web/ ./web/
COPY --chown=nodeapp:nodejs package.json ./

# Create directories with correct permissions
RUN mkdir -p data logs && chown -R nodeapp:nodejs data logs

USER nodeapp

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/app.js"]
