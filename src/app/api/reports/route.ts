import { REPORT_POINTS } from "@/lib/constants";
import { parseLotPayload } from "@/lib/lot-input";
import { requireAdmin, requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (params.get("queue") === "1") {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    const reports = await prisma.parkingReport.findMany({
      where: { status: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return json({ reports });
  }
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const reports = await prisma.parkingReport.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return json({ reports });
}

export async function POST(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const body = await readJson(req);
  const parsed = parseLotPayload(body);
  if (!parsed.ok) return fail(parsed.message);
  const lotId = typeof body.lotId === "string" ? body.lotId : "";
  if (lotId) {
    const lot = await prisma.parkingLot.findUnique({ where: { id: lotId } });
    if (!lot) return fail("要更正的停车场不存在");
  }
  const report = await prisma.parkingReport.create({
    data: {
      userId: session.user.id,
      lotId: lotId || null,
      payload: JSON.stringify({ ...parsed.data, lotId }),
    },
  });
  return json({ ok: true, reportId: report.id, reviewPoints: REPORT_POINTS });
}
