import { tokenOk } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function POST(req: Request) {
  const expected = process.env.PARKING_INGRESS_TOKEN;
  if (!expected) return fail("车场数据接入还没有打开", 503, "INGRESS_OFF");
  if (!tokenOk(req.headers.get("authorization"), expected)) return fail("接入凭证不正确", 401);
  const body = await readJson(req);
  const externalId = typeof body.externalId === "string" ? body.externalId.trim() : "";
  const source = typeof body.source === "string" && body.source ? body.source : "partner";
  if (!externalId) return fail("缺少 externalId");
  if (!Number.isInteger(body.availableSpots) || Number(body.availableSpots) < 0) return fail("可用车位需要是非负整数");
  const lot = await prisma.parkingLot.findFirst({ where: { externalId, source } });
  if (!lot) return fail("没有找到对应停车场。请先在后台建档并填上 externalId。", 404);
  const data: { availableSpots: number; availabilityMode: string; fixedSpots?: number; flexibleSpots?: number; totalSpots?: number } = {
    availableSpots: Number(body.availableSpots),
    availabilityMode: "live",
  };
  if (Number.isInteger(body.fixedSpots)) data.fixedSpots = Number(body.fixedSpots);
  if (Number.isInteger(body.flexibleSpots)) data.flexibleSpots = Number(body.flexibleSpots);
  if (Number.isInteger(body.totalSpots)) data.totalSpots = Number(body.totalSpots);
  const updated = await prisma.parkingLot.update({ where: { id: lot.id }, data });
  return json({ ok: true, id: updated.id, availableSpots: updated.availableSpots, availabilityMode: updated.availabilityMode });
}
