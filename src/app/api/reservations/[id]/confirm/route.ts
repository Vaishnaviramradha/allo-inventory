// src/app/api/reservations/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIdempotency, saveIdempotency } from "@/lib/idempotency";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const idempotencyKey = req.headers.get("Idempotency-Key") ?? "";

  if (idempotencyKey) {
    const cached = await checkIdempotency(`confirm:${idempotencyKey}`);
    if (cached) return NextResponse.json(cached.body, { status: cached.statusCode });
  }

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return { error: "Reservation not found", status: 404 };
    }
    if (reservation.status === "CONFIRMED") {
      return { data: reservation, status: 200 }; // idempotent
    }
    if (reservation.status === "RELEASED") {
      return { error: "Reservation was already released", status: 410 };
    }
    if (reservation.expiresAt < new Date()) {
      // Expire it properly
      await tx.reservation.update({
        where: { id },
        data: { status: "RELEASED", releasedAt: new Date() },
      });
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: { reserved: { decrement: reservation.quantity } },
      });
      return { error: "Reservation has expired", status: 410 };
    }

    // Confirm: decrement total stock, clear the reservation hold
    const confirmed = await tx.reservation.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: {
        product: { select: { name: true, price: true } },
        warehouse: { select: { name: true } },
      },
    });

    await tx.stock.update({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
      },
      data: {
        total: { decrement: reservation.quantity },
        reserved: { decrement: reservation.quantity },
      },
    });

    return { data: confirmed, status: 200 };
  });

  if ("error" in result) {
    const resp = { error: result.error };
    if (idempotencyKey) await saveIdempotency(`confirm:${idempotencyKey}`, result.status, resp);
    return NextResponse.json(resp, { status: result.status });
  }

  if (idempotencyKey) await saveIdempotency(`confirm:${idempotencyKey}`, result.status, result.data);
  return NextResponse.json(result.data, { status: result.status });
}
