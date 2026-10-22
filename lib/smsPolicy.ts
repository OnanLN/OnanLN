export type SmsAttempt = { createdAt: number };

const RESEND_GAP = 60_000;
const DAY = 86_400_000;
const DAILY_CAP = 8;

export function decideSmsSend(attempts: SmsAttempt[], now: number) {
  const sorted = [...attempts].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sorted[0];
  if (latest && now - latest.createdAt < RESEND_GAP) {
    const retryAfter = Math.ceil((RESEND_GAP - (now - latest.createdAt)) / 1000);
    return {
      ok: false as const,
      error: `请 ${retryAfter} 秒后再获取验证码`,
      retryAfter,
    };
  }
  const dayCount = sorted.filter((item) => now - item.createdAt < DAY).length;
  if (dayCount >= DAILY_CAP) {
    return {
      ok: false as const,
      error: "这个号码今天获取验证码的次数已用完",
      retryAfter: 3600,
    };
  }
  return { ok: true as const };
}
