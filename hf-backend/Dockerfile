FROM node:20-alpine

# HF Spaces requires UID 1000
RUN addgroup -g 1000 -S appgroup && adduser -S appuser -u 1000 -G appgroup

# Build tools needed for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup package.json ./

# Create writable directories
RUN mkdir -p /app/data /app/logs && chown -R appuser:appgroup /app/data /app/logs

USER appuser

# HF Spaces requires port 7860
EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

CMD ["node", "src/app.js"]
