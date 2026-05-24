// src/lib/expiry.ts
/**
 * Release all expired PENDING reservations and return stock.
 * Called lazily on reads AND by the cron endpoint.
 */
import { prisma } from "./prisma";

export async function releaseExpiredReservations() {
  const now = new Date();

  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    select: { id: true, productId: true, warehouseId: true, quantity: true },
  });

  if (expired.length === 0) return { released: 0 };

  // Use a transaction to atomically update status + restore stock
  await prisma.$transaction(async (tx) => {
    for (const r of expired) {
      await tx.reservation.update({
        where: { id: r.id },
        data: { status: "RELEASED", releasedAt: now },
      });
      await tx.stock.update({
        where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
        data: { reserved: { decrement: r.quantity } },
      });
    }
  });

  return { released: expired.length };
}
