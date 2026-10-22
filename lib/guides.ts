import { db } from "./db";
import { isTheme } from "./themes";
import type { Guide } from "./types";
import type { GuideInput } from "./validators";

type GuideRow = {
  id: number;
  author_id: number;
  author_name: string;
  title: string;
  destination: string;
  region: string;
  summary: string;
  content: string;
  lat: number;
  lng: number;
  cover_theme: string;
  tags: string;
  days: number;
  season: string;
  budget: string;
  created_at: number;
  updated_at: number;
  comment_count: number;
};

const GUIDE_SELECT = `
SELECT
  g.id, g.author_id, u.nickname AS author_name, g.title, g.destination, g.region,
  g.summary, g.content, g.lat, g.lng, g.cover_theme, g.tags, g.days, g.season,
  g.budget, g.created_at, g.updated_at,
  (SELECT COUNT(*) FROM comments c WHERE c.guide_id = g.id) AS comment_count
FROM guides g
JOIN users u ON u.id = g.author_id
`;

function mapGuide(row: GuideRow): Guide {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((tag) => typeof tag === "string");
  } catch {
    tags = [];
  }
  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    authorName: row.author_name,
    title: row.title,
    destination: row.destination,
    region: row.region,
    summary: row.summary,
    content: row.content,
    lat: Number(row.lat),
    lng: Number(row.lng),
    coverTheme: isTheme(row.cover_theme) ? row.cover_theme : "lake",
    tags,
    days: Number(row.days),
    season: row.season,
    budget: row.budget,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    commentCount: Number(row.comment_count),
  };
}

export function listGuides() {
  const rows = db.prepare(`${GUIDE_SELECT} ORDER BY g.created_at DESC LIMIT 300`).all() as GuideRow[];
  return rows.map(mapGuide);
}

export function listGuidesByAuthor(authorId: number) {
  const rows = db
    .prepare(`${GUIDE_SELECT} WHERE g.author_id = ? ORDER BY g.created_at DESC`)
    .all(authorId) as GuideRow[];
  return rows.map(mapGuide);
}

export function listRegions() {
  const rows = db
    .prepare("SELECT DISTINCT region FROM guides ORDER BY region")
    .all() as { region: string }[];
  return rows.map((row) => row.region);
}

export function getGuide(id: number) {
  const row = db.prepare(`${GUIDE_SELECT} WHERE g.id = ?`).get(id) as GuideRow | undefined;
  return row ? mapGuide(row) : null;
}

export function countGuidesSince(authorId: number, since: number) {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM guides WHERE author_id = ? AND created_at > ?")
    .get(authorId, since) as { n: number };
  return Number(row.n);
}

export function insertGuide(authorId: number, input: GuideInput) {
  const now = Date.now();
  const result = db
    .prepare(
      `INSERT INTO guides (
        author_id, title, destination, region, summary, content, lat, lng, cover_theme,
        tags, days, season, budget, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      authorId,
      input.title,
      input.destination,
      input.region,
      input.summary,
      input.content,
      input.lat,
      input.lng,
      input.coverTheme,
      JSON.stringify(input.tags),
      input.days,
      input.season,
      input.budget,
      now,
      now,
    );
  return getGuide(Number(result.lastInsertRowid))!;
}

export function updateGuide(id: number, input: GuideInput) {
  db.prepare(
    `UPDATE guides SET
      title = ?, destination = ?, region = ?, summary = ?, content = ?, lat = ?, lng = ?,
      cover_theme = ?, tags = ?, days = ?, season = ?, budget = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.title,
    input.destination,
    input.region,
    input.summary,
    input.content,
    input.lat,
    input.lng,
    input.coverTheme,
    JSON.stringify(input.tags),
    input.days,
    input.season,
    input.budget,
    Date.now(),
    id,
  );
  return getGuide(id)!;
}

export function deleteGuide(id: number) {
  db.prepare("DELETE FROM guides WHERE id = ?").run(id);
}
