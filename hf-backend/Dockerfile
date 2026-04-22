FROM node:20-alpine

# Build tools needed for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY --chown=node:node src/ ./src/
COPY --chown=node:node package.json ./

# Create writable directories
RUN mkdir -p /app/data /app/logs && chown -R node:node /app/data /app/logs

USER node

# HF Spaces requires port 7860
EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

CMD ["node", "src/app.js"]
