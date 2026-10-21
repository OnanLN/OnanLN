import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE } from "./auth";
import { zodMessage } from "./validators";

const MAX_AGE = 60 * 60 * 24 * 30;

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function zodError(error: ZodError) {
  return jsonError(zodMessage(error));
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return jsonError("无法确认请求来源", 403);
  try {
    if (new URL(origin).host !== host) return jsonError("请求来源不被允许", 403);
  } catch {
    return jsonError("无法确认请求来源", 403);
  }
  return null;
}

export async function readJson(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function withSession(body: unknown, token: string, status = 200) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(body: unknown) {
  const response = NextResponse.json(body);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
