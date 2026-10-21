import { parseLotPayload } from "@/lib/lot-input";
import { requireAdmin } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const lots = await prisma.parkingLot.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
  return json({ lots });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const parsed = parseLotPayload(await readJson(req));
  if (!parsed.ok) return fail(parsed.message);
  const lot = await prisma.parkingLot.create({
    data: { ...parsed.data, status: "published", verified: true, availabilityMode: "manual" },
  });
  return json({ ok: true, id: lot.id });
}
