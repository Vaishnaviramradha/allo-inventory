// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";

export async function GET() {
  // Lazy cleanup — release expired reservations so stock counts are accurate
  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    include: {
      stock: {
        include: { warehouse: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    stock: p.stock.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      warehouseLocation: s.warehouse.location,
      total: s.total,
      reserved: s.reserved,
      available: s.total - s.reserved,
    })),
  }));

  return NextResponse.json(result);
}
