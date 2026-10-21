import { parseLotPayload } from "@/lib/lot-input";
import { requireAdmin } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const parsed = parseLotPayload(await readJson(req));
  if (!parsed.ok) return fail(parsed.message);
  try {
    await prisma.parkingLot.update({
      where: { id },
      data: { ...parsed.data, status: "published", verified: true },
    });
  } catch {
    return fail("没有找到这个停车场", 404);
  }
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  await prisma.parkingLot.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
