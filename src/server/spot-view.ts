import type { Listing, ParkingSpot, User } from "@prisma/client";

type SpotWith = ParkingSpot & { listings: Listing[]; owner: User };

export function publicListing(listing: Listing) {
  return {
    id: listing.id,
    mode: listing.mode,
    priceCents: listing.priceCents,
    windowStart: listing.windowStart,
    windowEnd: listing.windowEnd,
    startAt: listing.startAt?.toISOString() ?? null,
    endAt: listing.endAt?.toISOString() ?? null,
    holidayName: listing.holidayName,
    note: listing.note,
    status: listing.status,
  };
}

export function publicSpot(spot: SpotWith, distanceM: number | null) {
  const listings = spot.listings.filter((item) => item.status === "active");
  const prices = listings.map((item) => item.priceCents);
  return {
    id: spot.id,
    title: spot.title,
    description: spot.description,
    city: spot.city,
    district: spot.district,
    community: spot.community,
    address: spot.address,
    lat: spot.lat,
    lng: spot.lng,
    spotType: spot.spotType,
    vehicleLimit: spot.vehicleLimit,
    hasCharger: spot.hasCharger,
    status: spot.status,
    owner: { id: spot.owner.id, name: spot.owner.name },
    listings: listings.map(publicListing),
    fromPrice: prices.length ? Math.min(...prices) : null,
    distanceM: distanceM == null ? null : Math.round(distanceM),
  };
}
