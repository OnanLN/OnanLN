import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin, jsonError, readJson, zodError } from "@/lib/http";
import { clearPresence, getPresence, savePresence } from "@/lib/presence";
import { locationSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  return NextResponse.json({ presence: getPresence(user.id) });
}

export async function PUT(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  const body = await readJson(req);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  if (!parsed.data.enabled) {
    clearPresence(user.id);
    return NextResponse.json({ presence: null });
  }

  const presence = savePresence(
    user.id,
    user.nickname,
    parsed.data.lat,
    parsed.data.lng,
    parsed.data.label,
    parsed.data.precision,
  );
  return NextResponse.json({ presence });
}
