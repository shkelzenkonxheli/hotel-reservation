const buckets = new Map();

function nowMs() {
  return Date.now();
}

function getClientKey(req) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return ip;
}

function cleanupExpired() {
  const now = nowMs();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(req, options = {}) {
  const limit = Number(options.limit ?? 10);
  const windowMs = Number(options.windowMs ?? 60_000);
  const scope = options.scope || "global";
  const key = `${scope}:${getClientKey(req)}`;
  const now = nowMs();

  cleanupExpired();

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: 0,
  };
}
