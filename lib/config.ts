export function isDemoMode() {
  return process.env.DEMO_MODE !== "false";
}

export function authSecret() {
  return process.env.AUTH_SECRET || "tuji-dev-only-secret-change-me";
}

let warned = false;

export function warnIfUnsafeProduction() {
  if (warned || process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  warned = true;
  if (!process.env.AUTH_SECRET) {
    console.warn("[tuji] 生产环境未设置 AUTH_SECRET，会话密钥正在使用默认值。");
  }
}
