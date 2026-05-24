# Allo Inventory — Take-Home Exercise

A Next.js inventory and reservation platform for multi-warehouse retail. Customers can browse products, hold stock for 10 minutes while they complete payment, and confirm or release reservations.

**Vercel URL:** https://alloassignment.vercel.app/
**GitHub:** _https://github.com/Vaishnaviramradha/allo-inventory

---

## Running Locally

### 1. Prerequisites

- Node.js 18+
- A hosted Postgres instance (Supabase, Neon, or Railway — all have free tiers)
- A Redis instance (Upstash free tier works great)

### 2. Clone and install

```bash
git clone <https://github.com/Vaishnaviramradha/allo-inventory>
cd allo-inventory
npm install
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler URI |
| `DIRECT_URL` | Supabase → Settings → Database → Direct connection URI |
| `REDIS_URL` | Upstash Console → your database → REST or ioredis URL |
| `CRON_SECRET` | Any random string (`openssl rand -hex 32`) |

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to your hosted Postgres (creates all tables)
npm run db:push

# Seed with sample products and warehouses
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Concurrency — How Race Conditions Are Prevented

The reservation endpoint uses a **two-layer defence**:

### Layer 1: Redis distributed lock

When a POST to `/api/reservations` arrives, we attempt to acquire a lock keyed on `lock:reserve:{productId}:{warehouseId}` using `SET ... NX PX 5000` (atomic set-if-not-exists with a 5-second TTL).

- If Redis is available and the lock is already held: return **409** immediately. This prevents queuing up competing transactions.
- If Redis is down or not configured: fall through gracefully to layer 2.

The lock is released in a `finally` block using a Lua script that compares the token before deleting, preventing stale unlocks.

### Layer 2: Postgres `SELECT ... FOR UPDATE`

Inside a Prisma transaction, we use a raw `SELECT ... FOR UPDATE` to lock the stock row for the relevant `(productId, warehouseId)` pair. This is the **authoritative guard**.

```sql
SELECT id, total, reserved
FROM stock
WHERE "productId" = $1 AND "warehouseId" = $2
FOR UPDATE
```

Two concurrent transactions arriving at the same time will serialise here: one acquires the row lock, checks availability, and increments `reserved`; the other waits, then reads the already-updated row and may find insufficient stock.

**Why both?** Redis is faster (avoids DB round-trips for obvious contention) but optional. The Postgres lock guarantees correctness even under Redis failures or multi-instance deployments without Redis.

---

## Reservation Expiry

### In production (Vercel)

`vercel.json` configures a cron job to `GET /api/cron/expire` **every day**:

```json
{
  "crons": [{ "path": "/api/cron/expire", "schedule": "0 0 * * *" }]
}
```

The handler calls `releaseExpiredReservations()`, which:
1. Finds all `PENDING` reservations where `expiresAt < NOW()`
2. Sets their status to `RELEASED` and decrements `stock.reserved` — all in a single transaction

The cron endpoint is protected by a `CRON_SECRET` env var (Vercel sets this automatically for production crons).

### Lazy cleanup on reads

`GET /api/products` also calls `releaseExpiredReservations()` before computing available stock. This means stock counts displayed to users are always accurate, even in the minute between cron runs.

This "lazy + cron" hybrid gives both **accuracy on reads** and **eventual cleanup** without relying solely on real-time expiry.

---

## Idempotency (Bonus)

Both `POST /api/reservations` and `POST /api/reservations/:id/confirm` support idempotent requests via an `Idempotency-Key` header.

**How it works:**

1. Client sends a unique key per logical request (e.g. `reserve-{productId}-{warehouseId}-{timestamp}`)
2. Server checks the `IdempotencyRecord` table for an existing record with that key
3. If found and not expired: return the cached response immediately — **no side effects**
4. If not found: proceed normally, then store `{key, statusCode, responseBody}` with a 24-hour TTL
5. Records are stored in Postgres (rather than Redis) for durability — a retry after a Redis flush won't cause a duplicate charge

Records expire after 24 hours and are cleaned up lazily on lookup. The key is scoped to the operation: `confirm:{key}` is stored separately from `reserve:{key}` to prevent key collisions across endpoints.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List products with available stock per warehouse |
| `GET` | `/api/warehouses` | List all warehouses |
| `POST` | `/api/reservations` | Reserve units. Returns 409 if stock insufficient |
| `GET` | `/api/reservations/:id` | Get a single reservation |
| `POST` | `/api/reservations/:id/confirm` | Confirm (payment succeeded). Returns 410 if expired |
| `POST` | `/api/reservations/:id/release` | Release early (payment failed / user cancelled) |
| `GET` | `/api/cron/expire` | Cron-triggered expiry cleanup (requires `Authorization: Bearer {CRON_SECRET}`) |

---

## Deployment

### Vercel + Supabase + Upstash (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard or:
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add REDIS_URL
vercel env add CRON_SECRET

# Run migrations on the hosted DB
npx prisma db push  # or migrate deploy for production

# Seed the hosted DB
npm run db:seed
```

The cron job is automatically provisioned by Vercel from `vercel.json`.

---

## Trade-offs and What I'd Change with More Time

**Trade-offs made:**

- **Lazy expiry + cron** rather than a persistent background worker. A proper worker (BullMQ, pg_cron, or Temporal) would be more reliable, but adds infrastructure complexity. The hybrid approach is correct and cheap.

- **No optimistic locking / retry UI.** If a user's reservation fails with 409, they see the error and must retry manually. A polished UI would auto-select the next-best warehouse.

**With more time:**


- Use Prisma migrations instead of `db push` for production schema evolution

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Required |
| Language | TypeScript (strict) | End-to-end type safety |
| ORM | Prisma | Great DX, type-safe queries |
| Database | Supabase / Neon (Postgres) | Hosted, free tier, Prisma-native |
| Cache / Locks | Upstash Redis (ioredis) | Serverless-friendly, low latency |
| Validation | Zod | Shared schemas between API and forms |
| Styling | Inline styles + Tailwind utilities | Fast iteration, no class name conflicts |
