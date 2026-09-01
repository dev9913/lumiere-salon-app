
#  ============================ Stage 1. For Dependencies Install =========================
 
FROM node:20-bookworm-slim AS deps

WORKDIR /app



RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*



COPY package.json package-lock.json* ./

RUN npm ci


# ============================= Stage 2. For This is Build Stage =====================

FROM node:20-bookworm-slim AS builder

WORKDIR /app


RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# =============================  Stage 3. Run Stage  ===============================

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

#  standalone application

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs \
    /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
    /app/.next/static ./.next/static


# prisma

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma


# explicitly copy sharp

COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

# sharp's native dependencies
COPY --from=builder /app/node_modules/@img ./node_modules/@img



USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]


