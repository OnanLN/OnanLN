import "server-only";
import type { Listing } from "@prisma/client";
import {
  buildQuote,
  decodeIntervals,
  encodeIntervals,
  rangesOverlap,
  settle,
  type ListingTerms,
  type QuoteRequest,
} from "../lib/booking";
import { prisma } from "./prisma";

export type BookingBody = QuoteRequest & { listingId?: string; pointsToUse?: number };

export function listingTerms(listing: Listing): ListingTerms {
  return {
    mode: listing.mode as ListingTerms["mode"],
    priceCents: listing.priceCents,
    windowStart: listing.windowStart,
    windowEnd: listing.windowEnd,
    startAt: listing.startAt,
    endAt: listing.endAt,
    holidayName: listing.holidayName,
  };
}

export function readBookingBody(body: Record<string, unknown>): BookingBody {
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
  return {
    listingId: typeof body.listingId === "string" ? body.listingId : undefined,
    date: typeof body.date === "string" ? body.date : undefined,
    startHour: num(body.startHour),
    hours: num(body.hours),
    days: num(body.days),
    nights: num(body.nights),
    months: num(body.months),
    years: num(body.years),
    pointsToUse: num(body.pointsToUse) ?? 0,
  };
}

export async function quoteForUser(body: BookingBody, userId: string | null) {
  if (!body.listingId) return { status: 400, payload: { message: "请选择一种出租方式" } };
  const listing = await prisma.listing.findUnique({ where: { id: body.listingId }, include: { spot: true } });
  if (!listing || listing.status !== "active" || listing.spot.status !== "active") {
    return { status: 404, payload: { message: "这个出租方案已经下架" } };
  }
  const quote = buildQuote(listingTerms(listing), body, new Date());
  if (!quote.ok) return { status: 400, payload: { message: quote.message } };

  let pointsAvailable = 0;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    pointsAvailable = user?.points ?? 0;
  }
  const money = settle(quote.rentCents, pointsAvailable, body.pointsToUse ?? 0);
  const existing = await prisma.booking.findMany({
    where: { spotId: listing.spotId, status: "confirmed" },
    select: { intervals: true },
  });
  const conflict = existing.some((item) => rangesOverlap(quote.intervals, decodeIntervals(item.intervals)));
  return {
    status: 200,
    payload: {
      ok: true,
      listingId: listing.id,
      spotId: listing.spotId,
      mode: listing.mode,
      label: quote.label,
      rentCents: quote.rentCents,
      intervals: quote.intervals.map((item) => ({ start: item.start.toISOString(), end: item.end.toISOString() })),
      ...money,
      pointsAvailable,
      available: !conflict,
      conflictMessage: conflict ? "这个时段已经有人租下了" : "",
    },
  };
}

export async function createBooking(body: BookingBody, userId: string) {
  const preview = await quoteForUser(body, userId);
  if (preview.status !== 200 || !("available" in preview.payload)) return preview;
  if (!preview.payload.available) return { status: 409, payload: { message: preview.payload.conflictMessage || "这个时段刚刚被租走了" } };

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: body.listingId }, include: { spot: true } });
      if (!listing || listing.status !== "active" || listing.spot.status !== "active") throw new Error("这个出租方案已经下架");
      if (listing.spot.ownerId === userId) throw new Error("不能租自己发布的车位");
      const quote = buildQuote(listingTerms(listing), body, new Date());
      if (!quote.ok) throw new Error(quote.message);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("请先登录");
      const money = settle(quote.rentCents, user.points, body.pointsToUse ?? 0);
      const existing = await tx.booking.findMany({
        where: { spotId: listing.spotId, status: "confirmed" },
        select: { intervals: true },
      });
      if (existing.some((item) => rangesOverlap(quote.intervals, decodeIntervals(item.intervals)))) {
        throw new Error("这个时段刚刚被租走了");
      }
      if (money.pointsUsed > 0) {
        await tx.user.update({ where: { id: userId }, data: { points: { decrement: money.pointsUsed } } });
        await tx.pointEntry.create({
          data: { userId, delta: -money.pointsUsed, reason: `抵扣车位租金 · ${quote.label}`, refId: listing.id },
        });
      }
      const created = await tx.booking.create({
        data: {
          listingId: listing.id,
          spotId: listing.spotId,
          renterId: userId,
          ownerId: listing.spot.ownerId,
          startAt: quote.intervals[0].start,
          endAt: quote.intervals[quote.intervals.length - 1].end,
          intervals: encodeIntervals(quote.intervals),
          label: quote.label,
          rentCents: quote.rentCents,
          pointsUsed: money.pointsUsed,
          pointsValueCents: money.pointsValueCents,
          cashCents: money.cashCents,
          platformFeeCents: money.platformFeeCents,
          ownerPayoutCents: money.ownerPayoutCents,
          subsidyCents: money.subsidyCents,
          status: "confirmed",
        },
      });
      const conversation = await tx.conversation.create({
        data: {
          bookingId: created.id,
          spotId: listing.spotId,
          participants: { create: [{ userId }, { userId: listing.spot.ownerId }] },
        },
      });
      return { id: created.id, conversationId: conversation.id };
    });
    return { status: 200, payload: { ok: true, bookingId: booking.id, conversationId: booking.conversationId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "锁定失败";
    return { status: 400, payload: { message } };
  }
}
