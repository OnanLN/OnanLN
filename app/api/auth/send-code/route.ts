import { NextResponse } from "next/server";
import { assertSameOrigin, clientIp, jsonError, readJson, zodError } from "@/lib/http";
import { issueLoginCode } from "@/lib/otp";
import { phoneSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const body = await readJson(req);
  const parsed = phoneSchema.safeParse(body?.phone);
  if (!parsed.success) return zodError(parsed.error);

  const result = await issueLoginCode(parsed.data, clientIp(req));
  if (!result.ok) {
    return jsonError(result.error, result.status, result.retryAfter ? { retryAfter: result.retryAfter } : undefined);
  }
  return NextResponse.json({
    ok: true,
    retryAfter: 60,
    ...(result.demoCode ? { demoCode: result.demoCode } : {}),
  });
}
