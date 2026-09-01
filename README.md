# Lumière Salon — Full-Stack Booking Platform

A complete salon booking web app: customer-facing site + admin back office, built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, and PostgreSQL via Prisma.

## Features

**Customer side**
- Branded home page, services grouped into 7 categories, service detail pages (price/duration/description)
- Staff/stylist profiles
- 4-step booking wizard: service → stylist → date/time (14-day calendar) → confirm
- Real-time availability generated from each stylist's weekly hours + time-off exceptions
- Server-side, transaction-safe double-booking prevention
- Signup/login with database-backed, HTTP-only session cookies
- Booking history, cancellation, and rescheduling
- Contact/location page
- Mobile-first responsive design throughout

**Admin side**
- Separate admin login, guarded by role-checked middleware on every `/admin` route and API call
- Dashboard: today's appointments, upcoming bookings, monthly revenue, status counts
- Full CRUD for services, categories, and staff
- Weekly working-hours editor + one-off time-off/exception management per stylist
- Bookings queue with status transitions: Pending → Confirmed → Completed, or Cancelled
- Customer directory with lifetime spend and booking counts
- Revenue reports broken down by category, stylist, and service

## Tech stack

| Layer          | Choice                                   |
|----------------|-------------------------------------------|
| Frontend       | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend        | Next.js Route Handlers (`/api/*`)         |
| Database       | PostgreSQL + Prisma ORM                   |
| Auth           | Custom credentials + database-backed sessions (bcrypt + HTTP-only cookies) |
| Validation     | Zod on every write endpoint               |
| Deployment     | Vercel (app) + any managed Postgres (Neon, Supabase, RDS, Railway) |

> **Note on auth:** the brief mentioned Auth.js. This build implements the same *shape*
> Auth.js's database-session strategy gives you — a `Session` table, an opaque token in an
> HTTP-only cookie, instant server-side revocation — but with plain custom code instead of
> the Auth.js package, since credentials + DB sessions don't need Auth.js's OAuth machinery.
> If you'd rather standardize on Auth.js/NextAuth directly (e.g. to add Google login later),
> the `Session`/`User` models are already shaped to work with `@auth/prisma-adapter` with
> minimal changes to `src/lib/auth.ts`.

## Getting started

