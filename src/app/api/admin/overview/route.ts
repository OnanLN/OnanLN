import { requireAdmin } from "@/server/auth";
import { json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const [users, lots, spots, bookings, pendingReports, money] = await Promise.all([
    prisma.user.count(),
    prisma.parkingLot.count({ where: { status: "published" } }),
    prisma.parkingSpot.count({ where: { status: "active" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.parkingReport.count({ where: { status: "pending" } }),
    prisma.booking.aggregate({
      where: { status: "confirmed" },
      _sum: { platformFeeCents: true, rentCents: true, cashCents: true, subsidyCents: true },
    }),
  ]);
  return json({
    users,
    lots,
    spots,
    bookings,
    pendingReports,
    feeCents: money._sum.platformFeeCents || 0,
    rentCents: money._sum.rentCents || 0,
    cashCents: money._sum.cashCents || 0,
    subsidyCents: money._sum.subsidyCents || 0,
    trustProxy: process.env.TRUST_PROXY === "true",
    production: process.env.NODE_ENV === "production",
  });
}
