import { clearSessionCookie, getSession } from "@/server/auth";
import { json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const body = await readJson(req);
  const session = await getSession(req);
  if (session.ok) {
    if (body.all === true) await prisma.session.deleteMany({ where: { userId: session.user.id } });
    else await prisma.session.delete({ where: { id: session.sessionId } });
  }
  await clearSessionCookie();
  return json({ ok: true });
}
