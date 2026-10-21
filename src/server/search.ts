import "server-only";
import type { ParkingLot } from "@prisma/client";
import { distanceMeters } from "../lib/geo";
import { CITY_CENTERS, matchPlace } from "../lib/places";
import { enabledProviders, searchLiveParking, type LiveLot } from "./maps";
import { prisma } from "./prisma";

export type LotCard = {
  id: string;
  live: boolean;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  hourlyPrice: number | null;
  dailyCap: number | null;
  monthlyPrice: number | null;
  allowVisitor: string;
  availableSpots: number | null;
  flexibleSpots: number | null;
  totalSpots: number | null;
  fixedSpots: number | null;
  evChargers: number;
  nightOpen: boolean;
  reservable: boolean;
  lotType: string;
  source: string;
  verified: boolean;
  availabilityMode: string;
  distanceM: number;
  externalId?: string;
};

function textHit(lot: ParkingLot, query: string): boolean {
  const haystack = `${lot.name} ${lot.address} ${lot.district} ${lot.operatorName}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function parseCoord(query: string): { lat: number; lng: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(query);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (a >= 15 && a <= 55 && b >= 70 && b <= 140) return { lat: a, lng: b };
  if (b >= 15 && b <= 55 && a >= 70 && a <= 140) return { lat: b, lng: a };
  return null;
}

export function toLotCard(lot: ParkingLot, distanceM: number): LotCard {
  return {
    id: lot.id,
    live: false,
    name: lot.name,
    city: lot.city,
    district: lot.district,
    address: lot.address,
    lat: lot.lat,
    lng: lot.lng,
    hourlyPrice: lot.hourlyPrice,
    dailyCap: lot.dailyCap,
    monthlyPrice: lot.monthlyPrice,
    allowVisitor: lot.allowVisitor,
    availableSpots: lot.availableSpots,
    flexibleSpots: lot.flexibleSpots,
    totalSpots: lot.totalSpots,
    fixedSpots: lot.fixedSpots,
    evChargers: lot.evChargers,
    nightOpen: lot.nightOpen,
    reservable: lot.reservable,
    lotType: lot.lotType,
    source: lot.source,
    verified: lot.verified,
    availabilityMode: lot.availabilityMode,
    distanceM: Math.round(distanceM),
  };
}

function toLiveCard(lot: LiveLot, distanceM: number): LotCard {
  return {
    id: lot.id,
    live: true,
    name: lot.name,
    city: lot.city,
    district: lot.district,
    address: lot.address,
    lat: lot.lat,
    lng: lot.lng,
    hourlyPrice: null,
    dailyCap: null,
    monthlyPrice: null,
    allowVisitor: "unknown",
    availableSpots: null,
    flexibleSpots: null,
    totalSpots: null,
    fixedSpots: null,
    evChargers: 0,
    nightOpen: true,
    reservable: false,
    lotType: "underground",
    source: lot.source,
    verified: false,
    availabilityMode: "unknown",
    distanceM: Math.round(distanceM),
    externalId: lot.externalId,
  };
}

export async function searchLots(params: URLSearchParams) {
  const requestedCity = params.get("city")?.trim() || "上海";
  const query = params.get("q")?.trim() || "";
  const radius = Math.min(20000, Math.max(500, Number(params.get("radius") || 5000) || 5000));
  const place = query ? matchPlace(query, requestedCity) : null;
  const coord = query ? parseCoord(query) : null;
  let city = place?.city || requestedCity;
  if (!CITY_CENTERS[city]) city = CITY_CENTERS[requestedCity] ? requestedCity : "上海";
  let center = place
    ? { lat: place.lat, lng: place.lng, label: `${place.city} · ${place.name}` }
    : { ...CITY_CENTERS[city] };
  let locatedBy: "place" | "city" | "coord" | "geocode" = place ? "place" : "city";
  if (coord) {
    center = { ...coord, label: "你标出的坐标" };
    locatedBy = "coord";
  }

  const lots = await prisma.parkingLot.findMany({ where: { status: "published", city } });
  const measured = lots.map((lot) => ({ lot, distanceM: distanceMeters(center.lat, center.lng, lot.lat, lot.lng) }));
  const browsing = query.length === 0;
  let picked = browsing
    ? measured
    : measured.filter((item) => item.distanceM <= radius || textHit(item.lot, query));
  if (!browsing && picked.length === 0) picked = measured.filter((item) => textHit(item.lot, query));

  const visitor = params.get("visitor");
  const ev = params.get("ev") === "1";
  const night = params.get("night") === "1";
  const reservable = params.get("reservable") === "1";
  picked = picked.filter((item) => {
    if (visitor === "yes" && item.lot.allowVisitor !== "yes") return false;
    if (ev && item.lot.evChargers <= 0) return false;
    if (night && !item.lot.nightOpen) return false;
    if (reservable && !item.lot.reservable) return false;
    return true;
  });
  picked.sort((a, b) => a.distanceM - b.distanceM);

  let live: LotCard[] = [];
  if (!browsing) {
    const remote = await searchLiveParking(center, city, radius);
    live = remote
      .filter((item) => {
        return !picked.some((local) => {
          const sameId = local.lot.externalId && local.lot.externalId === item.externalId && local.lot.source === item.source;
          const samePlace = local.lot.name === item.name && distanceMeters(local.lot.lat, local.lot.lng, item.lat, item.lng) < 120;
          return sameId || samePlace;
        });
      })
      .map((item) => toLiveCard(item, distanceMeters(center.lat, center.lng, item.lat, item.lng)))
      .filter((item) => item.distanceM <= radius)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 12);
  }

  return {
    city,
    query,
    radius: browsing ? null : radius,
    center,
    locatedBy,
    mapConfigured: enabledProviders().length > 0,
    mapProvider: enabledProviders()[0] || null,
    lots: picked.slice(0, 40).map((item) => toLotCard(item.lot, item.distanceM)),
    live,
  };
}
