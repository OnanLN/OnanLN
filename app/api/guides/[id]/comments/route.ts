import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countCommentsSince, findComment, insertComment } from "@/lib/comments";
import { getGuide } from "@/lib/guides";
import { assertSameOrigin, jsonError, readJson, zodError } from "@/lib/http";
import { commentSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("登录后才能留言", 401);
  const guideId = Number((await context.params).id);
  if (!Number.isInteger(guideId) || !getGuide(guideId)) return jsonError("没有找到这篇攻略", 404);
  if (countCommentsSince(user.id, Date.now() - 60 * 60 * 1000) >= 30) {
    return jsonError("留言太快了，休息一会儿再写", 429);
  }

  const body = await readJson(req);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const parentId = parsed.data.parentId ?? null;
  if (parentId) {
    const parent = findComment(parentId);
    if (!parent || Number(parent.guide_id) !== guideId) return jsonError("要回复的留言不存在");
  }

  const id = insertComment(guideId, user.id, parsed.data.body, parentId);
  return NextResponse.json({ id }, { status: 201 });
}
