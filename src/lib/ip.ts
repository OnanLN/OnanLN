export function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return "local";
  let ip = raw.trim().toLowerCase();
  if (!ip) return "local";
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return "127.0.0.1";
  return ip;
}

export function requestIp(req: Request): string {
  if (process.env.NODE_ENV !== "production") {
    const simulated = req.headers.get("x-weixiang-dev-ip");
    if (simulated && simulated.trim()) return normalizeIp(simulated);
  }
  if (process.env.TRUST_PROXY === "true") {
    const real = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0];
    if (real && real.trim()) return normalizeIp(real);
  }
  return "local";
}

/**
 * 同一账号可以在同一网络地址上开多个窗口。
 * 只要还有未过期的会话绑在别的地址上，新的登录就要被拦住，除非这次请求带了邮箱验证。
 */
export function decideLogin(activeIps: string[], requestIpValue: string, release: boolean): "ok" | "bound" {
  const ip = normalizeIp(requestIpValue);
  const foreign = activeIps.some((item) => normalizeIp(item) !== ip);
  if (foreign && !release) return "bound";
  return "ok";
}
