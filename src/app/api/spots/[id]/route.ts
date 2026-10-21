import { parseSpotPayload } from "@/lib/lot-input";
import { getSession, requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";
import { publicSpot } from "@/server/spot-view";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const spot = await prisma.parkingSpot.findUnique({ where: { id }, include: { listings: true, owner: true } });
  if (!spot) return fail("没有找到这个车位", 404);
  const session = await getSession(req);
  if (!session.ok && session.reason === "ip") {
    return fail("这个登录绑在另一个网络地址上。", 401, "SESSION_IP");
  }
  const userId = session.ok ? session.user.id : null;
  const isOwner = userId === spot.ownerId;
  if (spot.status !== "active" && !isOwner) return fail("这个车位已经暂停出租", 404);
  const booking = userId
    ? await prisma.booking.findFirst({ where: { spotId: spot.id, renterId: userId, status: "confirmed" } })
    : null;
  const privileged = Boolean(isOwner || booking);
  const card = publicSpot(spot, null);
  return json({
    spot: {
      ...card,
      spotCode: privileged ? spot.spotCode : "",
      accessGuide: privileged ? spot.accessGuide : "",
      privileged,
      isOwner,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const existing = await prisma.parkingSpot.findUnique({ where: { id }, include: { listings: true } });
  if (!existing || existing.ownerId !== session.user.id) return fail("只能修改自己的车位", 404);
  const parsed = parseSpotPayload(await readJson(req));
  if (!parsed.ok) return fail(parsed.message);
  const { listings, ...spot } = parsed.data;
  await prisma.$transaction(async (tx) => {
    await tx.parkingSpot.update({ where: { id }, data: spot });
    const kept = new Set(listings.map((item) => item.id).filter(Boolean));
    for (const old of existing.listings) {
      if (old.status === "active" && !kept.has(old.id)) {
        await tx.listing.update({ where: { id: old.id }, data: { status: "inactive" } });
      }
    }
    for (const listing of listings) {
      const data = {
        mode: listing.mode,
        priceCents: listing.priceCents,
        windowStart: listing.windowStart,
        windowEnd: listing.windowEnd,
        startAt: listing.startAt,
        endAt: listing.endAt,
        holidayName: listing.holidayName,
        note: listing.note,
        status: "active",
      };
      if (listing.id && existing.listings.some((item) => item.id === listing.id)) {
        await tx.listing.update({ where: { id: listing.id }, data });
      } else {
        await tx.listing.create({ data: { ...data, spotId: id } });
      }
    }
  });
  return json({ ok: true });
}
