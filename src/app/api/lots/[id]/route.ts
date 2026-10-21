import { fail, json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lot = await prisma.parkingLot.findFirst({ where: { id, status: "published" } });
  if (!lot) return fail("没有找到这个停车场", 404);
  return json({ lot });
}
