import { defaultNickname } from "@/lib/format";
import { assertSameOrigin, jsonError, readJson, withSession, zodError } from "@/lib/http";
import { consumeLoginCode } from "@/lib/otp";
import { createSession } from "@/lib/session";
import { createUser, findUserByPhone, toPublicUser } from "@/lib/users";
import { nicknameSchema, verifySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const body = await readJson(req);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const consumed = consumeLoginCode(parsed.data.phone, parsed.data.code);
  if (!consumed.ok) return jsonError(consumed.error, consumed.status);

  const existing = findUserByPhone(parsed.data.phone);
  let user = existing;
  if (!user) {
    const requested = parsed.data.nickname?.trim() ?? "";
    let nickname = defaultNickname(parsed.data.phone);
    if (requested) {
      const name = nicknameSchema.safeParse(requested);
      if (!name.success) return zodError(name.error);
      nickname = name.data;
    }
    user = createUser(parsed.data.phone, nickname);
  }

  const token = createSession(user.id);
  return withSession({ ok: true, user: toPublicUser(user) }, token);
}
