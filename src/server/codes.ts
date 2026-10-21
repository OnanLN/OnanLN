import "server-only";
import { prisma } from "./prisma";
import { codeEqual } from "./http";

export async function consumeCode(email: string, purpose: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const rows = await prisma.emailCode.findMany({
    where: { email, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const hit = rows.find((row) => codeEqual(code, row.codeHash));
  if (!hit) return false;
  await prisma.emailCode.update({ where: { id: hit.id }, data: { consumedAt: new Date() } });
  return true;
}
