// Sliding-window in-memory rate limiter.
// Limits each IP to MAX_REQUESTS per WINDOW_MS.
// Good enough to stop casual spam; for high-traffic production use
// swap the Map for Upstash Redis (@upstash/ratelimit).

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;   // per IP per window

const store = new Map(); // ip -> array of timestamps

function getIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export function checkRateLimit(req) {
  const ip = getIP(req);
  const now = Date.now();
  const timestamps = (store.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  store.set(ip, timestamps);

  // Periodically prune old entries so the Map doesn't grow forever
  if (store.size > 5000) {
    for (const [key, ts] of store) {
      if (ts.every((t) => now - t >= WINDOW_MS)) store.delete(key);
    }
  }

  return { allowed: true };
}
