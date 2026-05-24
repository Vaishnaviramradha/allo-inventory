// src/app/api/cron/expire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/expiry";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret to prevent abuse
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await releaseExpiredReservations();
  return NextResponse.json({ ok: true, ...result });
}
