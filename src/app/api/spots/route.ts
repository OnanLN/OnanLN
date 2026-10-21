import { distanceMeters } from "@/lib/geo";
import { parseSpotPayload } from "@/lib/lot-input";
import { CITY_CENTERS, matchPlace } from "@/lib/places";
import { requireUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";
import { publicSpot } from "@/server/spot-view";

function parseCoord(query: string): { lat: number; lng: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(query);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (a >= 15 && a <= 55 && b >= 70 && b <= 140) return { lat: a, lng: b };
  if (b >= 15 && b <= 55 && a >= 70 && a <= 140) return { lat: b, lng: a };
  return null;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const requestedCity = params.get("city")?.trim() || "上海";
  const query = params.get("q")?.trim() || "";
  const mode = params.get("mode")?.trim() || "";
  const radius = Math.min(20000, Math.max(500, Number(params.get("radius") || 5000) || 5000));
  const place = query ? matchPlace(query, requestedCity) : null;
  const coord = query ? parseCoord(query) : null;
  let city = place?.city || requestedCity;
  if (!CITY_CENTERS[city]) city = "上海";
  const center = coord
    ? { lat: coord.lat, lng: coord.lng, label: "你标出的坐标" }
    : place
      ? { lat: place.lat, lng: place.lng, label: `${place.city} · ${place.name}` }
      : { ...CITY_CENTERS[city] };

  const spots = await prisma.parkingSpot.findMany({
    where: { status: "active", city },
    include: { listings: true, owner: true },
  });
  const browsing = query.length === 0;
  const cards = spots
    .map((spot) => ({ spot, distanceM: distanceMeters(center.lat, center.lng, spot.lat, spot.lng) }))
    .filter((item) => {
      const active = item.spot.listings.some((listing) => listing.status === "active" && (!mode || listing.mode === mode));
      if (!active) return false;
      if (browsing) return true;
      const text = `${item.spot.title} ${item.spot.community} ${item.spot.address} ${item.spot.district}`.includes(query);
      return item.distanceM <= radius || text;
    })
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 40)
    .map((item) => publicSpot(item.spot, item.distanceM));

  return json({ city, query, center, radius: browsing ? null : radius, spots: cards });
}

export async function POST(req: Request) {
  const session = await requireUser(req);
  if (!session.ok) return session.response;
  const parsed = parseSpotPayload(await readJson(req));
  if (!parsed.ok) return fail(parsed.message);
  const { listings, ...spot } = parsed.data;
  const created = await prisma.parkingSpot.create({
    data: {
      ...spot,
      ownerId: session.user.id,
      listings: {
        create: listings.map((item) => ({
          mode: item.mode,
          priceCents: item.priceCents,
          windowStart: item.windowStart,
          windowEnd: item.windowEnd,
          startAt: item.startAt,
          endAt: item.endAt,
          holidayName: item.holidayName,
          note: item.note,
        })),
      },
    },
  });
  return json({ ok: true, id: created.id });
}
