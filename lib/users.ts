import { db } from "./db";
import { maskPhone } from "./format";
import type { PublicUser } from "./types";

type UserRow = {
  id: number;
  phone: string;
  nickname: string;
  bio: string;
  created_at: number;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: Number(row.id),
    nickname: row.nickname,
    bio: row.bio,
    phoneMask: maskPhone(row.phone),
    createdAt: Number(row.created_at),
  };
}

export function findUserByPhone(phone: string) {
  return db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as UserRow | undefined;
}

export function findUserById(id: number) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createUser(phone: string, nickname: string) {
  const now = Date.now();
  const result = db
    .prepare("INSERT INTO users (phone, nickname, bio, created_at) VALUES (?, ?, '', ?)")
    .run(phone, nickname, now);
  return findUserById(Number(result.lastInsertRowid))!;
}

export function updateProfile(id: number, nickname: string, bio: string) {
  db.prepare("UPDATE users SET nickname = ?, bio = ? WHERE id = ?").run(nickname, bio, id);
  return toPublicUser(findUserById(id)!);
}
