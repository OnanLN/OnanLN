import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin, jsonError, readJson, zodError } from "@/lib/http";
import { updateProfile } from "@/lib/users";
import { profileSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  const body = await readJson(req);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const updated = updateProfile(user.id, parsed.data.nickname, parsed.data.bio);
  return NextResponse.json({ user: updated });
}
