import { WELCOME_POINTS } from "@/lib/constants";
import { cleanEmail, cleanName, emailOk } from "@/lib/lot-input";
import { hashPassword, passwordProblem } from "@/lib/password";
import { requestIp } from "@/lib/ip";
import { openSession, publicUser } from "@/server/auth";
import { consumeCode } from "@/server/codes";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const name = cleanName(body.name);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!emailOk(email)) return fail("请填写有效邮箱");
  if (!name) return fail("给自己起个 1 到 20 字的名字");
  const passwordError = passwordProblem(body.password);
  if (passwordError) return fail(passwordError);
  if (await prisma.user.findUnique({ where: { email } })) return fail("这个邮箱已经注册，直接登录就好", 409);
  if (!(await consumeCode(email, "register", code))) return fail("验证码不正确或已经过期");

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(String(body.password)),
      points: WELCOME_POINTS,
      pointEntries: { create: { delta: WELCOME_POINTS, reason: "注册见面礼" } },
    },
  });
  await openSession(user.id, requestIp(req), req.headers.get("user-agent") || "");
  return json({ ok: true, user: publicUser(user) });
}
