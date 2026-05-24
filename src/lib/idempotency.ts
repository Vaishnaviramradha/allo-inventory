// src/lib/idempotency.ts
import { prisma } from "./prisma";
import { IDEMPOTENCY_TTL_MS } from "./schemas";

export async function checkIdempotency(key: string) {
  if (!key) return null;
  const record = await prisma.idempotencyRecord.findUnique({
    where: { key },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    // Expired — treat as new
    await prisma.idempotencyRecord.delete({ where: { key } }).catch(() => {});
    return null;
  }
  return { statusCode: record.statusCode, body: record.body };
}

export async function saveIdempotency(
  key: string,
  statusCode: number,
  body: unknown
) {
  if (!key) return;
  await prisma.idempotencyRecord.upsert({
    where: { key },
    create: {
      key,
      statusCode,
      body: body as any,
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
    },
    update: {},
  });
}
