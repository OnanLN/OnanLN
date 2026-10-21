import { db } from "./db";
import { buildTree, type CommentRecord } from "./tree";

type CommentRow = {
  id: number;
  guide_id: number;
  author_id: number;
  author_name: string;
  parent_id: number | null;
  body: string;
  created_at: number;
};

export function listCommentTree(guideId: number) {
  const rows = db
    .prepare(
      `SELECT c.id, c.guide_id, c.author_id, u.nickname AS author_name, c.parent_id, c.body, c.created_at
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.guide_id = ?
       ORDER BY c.created_at ASC`,
    )
    .all(guideId) as CommentRow[];
  const records: CommentRecord[] = rows.map((row) => ({
    id: Number(row.id),
    guideId: Number(row.guide_id),
    authorId: Number(row.author_id),
    authorName: row.author_name,
    parentId: row.parent_id == null ? null : Number(row.parent_id),
    body: row.body,
    createdAt: Number(row.created_at),
  }));
  return buildTree(records);
}

export function findComment(id: number) {
  return db.prepare("SELECT id, guide_id, author_id, parent_id FROM comments WHERE id = ?").get(id) as
    | { id: number; guide_id: number; author_id: number; parent_id: number | null }
    | undefined;
}

export function countCommentsSince(authorId: number, since: number) {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM comments WHERE author_id = ? AND created_at > ?")
    .get(authorId, since) as { n: number };
  return Number(row.n);
}

export function insertComment(guideId: number, authorId: number, body: string, parentId: number | null) {
  const result = db
    .prepare(
      "INSERT INTO comments (guide_id, author_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(guideId, authorId, parentId, body, Date.now());
  return Number(result.lastInsertRowid);
}

export function deleteComment(id: number) {
  db.prepare("DELETE FROM comments WHERE id = ?").run(id);
}
