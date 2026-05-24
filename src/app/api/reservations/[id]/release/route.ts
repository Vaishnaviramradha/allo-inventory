// src/app/api/reservations/[id]/release/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return { error: "Reservation not found", status: 404 };
    }
    if (reservation.status !== "PENDING") {
      // Idempotent: already released or confirmed — return current state
      return { data: reservation, status: 200 };
    }

    const released = await tx.reservation.update({
      where: { id },
      data: { status: "RELEASED", releasedAt: new Date() },
      include: {
        product: { select: { name: true } },
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
      data: { reserved: { decrement: reservation.quantity } },
    });

    return { data: released, status: 200 };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
