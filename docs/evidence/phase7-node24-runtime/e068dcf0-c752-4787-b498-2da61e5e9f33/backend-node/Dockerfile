# ==========================================
# Production Stage
# ==========================================
FROM node:24-alpine

WORKDIR /app

# Bound build-time Node memory; this does not set the running service's heap.
ARG NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=4"

# Set production environment
ENV NODE_ENV=production

# Install dumb-init for proper signal forwarding and zombie process reaping
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Change ownership to standard non-root node user
RUN chown -R node:node /app

USER node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
