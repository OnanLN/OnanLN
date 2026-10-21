import { readSessionToken } from "@/lib/auth";
import { assertSameOrigin, clearSessionCookie } from "@/lib/http";
import { destroySession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const token = await readSessionToken();
  if (token) destroySession(token);
  return clearSessionCookie({ ok: true });
}
