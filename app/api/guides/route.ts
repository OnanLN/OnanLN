import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countGuidesSince, insertGuide } from "@/lib/guides";
import { assertSameOrigin, jsonError, readJson, zodError } from "@/lib/http";
import { guideInputSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const user = await getCurrentUser();
  if (!user) return jsonError("登录后才能发表攻略", 401);
  if (countGuidesSince(user.id, Date.now() - 86_400_000) >= 10) {
    return jsonError("今天已经写得够多了，明天再发布吧", 429);
  }
  const body = await readJson(req);
  const parsed = guideInputSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const guide = insertGuide(user.id, parsed.data);
  return NextResponse.json({ guide }, { status: 201 });
}
