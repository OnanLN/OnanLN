import { cleanName } from "@/lib/lot-input";
import { getSession, publicUser, requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session.ok && session.reason === "ip") {
    return fail("这个登录绑在另一个网络地址上。请用邮箱验证码改到当前网络。", 401, "SESSION_IP");
  }
  if (!session.ok) return json({ user: null, ip: session.ip });
  return json({ user: session.user, ip: session.ip });
}

export async function PATCH(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const body = await readJson(req);
  const name = cleanName(body.name);
  if (!name) return fail("名字需要 1 到 20 个字");
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 80) : undefined;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, ...(bio != null ? { bio } : {}) },
  });
  return json({ user: publicUser(user) });
}
