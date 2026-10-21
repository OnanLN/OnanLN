import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_DAYS } from "../lib/constants";
import { normalizeIp, requestIp } from "../lib/ip";
import { prisma } from "./prisma";
import { fail } from "./http";

export const COOKIE = "wx_session";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  points: number;
  isAdmin: boolean;
  bio: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  points: number;
  isAdmin: boolean;
  bio: string;
  createdAt: Date;
};

export function publicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    points: user.points,
    isAdmin: user.isAdmin,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function openSession(userId: string, ip: string, userAgent: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      ip: normalizeIp(ip),
      userAgent: userAgent.slice(0, 200),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  await setSessionCookie(token);
}

export async function getSession(req: Request): Promise<
  | { ok: true; user: PublicUser; ip: string; sessionId: string }
  | { ok: false; reason: "none" | "ip"; ip: string }
> {
  const ip = requestIp(req);
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return { ok: false, reason: "none", ip };
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return { ok: false, reason: "none", ip };
  if (normalizeIp(session.ip) !== ip) return { ok: false, reason: "ip", ip };
  return { ok: true, user: publicUser(session.user), ip, sessionId: session.id };
}

export async function requireUser(req: Request): Promise<
  | { ok: true; user: PublicUser; ip: string; sessionId: string }
  | { ok: false; response: Response }
> {
  const session = await getSession(req);
  if (!session.ok && session.reason === "ip") {
    return {
      ok: false,
      response: fail("这个登录绑在另一个网络地址上。请在原网络退出，或用邮箱验证码改到当前网络。同一台电脑开多个窗口不受影响。", 401, "SESSION_IP"),
    };
  }
  if (!session.ok) return { ok: false, response: fail("请先登录", 401, "LOGIN_REQUIRED") };
  return session;
}

export async function requireAdmin(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session;
  if (!session.user.isAdmin) return { ok: false as const, response: fail("只有管理员可以处理这件事", 403, "ADMIN") };
  return session;
}

let dummyHash: string | null = null;

export async function dummyPasswordHash(): Promise<string> {
  if (!dummyHash) {
    const { hashPassword } = await import("../lib/password");
    dummyHash = await hashPassword("not-a-real-password");
  }
  return dummyHash;
}

export function tokenOk(header: string | null, expected: string | undefined): boolean {
  if (!expected || !header) return false;
  const got = header.replace(/^Bearer\s+/i, "");
  const left = Buffer.from(got);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
