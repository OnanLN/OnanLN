export function createIpLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    allow(ip: string, now = Date.now()) {
      const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < windowMs);
      if (recent.length >= limit) {
        hits.set(ip, recent);
        return false;
      }
      recent.push(now);
      hits.set(ip, recent);
      return true;
    },
  };
}

export const smsIpLimiter = createIpLimiter(60, 60 * 60 * 1000);
