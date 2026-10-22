import crypto from "node:crypto";
import { db } from "./db";
import { findUserById, toPublicUser } from "./users";
import type { PublicUser } from "./types";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(userId, hashToken(token), now + THIRTY_DAYS, now);

  const stale = db
    .prepare(
      "SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 5",
    )
    .all(userId) as { id: number }[];
  const remove = db.prepare("DELETE FROM sessions WHERE id = ?");
  for (const row of stale) remove.run(row.id);
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  return token;
}

export function getUserByToken(token: string): PublicUser | null {
  const row = db
    .prepare(
      `SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as { user_id: number } | undefined;
  if (!row) return null;
  const user = findUserById(Number(row.user_id));
  return user ? toPublicUser(user) : null;
}

export function destroySession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
