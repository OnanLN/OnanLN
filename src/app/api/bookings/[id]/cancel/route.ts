import { canCancel, decodeIntervals } from "@/lib/booking";
import { requireUser } from "@/server/auth";
import { fail, json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || (booking.renterId !== session.user.id && booking.ownerId !== session.user.id)) {
    return fail("没有找到这个订单", 404);
  }
  const intervals = decodeIntervals(booking.intervals);
  if (!canCancel(booking.status, intervals)) return fail("已经开始的订单不能在线上取消");

  await prisma.$transaction(async (tx) => {
    const current = await tx.booking.findUnique({ where: { id } });
    if (!current || current.status !== "confirmed") throw new Error("订单状态已经变了");
    if (!canCancel(current.status, decodeIntervals(current.intervals))) throw new Error("已经开始的订单不能在线上取消");
    await tx.booking.update({ where: { id }, data: { status: "cancelled" } });
    if (current.pointsUsed > 0) {
      await tx.user.update({ where: { id: current.renterId }, data: { points: { increment: current.pointsUsed } } });
      await tx.pointEntry.create({
        data: {
          userId: current.renterId,
          delta: current.pointsUsed,
          reason: "订单取消，退回积分",
          refId: current.id,
        },
      });
    }
  });
  return json({ ok: true });
}
