// src/lib/schemas.ts
import { z } from "zod";

export const ReserveSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
});

export const ConfirmSchema = z.object({
  id: z.string().min(1),
});

export type ReserveInput = z.infer<typeof ReserveSchema>;

export const RESERVATION_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
