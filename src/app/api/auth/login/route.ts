import { decideLogin, requestIp } from "@/lib/ip";
import { cleanEmail, emailOk } from "@/lib/lot-input";
import { verifyPassword } from "@/lib/password";
import { dummyPasswordHash, openSession, publicUser } from "@/server/auth";
import { consumeCode } from "@/server/codes";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const ip = requestIp(req);
  if (!emailOk(email) || !password) return fail("邮箱或密码不正确", 401);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyPasswordHash()));
  if (!user || !valid) return fail("邮箱或密码不正确", 401);

  await prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  const active = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    select: { ip: true },
  });
  const releaseCode = typeof body.releaseCode === "string" ? body.releaseCode.trim() : "";
  let released = false;
  if (releaseCode) {
    released = await consumeCode(email, "release", releaseCode);
    if (!released) return fail("解除绑定的验证码不正确或已经过期");
  }
  if (decideLogin(active.map((item) => item.ip), ip, released) === "bound") {
    return fail("这个账号正在另一个网络地址上使用。同一时间只能绑定一个网络，同一台电脑的多个窗口不受影响。可以用邮箱验证码改到当前网络。", 409, "IP_BOUND");
  }
  if (released) await prisma.session.deleteMany({ where: { userId: user.id } });
  await openSession(user.id, ip, req.headers.get("user-agent") || "");
  return json({ ok: true, user: publicUser(user), ip });
}
