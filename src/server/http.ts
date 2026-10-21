import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string): string {
  const pepper = process.env.CODE_PEPPER || "weixiang-dev-pepper";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

export function codeEqual(code: string, hash: string): boolean {
  const got = Buffer.from(hashCode(code), "utf8");
  const previous = Buffer.from(hash, "utf8");
  if (got.length !== previous.length) return false;
  return timingSafeEqual(got, previous);
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function fail(message: string, status = 400, code?: string): Response {
  return Response.json({ message, code }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

export function safeNext(input: unknown): string {
  if (typeof input !== "string") return "/";
  if (!input.startsWith("/") || input.startsWith("//")) return "/";
  return input;
}
