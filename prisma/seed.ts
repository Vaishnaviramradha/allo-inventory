// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.idempotencyRecord.deleteMany();

  // Create warehouses
  const [mumbai, delhi, bangalore] = await Promise.all([
    prisma.warehouse.create({
      data: { id: "wh_mumbai", name: "Mumbai Central", location: "Mumbai, MH" },
    }),
    prisma.warehouse.create({
      data: { id: "wh_delhi", name: "Delhi Hub", location: "Delhi, DL" },
    }),
    prisma.warehouse.create({
      data: { id: "wh_blr", name: "Bangalore South", location: "Bangalore, KA" },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: "prod_headphones",
        name: "Studio Pro Headphones",
        description: "Over-ear noise-cancelling headphones with 40-hour battery life and premium audio drivers.",
        price: 24999,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_watch",
        name: "Smart Watch Series X",
        description: "Health tracking, GPS, and 7-day battery. Water resistant to 50m.",
        price: 18999,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_speaker",
        name: "Portable Bluetooth Speaker",
        description: "360° surround sound, IP67 waterproof, 24h playtime.",
        price: 8499,
        imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_keyboard",
        name: "Mechanical Keyboard TKL",
        description: "Tenkeyless layout, hot-swappable switches, RGB backlight.",
        price: 12999,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_webcam",
        name: "4K Streaming Webcam",
        description: "4K 30fps, dual microphones, auto light correction.",
        price: 9999,
        imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
      },
    }),
  ]);

  // Create stock (low quantities to make the demo interesting)
  const stockData = [
    { productId: "prod_headphones", warehouseId: "wh_mumbai", total: 5 },
    { productId: "prod_headphones", warehouseId: "wh_delhi", total: 2 },
    { productId: "prod_headphones", warehouseId: "wh_blr", total: 8 },
    { productId: "prod_watch", warehouseId: "wh_mumbai", total: 3 },
    { productId: "prod_watch", warehouseId: "wh_delhi", total: 7 },
    { productId: "prod_watch", warehouseId: "wh_blr", total: 1 },
    { productId: "prod_speaker", warehouseId: "wh_mumbai", total: 10 },
    { productId: "prod_speaker", warehouseId: "wh_delhi", total: 4 },
    { productId: "prod_speaker", warehouseId: "wh_blr", total: 6 },
    { productId: "prod_keyboard", warehouseId: "wh_mumbai", total: 2 },
    { productId: "prod_keyboard", warehouseId: "wh_delhi", total: 0 },
    { productId: "prod_keyboard", warehouseId: "wh_blr", total: 3 },
    { productId: "prod_webcam", warehouseId: "wh_mumbai", total: 1 },
    { productId: "prod_webcam", warehouseId: "wh_delhi", total: 5 },
    { productId: "prod_webcam", warehouseId: "wh_blr", total: 0 },
  ];

  for (const s of stockData) {
    await prisma.stock.create({ data: s });
  }

  console.log(`✅ Created ${products.length} products across 3 warehouses`);
  console.log("🚀 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
