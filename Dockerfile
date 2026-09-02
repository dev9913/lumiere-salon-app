# =========================  Stage 1 - Dependencies ===========================

FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm ci

# =========================  Stage 2 - Builder ==============================

FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# =========================  Stage 3 - Database Tools ==============================


FROM node:20-bookworm-slim AS dbtools

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*


COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# =========================  Stage 4 - Production Runner ==============================

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Next.js standalone application
COPY --from=builder /app/public ./public

COPY --from=builder \
    --chown=nextjs:nodejs \
    /app/.next/standalone ./

COPY --from=builder \
    --chown=nextjs:nodejs \
    /app/.next/static ./.next/static

# Prisma runtime files
COPY --from=builder /app/prisma ./prisma

COPY --from=builder \
    /app/node_modules/.prisma \
    ./node_modules/.prisma

COPY --from=builder \
    /app/node_modules/@prisma \
    ./node_modules/@prisma

# Sharp / image processing dependencies
COPY --from=builder \
    /app/node_modules/sharp \
    ./node_modules/sharp

COPY --from=builder \
    /app/node_modules/@img \
    ./node_modules/@img

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

