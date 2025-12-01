# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN npm ci --workspace=shared
COPY shared/ ./shared/
COPY tsconfig.json ./
RUN npm run build --workspace=shared

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist
RUN npm ci --workspace=frontend
COPY frontend/ ./frontend/
COPY shared/ ./shared/
COPY tsconfig.json ./
RUN npm run build --workspace=frontend

# Stage 3: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist
RUN npm ci --workspace=backend
COPY backend/ ./backend/
COPY shared/ ./shared/
COPY tsconfig.json ./
RUN npm run build --workspace=backend

# Stage 4: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm ci --omit=dev --workspace=backend --workspace=shared

# Copy built artifacts
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "backend/dist/index.js"]
