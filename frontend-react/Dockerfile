# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_MAP_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAP_API_URL=$VITE_MAP_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ==========================================
# Production Stage (Nginx)
# ==========================================
FROM nginx:1.27-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
