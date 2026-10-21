import { describePhase, decodeIntervals } from "@/lib/booking";
import { formatSh } from "@/lib/time";
import { requireUser } from "@/server/auth";
import { createBooking, readBookingBody } from "@/server/booking-service";
import { json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const rows = await prisma.booking.findMany({
    where: { OR: [{ renterId: session.user.id }, { ownerId: session.user.id }] },
    include: {
      spot: true,
      renter: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      conversation: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return json({
    bookings: rows.map((item) => {
      const intervals = decodeIntervals(item.intervals);
      const phase = describePhase(item.status, intervals);
      return {
        id: item.id,
        role: item.renterId === session.user.id ? "renter" : "owner",
        label: item.label,
        status: item.status,
        phase: phase.phase,
        phaseLabel: phase.label,
        rentCents: item.rentCents,
        cashCents: item.cashCents,
        pointsUsed: item.pointsUsed,
        pointsValueCents: item.pointsValueCents,
        platformFeeCents: item.platformFeeCents,
        ownerPayoutCents: item.ownerPayoutCents,
        subsidyCents: item.subsidyCents,
        startLabel: formatSh(item.startAt),
        endLabel: formatSh(item.endAt),
        spot: { id: item.spot.id, title: item.spot.title, city: item.spot.city },
        renter: item.renter,
        owner: item.owner,
        conversationId: item.conversation?.id ?? null,
        createdAt: item.createdAt.toISOString(),
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const result = await createBooking(readBookingBody(await readJson(req)), session.user.id);
  return json(result.payload, result.status);
}
