// src/lib/redis.ts
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("⚠️  REDIS_URL not set — distributed locking disabled. Not safe for production multi-instance deployments.");
    return null;
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis ?? undefined;

/** Acquire a Redlock-style lock. Returns release fn or null if lock not acquired. */
export async function acquireLock(
  key: string,
  ttlMs = 5000
): Promise<(() => Promise<void>) | null> {
  if (!redis) return null;
  const lockKey = `lock:${key}`;
  const token = `${Date.now()}-${Math.random()}`;
  const result = await redis.set(lockKey, token, "PX", ttlMs, "NX");
  if (result !== "OK") return null;
  return async () => {
    // Only delete if we still own it (Lua script for atomicity)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis!.eval(script, 1, lockKey, token);
  };
}
