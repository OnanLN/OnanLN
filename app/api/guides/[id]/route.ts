import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteGuide, getGuide, updateGuide } from "@/lib/guides";
import { assertSameOrigin, jsonError, readJson, zodError } from "@/lib/http";
import { guideInputSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function ownedGuide(id: number, userId: number) {
  const guide = getGuide(id);
  if (!guide) return { error: jsonError("没有找到这篇攻略", 404) };
  if (guide.authorId !== userId) return { error: jsonError("只能修改自己的攻略", 403) };
  return { guide };
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return jsonError("攻略不存在", 404);
  const owned = await ownedGuide(id, user.id);
  if (owned.error) return owned.error;
  const body = await readJson(req);
  const parsed = guideInputSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  return NextResponse.json({ guide: updateGuide(id, parsed.data) });
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return jsonError("攻略不存在", 404);
  const owned = await ownedGuide(id, user.id);
  if (owned.error) return owned.error;
  deleteGuide(id);
  return NextResponse.json({ ok: true });
}
