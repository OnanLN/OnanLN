import { json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return json({ ok: true, service: "weixiang" });
}
