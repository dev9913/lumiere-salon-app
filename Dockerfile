# ============================ Stage-1. Dependencies Install ================================

FROM node:22-trixie-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ============================ Stage-2. Build Stage ================================

FROM node:22-trixie-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package.json package-lock.json ./
COPY prisma ./prisma

COPY . .

RUN npm run build



# ============================ Stage-3. Production runtime ================================

FROM gcr.io/distroless/nodejs22-debian13 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma Client runtime
COPY --from=builder /app/node_modules/@prisma/client /node_modules/@prisma/client

# Generated Prisma client + engine
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["server.js"]
