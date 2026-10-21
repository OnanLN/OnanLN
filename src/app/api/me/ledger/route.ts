import { requireUser } from "@/server/auth";
import { json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const entries = await prisma.pointEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const spots = await prisma.parkingSpot.findMany({
    where: { ownerId: session.user.id },
    include: { listings: { where: { status: "active" }, select: { id: true, mode: true, priceCents: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({
    points: session.user.points,
    entries: entries.map((item) => ({
      id: item.id,
      delta: item.delta,
      reason: item.reason,
      createdAt: item.createdAt.toISOString(),
    })),
    spots: spots.map((spot) => ({
      id: spot.id,
      title: spot.title,
      city: spot.city,
      status: spot.status,
      community: spot.community,
      listings: spot.listings,
    })),
  });
}
