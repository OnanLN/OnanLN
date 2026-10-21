import { db } from "./db";
import { applyPrecision, type Precision } from "./geo";
import type { Presence } from "./types";

const DAY = 24 * 60 * 60 * 1000;

type PresenceRow = {
  user_id: number;
  nickname: string;
  lat: number;
  lng: number;
  label: string;
  precision: string;
  updated_at: number;
};

function mapPresence(row: PresenceRow): Presence {
  return {
    userId: Number(row.user_id),
    nickname: row.nickname,
    lat: Number(row.lat),
    lng: Number(row.lng),
    label: row.label,
    precision: row.precision === "exact" ? "exact" : "fuzzy",
    updatedAt: Number(row.updated_at),
  };
}

export function listPresences(now = Date.now()) {
  const rows = db
    .prepare(
      `SELECT p.user_id, u.nickname, p.lat, p.lng, p.label, p.precision, p.updated_at
       FROM presences p
       JOIN users u ON u.id = p.user_id
       WHERE p.updated_at > ?
       ORDER BY p.updated_at DESC`,
    )
    .all(now - DAY) as PresenceRow[];
  return rows.map(mapPresence);
}

export function getPresence(userId: number, now = Date.now()) {
  const row = db
    .prepare(
      `SELECT p.user_id, u.nickname, p.lat, p.lng, p.label, p.precision, p.updated_at
       FROM presences p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?`,
    )
    .get(userId) as PresenceRow | undefined;
  if (!row) return null;
  if (Number(row.updated_at) <= now - DAY) return null;
  return mapPresence(row);
}

export function savePresence(
  userId: number,
  nickname: string,
  lat: number,
  lng: number,
  label: string,
  precision: Precision,
) {
  const point = applyPrecision(lat, lng, precision);
  const now = Date.now();
  db.prepare(
    `INSERT INTO presences (user_id, lat, lng, label, precision, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       lat = excluded.lat,
       lng = excluded.lng,
       label = excluded.label,
       precision = excluded.precision,
       updated_at = excluded.updated_at`,
  ).run(userId, point.lat, point.lng, label, precision, now);
  return {
    userId,
    nickname,
    lat: point.lat,
    lng: point.lng,
    label,
    precision,
    updatedAt: now,
  } satisfies Presence;
}

export function clearPresence(userId: number) {
  db.prepare("DELETE FROM presences WHERE user_id = ?").run(userId);
}