### 1. Prerequisites
- Node.js 18.18+ (20.x recommended)
- A PostgreSQL database (local Postgres, or a free instance on [Neon](https://neon.tech) / [Supabase](https://supabase.com))

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `SESSION_SECRET` — any long random string (used as a placeholder for future JWT/CSRF needs)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the admin account the seed script will create

### 4. Set up the database
```bash
npm run db:push     # create tables from prisma/schema.prisma
npm run db:seed     # seed categories, services, staff, schedules, and accounts
```

This creates:
- An **admin** account using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
- A **demo customer**: `demo@customer.com` / `Password123!`
- 7 categories, ~23 services, 7 staff members with weekly schedules

### 5. Run it
```bash
npm run dev
```
- Customer site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

### Other useful commands
```bash
npm run db:studio    # visual database browser
npm run db:migrate   # create a tracked migration instead of a raw push
npm run build        # production build (also runs prisma generate)
```

## Project structure

```
prisma/
  schema.prisma        # full data model
  seed.ts               # seed script
src/
  app/
    (customer pages)    # /, /services, /staff, /book, /account, /contact, /login, /signup
    admin/               # role-guarded admin dashboard, protected by src/app/admin/layout.tsx
    api/                 # all route handlers (auth, services, staff, bookings, admin/*)
  components/
    admin/               # admin CRUD widgets (client components)
    ...                  # shared customer-facing UI
  lib/
    auth.ts              # session creation/verification, password hashing
    availability.ts       # slot generation + transactional conflict prevention
    prisma.ts             # Prisma client singleton
    utils.ts / validation.ts
```

## How double-booking prevention works

Every booking write (`POST /api/bookings`, `POST /api/bookings/:id/reschedule`) runs inside a
**Serializable** Prisma transaction (`createBookingWithConflictCheck` in `src/lib/availability.ts`):

1. Look for any non-cancelled booking for that staff member whose time range overlaps the requested range.
2. If one exists, abort and return `409 Conflict`.
3. Otherwise, create the booking (and, for reschedules, cancel the original) in the same transaction.

Because the check and the write happen in one serializable transaction, two customers racing
for the same slot can't both succeed — the database itself is the source of truth, not just
the UI's "available slots" list.

## Extending this

- **Payments**: add the Stripe SDK, create a PaymentIntent when a booking moves to `CONFIRMED`, and store the intent id on `Booking`.
- **Image uploads**: wire `imageUrl` fields to Cloudinary's upload widget or an S3 pre-signed URL flow instead of pasting URLs in the admin forms.
- **Email/SMS reminders**: hook into the `Booking` create/update paths with Resend, Postmark, or Twilio.
- **Auth.js migration**: swap `src/lib/auth.ts` for `@auth/prisma-adapter` if you need social login; the `User`/`Session` models are already compatible in shape.

## Testing

Two tiers, matching what actually needs a database and what doesn't:

```bash
npm test                 # unit tests — pure functions, no DB, runs in ~1s
npm run test:integration # integration tests — needs DATABASE_URL pointed at a real Postgres
npm run test:all         # both
npm run typecheck        # tsc --noEmit
```

- **`tests/unit/`** — formatting helpers (`lib/utils.ts`) and every Zod schema in `lib/validation.ts`. No I/O, no environment setup required.
- **`tests/integration/availability.test.ts`** — the one that matters most: creates a real staff member/service/schedule against Postgres, then fires two concurrent requests for the *same* time slot and asserts exactly one succeeds and the other gets `BookingConflictError`. This is what actually proves the double-booking guard in `src/lib/availability.ts` works, rather than just reading like it should. It also checks that booked slots disappear from availability and cancelled ones reappear.
- Integration tests auto-skip (`describe.skipIf`) if `DATABASE_URL` isn't set, so `npm test` alone is safe to run without any local database.

**CI** (`.github/workflows/ci.yml`) runs on every push/PR to `main`: installs deps, generates the Prisma client, type-checks, runs unit tests, spins up a throwaway Postgres service container, pushes the schema to it, runs integration tests against it, then does a full `next build` as a final catch-all. The Postgres container exists only for the life of that CI run — it's never a shared or persistent database.



**Two independent resources to provision/manage:**

1. **The app** — stateless. Build it with the included multi-stage `Dockerfile` (uses Next.js `output: "standalone"` for a minimal runtime image). Scale horizontally with zero session-affinity concerns since sessions live in Postgres, not app memory.
2. **PostgreSQL** — stateful. In production, use a managed instance (RDS, Cloud SQL, Neon, Supabase) rather than a self-hosted container, so backups/failover aren't your problem. Only this resource holds data you can't regenerate.

**Local integration testing (app + db together):**
```bash
docker compose up -d --build
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```
Then visit `http://localhost:3000` and `http://localhost:3000/api/health` (checks DB connectivity — wire this into your load balancer/orchestrator liveness probe).

**Migrations run as a separate step, never inside the app's `CMD`.** The container's job is only to serve traffic. Run `npx prisma migrate deploy` (or `db push` for a schema-drift-free early-stage project) as a distinct CI/CD pipeline step, a one-off Kubernetes Job, or a Vercel "predeploy" hook — before the new app version starts receiving traffic.

**What to delete/rotate before or during a DevOps setup:**
- The default `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env.example` — rotate immediately, store the real ones in your platform's secret manager (Vercel env vars, AWS Secrets Manager, k8s Secret), never in the image or repo.
- The seeded `demo@customer.com` account — fine for staging, delete before go-live.
- Any local `.next/`, `node_modules/`, and the dev Postgres volume — none of these should ever be baked into an image or committed; they're all reproducible from source + `package-lock.json`.

**What must persist:** only the Postgres data volume/instance. Everything else (app containers, build artifacts) should be treated as disposable and rebuilt from the Git commit + environment variables on every deploy.

## Seeding accounts (no defaults — this is intentional)

There is no built-in admin account and no fallback password. `prisma/seed.ts` will refuse to run at all unless you provide real values:

```bash
export ADMIN_EMAIL="you@yourdomain.com"
export ADMIN_PASSWORD="$(openssl rand -base64 18)"   # or any password ≥12 chars you'll actually remember/store
npm run db:seed
```

The seed script will reject the run outright if:
- `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing
- the password is under 12 characters
- the password matches a known placeholder (`ChangeMe123!`, `password`, `admin123`, etc.)

**Demo customer account** (`demo@customer.com`) is opt-in only, for local/staging convenience when you want to test the booking flow without registering:
```bash
SEED_DEMO_DATA=true npm run db:seed
```
It's automatically skipped (with a warning) if `NODE_ENV=production`, even if the flag is left on by accident — but the safest habit is to just never set it outside your own machine.

**Before deploying anywhere real:**
- [ ] Generate `ADMIN_PASSWORD` with a password manager or `openssl rand`, not typed by hand
- [ ] Store `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `SESSION_SECRET` / `DATABASE_URL` in your platform's secret manager (Vercel env vars, AWS Secrets Manager, k8s `Secret`) — never in `.env` committed to git, never in a Dockerfile `ENV`, never in compose defaults
- [ ] Confirm `SEED_DEMO_DATA` is unset or `false`
- [ ] If you ever ran the seed with a placeholder password during setup, re-run it with a real one — `upsert` means re-seeding safely updates the existing admin row rather than duplicating it
- [ ] Rotate `SESSION_SECRET` if it was ever committed or shared, and note that rotating it doesn't invalidate existing sessions on its own (sessions are validated against the `Session` table, not signed by this secret) — to force-logout everyone, run `DELETE FROM "Session";` (or add an admin action for it)

