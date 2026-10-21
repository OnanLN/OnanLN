import { REPORT_POINTS } from "@/lib/constants";
import { parseLotPayload } from "@/lib/lot-input";
import { requireAdmin } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const body = await readJson(req);
  const action = body.action === "reject" ? "reject" : body.action === "approve" ? "approve" : "";
  if (!action) return fail("请选择通过或驳回");
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.parkingReport.findUnique({ where: { id } });
      if (!report || report.status !== "pending") throw new Error("这条上报已经处理过了");
      if (action === "reject") {
        await tx.parkingReport.update({
          where: { id },
          data: { status: "rejected", reviewNote: note, reviewedAt: new Date() },
        });
        return { ok: true };
      }
      const stored = JSON.parse(report.payload) as Record<string, unknown>;
      const parsed = parseLotPayload(stored);
      if (!parsed.ok) throw new Error(parsed.message);
      const hintedLotId = typeof stored.lotId === "string" ? stored.lotId : report.lotId;
      let lotId = hintedLotId || "";
      if (!lotId && parsed.data.externalId) {
        const existing = await tx.parkingLot.findFirst({
          where: { externalId: parsed.data.externalId, source: parsed.data.source },
        });
        if (existing) lotId = existing.id;
      }
      const saved = lotId
        ? await tx.parkingLot.update({
            where: { id: lotId },
            data: { ...parsed.data, status: "published", verified: true },
          })
        : await tx.parkingLot.create({
            data: { ...parsed.data, status: "published", verified: true, availabilityMode: "manual" },
          });
      await tx.parkingReport.update({
        where: { id },
        data: {
          status: "approved",
          lotId: saved.id,
          reviewNote: note,
          reviewedAt: new Date(),
          pointsAwarded: REPORT_POINTS,
        },
      });
      await tx.user.update({ where: { id: report.userId }, data: { points: { increment: REPORT_POINTS } } });
      await tx.pointEntry.create({
        data: { userId: report.userId, delta: REPORT_POINTS, reason: `上报停车场已收录 · ${saved.name}`, refId: report.id },
      });
      return { ok: true, lotId: saved.id };
    });
    return json(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "处理失败");
  }
}
