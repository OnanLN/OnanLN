import { MAX_CODES_PER_HOUR, CODE_TTL_MS } from "@/lib/constants";
import { cleanEmail, emailOk } from "@/lib/lot-input";
import { generateCode, hashCode, fail, json, readJson } from "@/server/http";
import { sendCodeMail } from "@/server/mail";
import { prisma } from "@/server/prisma";

const PURPOSES = new Set(["register", "reset", "release"]);

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const purpose = typeof body.purpose === "string" ? body.purpose : "";
  if (!emailOk(email)) return fail("请填写有效邮箱");
  if (!PURPOSES.has(purpose)) return fail("验证码用途不正确");

  const user = await prisma.user.findUnique({ where: { email } });
  if (purpose === "register" && user) return fail("这个邮箱已经注册，直接登录就好", 409, "EMAIL_TAKEN");
  if ((purpose === "reset" || purpose === "release") && !user) {
    return json({ ok: true, delivered: false, devCode: null });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.emailCode.count({ where: { email, createdAt: { gt: since } } });
  if (count >= MAX_CODES_PER_HOUR) return fail("这个邮箱的验证码太频繁了，请一小时后再试", 429);

  const code = generateCode();
  await prisma.emailCode.create({
    data: {
      email,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  try {
    const mail = await sendCodeMail(email, code, purpose);
    const devCode = !mail.delivered && process.env.NODE_ENV !== "production" ? code : null;
    return json({ ok: true, delivered: mail.delivered, devCode });
  } catch {
    return fail("验证码邮件没有发出去，请稍后再试", 503);
  }
}
