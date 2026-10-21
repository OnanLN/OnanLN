import { requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const memberships = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          participants: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  const spotIds = [...new Set(memberships.map((item) => item.conversation.spotId).filter(Boolean))];
  const spots = await prisma.parkingSpot.findMany({ where: { id: { in: spotIds } }, select: { id: true, title: true } });
  const titles = new Map(spots.map((item) => [item.id, item.title]));
  const conversations = memberships
    .map((item) => item.conversation)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((conversation) => {
      const other = conversation.participants.find((item) => item.userId !== session.user.id)?.user;
      const last = conversation.messages[0];
      return {
        id: conversation.id,
        spotId: conversation.spotId,
        spotTitle: titles.get(conversation.spotId) || "车位咨询",
        bookingId: conversation.bookingId,
        other: other || null,
        lastMessage: last ? { body: last.body, senderId: last.senderId, createdAt: last.createdAt.toISOString() } : null,
        updatedAt: conversation.updatedAt.toISOString(),
      };
    });
  return json({ conversations });
}

export async function POST(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const body = await readJson(req);
  const spotId = typeof body.spotId === "string" ? body.spotId : "";
  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } });
  if (!spot || spot.status !== "active") return fail("这个车位现在不能咨询", 404);
  if (spot.ownerId === session.user.id) return fail("这是你自己的车位");
  const candidates = await prisma.conversation.findMany({
    where: { spotId: spot.id, bookingId: null, participants: { some: { userId: session.user.id } } },
    include: { participants: true },
  });
  const existing = candidates.find(
    (item) => item.participants.length === 2 && item.participants.some((person) => person.userId === spot.ownerId),
  );
  if (existing) return json({ id: existing.id });
  const created = await prisma.conversation.create({
    data: {
      spotId: spot.id,
      participants: { create: [{ userId: session.user.id }, { userId: spot.ownerId }] },
    },
  });
  return json({ id: created.id });
}
