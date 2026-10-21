import { requestIp } from "@/lib/ip";
import { cleanEmail, emailOk } from "@/lib/lot-input";
import { hashPassword, passwordProblem } from "@/lib/password";
import { openSession, publicUser } from "@/server/auth";
import { consumeCode } from "@/server/codes";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!emailOk(email)) return fail("请填写有效邮箱");
  const passwordError = passwordProblem(body.password);
  if (passwordError) return fail(passwordError);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await consumeCode(email, "reset", code))) return fail("验证码不正确或已经过期");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(String(body.password)) },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await openSession(user.id, requestIp(req), req.headers.get("user-agent") || "");
  return json({ ok: true, user: publicUser(updated) });
}
