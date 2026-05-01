# syntax=docker/dockerfile:1

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY ui/package.json ./ui/
COPY api/package.json ./api/

RUN npm ci

COPY ui/ ./ui/
COPY api/ ./api/

RUN npm run build && npm run build:api

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY ui/package.json ./ui/
COPY api/package.json ./api/

RUN npm ci --omit=dev

COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/ui/dist ./ui/dist

ENV NODE_ENV=production
ENV UI_DIST_DIR=../../ui/dist

EXPOSE 3000

CMD ["node", "api/dist/index.js"]
