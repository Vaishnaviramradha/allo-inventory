// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acquireLock } from "@/lib/redis";
import { ReserveSchema, RESERVATION_TTL_MS } from "@/lib/schemas";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";
import { releaseExpiredReservations } from "@/lib/expiry";

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key") ?? "";

  // --- Idempotency check ---
  if (idempotencyKey) {
    const cached = await checkIdempotency(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.statusCode });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = ReserveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = parsed.data;

  // Release any expired reservations first so stock is accurate
  await releaseExpiredReservations();

  /**
   * CONCURRENCY STRATEGY:
   *
   * We use a two-layer approach for correctness:
   *
   * 1. Redis distributed lock: fast pre-check to serialise concurrent requests
   *    for the same product/warehouse. Falls back gracefully if Redis is down.
   *
   * 2. Postgres SELECT ... FOR UPDATE inside a transaction: the authoritative
   *    guard. Even without Redis, two simultaneous transactions will serialise
   *    here. The DB constraint is always the source of truth.
   *
   * This means:
   *   - With Redis: most contention is resolved cheaply at the lock layer.
   *   - Without Redis: the DB transaction still guarantees correctness.
   *   - Never both get through: the FOR UPDATE row lock ensures exactly one
   *     transaction can read-and-decrement the stock row at a time.
   */
  const lockKey = `reserve:${productId}:${warehouseId}`;
  const release = await acquireLock(lockKey, 5000);

  // If Redis is present and we couldn't get the lock, fail fast
  if (release === null && process.env.REDIS_URL) {
    const resp = { error: "Resource is being updated, please retry" };
    return NextResponse.json(resp, { status: 409 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the stock row for this product/warehouse
      const stock = await tx.$queryRaw<
        Array<{ id: string; total: number; reserved: number }>
      >`
        SELECT id, total, reserved
        FROM stock
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `;

      if (!stock.length) {
        return { error: "Stock record not found", status: 404 };
      }

      const s = stock[0];
      const available = s.total - s.reserved;

      if (available < quantity) {
        return {
          error: `Not enough stock. Requested: ${quantity}, Available: ${available}`,
          status: 409,
        };
      }

      // Atomically increment reserved count
      await tx.$executeRaw`
        UPDATE stock
        SET reserved = reserved + ${quantity}, "updatedAt" = NOW()
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
      `;

      const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt,
          idempotencyKey: idempotencyKey || null,
        },
        include: {
          product: { select: { name: true, price: true, imageUrl: true } },
          warehouse: { select: { name: true, location: true } },
        },
      });

      return { data: reservation, status: 201 };
    });

    if ("error" in result) {
      const resp = { error: result.error };
      if (idempotencyKey) await saveIdempotency(idempotencyKey, result.status, resp);
      return NextResponse.json(resp, { status: result.status });
    }

    const resp = result.data;
    if (idempotencyKey) await saveIdempotency(idempotencyKey, 201, resp);
    return NextResponse.json(resp, { status: 201 });
  } finally {
    if (release) await release();
  }
}
