import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteComment, findComment } from "@/lib/comments";
import { assertSameOrigin, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("请先登录", 401);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return jsonError("留言不存在", 404);
  const comment = findComment(id);
  if (!comment) return jsonError("留言不存在", 404);
  if (Number(comment.author_id) !== user.id) return jsonError("只能删除自己的留言", 403);
  deleteComment(id);
  return NextResponse.json({ ok: true });
}
