import crypto from "node:crypto";
import { authSecret, isDemoMode } from "./config";
import { db } from "./db";
import { smsIpLimiter } from "./ipLimit";
import { decideSmsSend } from "./smsPolicy";
import type { ActionFailure } from "./types";

const CODE_TTL = 5 * 60 * 1000;

type CodeRow = {
  id: number;
  phone: string;
  code_hash: string;
  expires_at: number;
  attempts: number;
  consumed: number;
  created_at: number;
};

function hashCode(phone: string, code: string) {
  return crypto.createHmac("sha256", authSecret()).update(`${phone}:${code}`).digest("hex");
}

function randomCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

async function deliverSms(phone: string, code: string) {
  if (isDemoMode()) return;
  const url = process.env.SMS_WEBHOOK_URL;
  if (!url) {
    const error = new Error("短信通道还没有配置");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN ?? ""}`,
    },
    body: JSON.stringify({ phone, code, template: "login" }),
  });
  if (!response.ok) throw new Error("短信没有发出去，请稍后再试");
}

export async function issueLoginCode(
  phone: string,
  ip: string,
): Promise<{ ok: true; demoCode?: string } | ActionFailure> {
  if (!smsIpLimiter.allow(ip)) {
    return { ok: false, status: 429, error: "这个网络今天获取验证码太频繁了，请稍后再试", retryAfter: 3600 };
  }

  const now = Date.now();
  const recent = db
    .prepare("SELECT created_at FROM sms_codes WHERE phone = ? AND created_at > ?")
    .all(phone, now - 86_400_000) as { created_at: number }[];
  const decision = decideSmsSend(
    recent.map((row) => ({ createdAt: Number(row.created_at) })),
    now,
  );
  if (!decision.ok) return { ok: false, status: 429, error: decision.error, retryAfter: decision.retryAfter };

  const code = randomCode();
  db.exec("BEGIN IMMEDIATE");
  let codeId = 0;
  try {
    const again = db
      .prepare("SELECT created_at FROM sms_codes WHERE phone = ? AND created_at > ?")
      .all(phone, now - 86_400_000) as { created_at: number }[];
    const locked = decideSmsSend(
      again.map((row) => ({ createdAt: Number(row.created_at) })),
      Date.now(),
    );
    if (!locked.ok) {
      db.exec("ROLLBACK");
      return { ok: false, status: 429, error: locked.error, retryAfter: locked.retryAfter };
    }
    const result = db
      .prepare(
        `INSERT INTO sms_codes (phone, code_hash, expires_at, attempts, consumed, created_at)
         VALUES (?, ?, ?, 0, 0, ?)`,
      )
      .run(phone, hashCode(phone, code), now + CODE_TTL, now);
    codeId = Number(result.lastInsertRowid);
    db.prepare("DELETE FROM sms_codes WHERE phone = ? AND created_at < ?").run(phone, now - 2 * 86_400_000);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  try {
    await deliverSms(phone, code);
  } catch (error) {
    db.prepare("DELETE FROM sms_codes WHERE id = ?").run(codeId);
    const status = (error as { status?: number }).status ?? 502;
    const message = error instanceof Error ? error.message : "短信没有发出去";
    return { ok: false, status, error: message };
  }

  return isDemoMode() ? { ok: true, demoCode: code } : { ok: true };
}

export function consumeLoginCode(phone: string, code: string): { ok: true } | ActionFailure {
  const row = db
    .prepare(
      `SELECT * FROM sms_codes
       WHERE phone = ? AND consumed = 0
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(phone) as CodeRow | undefined;

  if (!row) return { ok: false, status: 400, error: "请先获取验证码" };
  if (Number(row.attempts) >= 5) {
    return { ok: false, status: 400, error: "尝试次数过多，请重新获取验证码" };
  }
  if (Number(row.expires_at) < Date.now()) {
    return { ok: false, status: 400, error: "验证码已过期，请重新获取" };
  }

  const expected = Buffer.from(row.code_hash);
  const actual = Buffer.from(hashCode(phone, code));
  const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!matches) {
    db.prepare("UPDATE sms_codes SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    return { ok: false, status: 400, error: "验证码不正确" };
  }

  db.prepare("UPDATE sms_codes SET consumed = 1 WHERE id = ?").run(row.id);
  return { ok: true };
}
