import "server-only";
import { bdToWgs, gcjToWgs, wgsToBd, wgsToGcj } from "../lib/geo";

export type LiveLot = {
  live: true;
  id: string;
  source: "amap" | "baidu" | "tencent";
  externalId: string;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
};

type Provider = LiveLot["source"];

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function enabledProviders(): Provider[] {
  const available: Provider[] = [];
  if (process.env.AMAP_WEB_KEY) available.push("amap");
  if (process.env.BAIDU_MAP_AK) available.push("baidu");
  if (process.env.TENCENT_MAP_KEY) available.push("tencent");
  const preferred = process.env.MAP_PROVIDER as Provider | undefined;
  if (preferred && available.includes(preferred)) {
    return [preferred, ...available.filter((item) => item !== preferred)];
  }
  return available;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function searchLiveParking(center: { lat: number; lng: number }, city: string, radius: number): Promise<LiveLot[]> {
  const provider = enabledProviders()[0];
  if (!provider) return [];
  if (provider === "amap") return searchAmap(center, city, radius);
  if (provider === "baidu") return searchBaidu(center, city, radius);
  return searchTencent(center, city, radius);
}

export async function geocodeLive(query: string, city: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const provider = enabledProviders()[0];
  if (!provider || !query.trim()) return null;
  if (provider === "amap" && process.env.AMAP_WEB_KEY) {
    const url = new URL("https://restapi.amap.com/v3/geocode/geo");
    url.searchParams.set("key", process.env.AMAP_WEB_KEY);
    url.searchParams.set("address", query);
    url.searchParams.set("city", city);
    const json = asRecord(await fetchJson(url.toString()));
    const geocodes = Array.isArray(json?.geocodes) ? json.geocodes : [];
    const first = asRecord(geocodes[0]);
    const location = typeof first?.location === "string" ? first.location.split(",") : [];
    if (location.length !== 2) return null;
    const wgs = gcjToWgs(Number(location[0]), Number(location[1]));
    if (!Number.isFinite(wgs.lat) || !Number.isFinite(wgs.lng)) return null;
    return { ...wgs, label: String(first?.formatted_address || query) };
  }
  return null;
}

async function searchAmap(center: { lat: number; lng: number }, city: string, radius: number): Promise<LiveLot[]> {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) return [];
  const gcj = wgsToGcj(center.lng, center.lat);
  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${gcj.lng},${gcj.lat}`);
  url.searchParams.set("keywords", "停车场");
  url.searchParams.set("types", "150900");
  url.searchParams.set("radius", String(Math.min(radius, 5000)));
  url.searchParams.set("offset", "20");
  url.searchParams.set("page", "1");
  url.searchParams.set("extensions", "base");
  const json = asRecord(await fetchJson(url.toString()));
  if (!json || json.status !== "1" || !Array.isArray(json.pois)) return [];
  return json.pois.flatMap((item) => {
    const row = asRecord(item);
    if (!row || typeof row.location !== "string" || typeof row.id !== "string") return [];
    const [lng, lat] = row.location.split(",").map(Number);
    const wgs = gcjToWgs(lng, lat);
    return [toLive("amap", row.id, String(row.name || "停车场"), city, String(row.adname || ""), String(row.address || ""), wgs.lat, wgs.lng, String(row.tel || ""))];
  });
}

async function searchBaidu(center: { lat: number; lng: number }, city: string, radius: number): Promise<LiveLot[]> {
  const ak = process.env.BAIDU_MAP_AK;
  if (!ak) return [];
  const bd = wgsToBd(center.lng, center.lat);
  const url = new URL("https://api.map.baidu.com/place/v2/search");
  url.searchParams.set("ak", ak);
  url.searchParams.set("query", "停车场");
  url.searchParams.set("location", `${bd.lat},${bd.lng}`);
  url.searchParams.set("radius", String(Math.min(radius, 5000)));
  url.searchParams.set("output", "json");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("scope", "2");
  const json = asRecord(await fetchJson(url.toString()));
  if (!json || json.status !== 0 || !Array.isArray(json.results)) return [];
  return json.results.flatMap((item) => {
    const row = asRecord(item);
    const location = asRecord(row?.location);
    const id = typeof row?.uid === "string" ? row.uid : "";
    if (!row || !location || !id) return [];
    const wgs = bdToWgs(Number(location.lng), Number(location.lat));
    return [toLive("baidu", id, String(row.name || "停车场"), city, String(row.area || ""), String(row.address || ""), wgs.lat, wgs.lng, String(row.telephone || ""))];
  });
}

async function searchTencent(center: { lat: number; lng: number }, city: string, radius: number): Promise<LiveLot[]> {
  const key = process.env.TENCENT_MAP_KEY;
  if (!key) return [];
  const gcj = wgsToGcj(center.lng, center.lat);
  const url = new URL("https://apis.map.qq.com/ws/place/v1/search");
  url.searchParams.set("key", key);
  url.searchParams.set("keyword", "停车场");
  url.searchParams.set("boundary", `nearby(${gcj.lat},${gcj.lng},${Math.min(radius, 5000)})`);
  url.searchParams.set("page_size", "20");
  const json = asRecord(await fetchJson(url.toString()));
  if (!json || json.status !== 0 || !Array.isArray(json.data)) return [];
  return json.data.flatMap((item) => {
    const row = asRecord(item);
    const location = asRecord(row?.location);
    const id = typeof row?.id === "string" ? row.id : "";
    if (!row || !location || !id) return [];
    const wgs = gcjToWgs(Number(location.lng), Number(location.lat));
    const ad = asRecord(row.ad_info);
    return [toLive("tencent", id, String(row.title || "停车场"), city, String(ad?.district || ""), String(row.address || ""), wgs.lat, wgs.lng, String(row.tel || ""))];
  });
}

function toLive(source: Provider, externalId: string, name: string, city: string, district: string, address: string, lat: number, lng: number, phone: string): LiveLot {
  return {
    live: true,
    id: `live:${source}:${externalId}`,
    source,
    externalId,
    name,
    city,
    district,
    address,
    lat,
    lng,
    phone,
  };
}

export async function liveLotDetail(source: string, externalId: string): Promise<LiveLot | null> {
  if (source === "amap" && process.env.AMAP_WEB_KEY) {
    const url = new URL("https://restapi.amap.com/v3/place/detail");
    url.searchParams.set("key", process.env.AMAP_WEB_KEY);
    url.searchParams.set("id", externalId);
    const json = asRecord(await fetchJson(url.toString()));
    const pois = Array.isArray(json?.pois) ? json.pois : [];
    const row = asRecord(pois[0]);
    if (!row || typeof row.location !== "string") return null;
    const [lng, lat] = row.location.split(",").map(Number);
    const wgs = gcjToWgs(lng, lat);
    return toLive("amap", externalId, String(row.name || "停车场"), String(row.cityname || ""), String(row.adname || ""), String(row.address || ""), wgs.lat, wgs.lng, String(row.tel || ""));
  }
  if (source === "baidu" && process.env.BAIDU_MAP_AK) {
    const url = new URL("https://api.map.baidu.com/place/v2/detail");
    url.searchParams.set("ak", process.env.BAIDU_MAP_AK);
    url.searchParams.set("uid", externalId);
    url.searchParams.set("output", "json");
    url.searchParams.set("scope", "2");
    const json = asRecord(await fetchJson(url.toString()));
    const row = asRecord(json?.result);
    const location = asRecord(row?.location);
    if (!row || !location) return null;
    const wgs = bdToWgs(Number(location.lng), Number(location.lat));
    return toLive("baidu", externalId, String(row.name || "停车场"), "", String(row.area || ""), String(row.address || ""), wgs.lat, wgs.lng, String(row.telephone || ""));
  }
  if (source === "tencent" && process.env.TENCENT_MAP_KEY) {
    const url = new URL("https://apis.map.qq.com/ws/place/v1/detail");
    url.searchParams.set("key", process.env.TENCENT_MAP_KEY);
    url.searchParams.set("id", externalId);
    const json = asRecord(await fetchJson(url.toString()));
    const row = asRecord(json?.result) || asRecord((Array.isArray(json?.data) ? json.data[0] : null));
    const location = asRecord(row?.location);
    if (!row || !location) return null;
    const wgs = gcjToWgs(Number(location.lng), Number(location.lat));
    return toLive("tencent", externalId, String(row.title || row.name || "停车场"), "", "", String(row.address || ""), wgs.lat, wgs.lng, String(row.tel || ""));
  }
  return null;
}
