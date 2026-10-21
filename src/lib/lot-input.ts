import { parseShDateTime } from "./time";

export type LotWrite = {
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  hourlyPrice: number | null;
  firstHourPrice: number | null;
  dailyCap: number | null;
  monthlyPrice: number | null;
  freeMinutes: number;
  feeNote: string;
  allowVisitor: "yes" | "no" | "permit" | "unknown";
  totalSpots: number;
  fixedSpots: number;
  flexibleSpots: number;
  availableSpots: number;
  openHours: string;
  lotType: string;
  evChargers: number;
  heightLimitM: number | null;
  paymentMethods: string;
  phone: string;
  reservable: boolean;
  nightOpen: boolean;
  accessibleSpots: number;
  rules: string;
  operatorName: string;
  source: string;
  externalId: string;
};

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

function text(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, max);
}

function cents(input: unknown): number | null | "bad" {
  if (input == null || input === "") return null;
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value) || value < 0 || value > 100000) return "bad";
  return Math.round(value);
}

function count(input: unknown, fallback = 0): number | "bad" {
  if (input == null || input === "") return fallback;
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isInteger(value) || value < 0 || value > 20000) return "bad";
  return value;
}

function optionalCount(input: unknown): number | null | "bad" {
  if (input == null || input === "") return null;
  return count(input);
}

const VISITORS = new Set(["yes", "no", "permit", "unknown"]);
const LOT_TYPES = new Set(["underground", "ground", "roadside", "stereo", "mechanical"]);

export function parseLotPayload(input: unknown): ParseResult<LotWrite> {
  const body = (input ?? {}) as Record<string, unknown>;
  const name = text(body.name, 40);
  const city = text(body.city, 20);
  const address = text(body.address, 80);
  if (name.length < 2) return { ok: false, message: "停车场名称至少 2 个字" };
  if (!city) return { ok: false, message: "请填写城市" };
  if (address.length < 4) return { ok: false, message: "地址再写具体一点" };
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, message: "请先用地标定位，或填写经纬度" };
  if (lat < 15 || lat > 55 || lng < 70 || lng > 140) return { ok: false, message: "坐标看起来不在国内，请换一个地标重新定位" };

  const hourlyPrice = cents(body.hourlyPrice);
  const firstHourPrice = cents(body.firstHourPrice);
  const dailyCap = cents(body.dailyCap);
  const monthlyPrice = cents(body.monthlyPrice);
  if ([hourlyPrice, firstHourPrice, dailyCap, monthlyPrice].includes("bad")) {
    return { ok: false, message: "价格需要是 0 到 100000 之间的分，不填表示未知" };
  }

  const totalGiven = optionalCount(body.totalSpots);
  const fixedSpots = count(body.fixedSpots);
  const flexibleSpots = count(body.flexibleSpots);
  const availableSpots = count(body.availableSpots);
  const evChargers = count(body.evChargers);
  const accessibleSpots = count(body.accessibleSpots);
  const freeMinutes = count(body.freeMinutes);
  if ([totalGiven, fixedSpots, flexibleSpots, availableSpots, evChargers, accessibleSpots, freeMinutes].includes("bad")) {
    return { ok: false, message: "车位数量需要是非负整数" };
  }
  const total = totalGiven == null ? (fixedSpots as number) + (flexibleSpots as number) : (totalGiven as number);
  if ((fixedSpots as number) + (flexibleSpots as number) !== total) {
    return { ok: false, message: "固定车位和临停车位相加需要等于总车位。只知道总数时，把临停车位填成总数、固定车位填 0。" };
  }
  if ((availableSpots as number) > total) return { ok: false, message: "可用车位不能大于总车位" };

  let heightLimitM: number | null = null;
  if (body.heightLimitM != null && body.heightLimitM !== "") {
    const height = Number(body.heightLimitM);
    if (!Number.isFinite(height) || height <= 0 || height > 8) return { ok: false, message: "限高请按米填写，例如 2.2" };
    heightLimitM = Math.round(height * 100) / 100;
  }

  const allowVisitor = text(body.allowVisitor, 20) || "unknown";
  if (!VISITORS.has(allowVisitor)) return { ok: false, message: "外来车辆政策不正确" };
  const lotType = text(body.lotType, 20) || "underground";
  if (!LOT_TYPES.has(lotType)) return { ok: false, message: "车场类型不正确" };

  const source = text(body.source, 20) || "manual";
  if (!["manual", "user", "amap", "baidu", "tencent", "partner"].includes(source)) {
    return { ok: false, message: "数据来源不正确" };
  }

  return {
    ok: true,
    data: {
      name,
      city,
      district: text(body.district, 20),
      address,
      lat,
      lng,
      hourlyPrice: hourlyPrice as number | null,
      firstHourPrice: firstHourPrice as number | null,
      dailyCap: dailyCap as number | null,
      monthlyPrice: monthlyPrice as number | null,
      freeMinutes: freeMinutes as number,
      feeNote: text(body.feeNote, 300),
      allowVisitor: allowVisitor as LotWrite["allowVisitor"],
      totalSpots: total,
      fixedSpots: fixedSpots as number,
      flexibleSpots: flexibleSpots as number,
      availableSpots: availableSpots as number,
      openHours: text(body.openHours, 40) || "全天",
      lotType,
      evChargers: evChargers as number,
      heightLimitM,
      paymentMethods: text(body.paymentMethods, 80),
      phone: text(body.phone, 30),
      reservable: Boolean(body.reservable),
      nightOpen: body.nightOpen == null ? true : Boolean(body.nightOpen),
      accessibleSpots: accessibleSpots as number,
      rules: text(body.rules, 400),
      operatorName: text(body.operatorName, 40),
      source,
      externalId: text(body.externalId, 80),
    },
  };
}

export type SpotListingWrite = {
  id?: string;
  mode: "hour" | "day" | "night" | "month" | "year" | "holiday";
  priceCents: number;
  windowStart: string;
  windowEnd: string;
  startAt: Date | null;
  endAt: Date | null;
  holidayName: string;
  note: string;
};

export type SpotWrite = {
  title: string;
  description: string;
  city: string;
  district: string;
  community: string;
  address: string;
  spotCode: string;
  lat: number;
  lng: number;
  spotType: string;
  vehicleLimit: string;
  hasCharger: boolean;
  accessGuide: string;
  status: "active" | "paused";
  listings: SpotListingWrite[];
};

export function parseSpotPayload(input: unknown): ParseResult<SpotWrite> {
  const body = (input ?? {}) as Record<string, unknown>;
  const title = text(body.title, 40);
  const address = text(body.address, 80);
  const city = text(body.city, 20);
  if (title.length < 2) return { ok: false, message: "给车位起个名字，至少 2 个字" };
  if (!city) return { ok: false, message: "请填写城市" };
  if (address.length < 4) return { ok: false, message: "地址再写具体一点，租客锁定后才会看到车位编号" };
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 15 || lat > 55 || lng < 70 || lng > 140) {
    return { ok: false, message: "请用地标把车位定位到国内的一个点" };
  }
  const spotType = text(body.spotType, 20) || "underground";
  if (!["underground", "ground", "mechanical", "roadside"].includes(spotType)) {
    return { ok: false, message: "车位类型不正确" };
  }
  const status = text(body.status, 20) || "active";
  if (status !== "active" && status !== "paused") return { ok: false, message: "车位状态不正确" };
  if (!Array.isArray(body.listings) || body.listings.length === 0) {
    return { ok: false, message: "至少发布一种出租方式" };
  }
  if (body.listings.length > 8) return { ok: false, message: "一个车位最多 8 种出租方式" };

  const listings: SpotListingWrite[] = [];
  for (const item of body.listings) {
    const row = (item ?? {}) as Record<string, unknown>;
    const mode = text(row.mode, 20);
    if (!["hour", "day", "night", "month", "year", "holiday"].includes(mode)) {
      return { ok: false, message: "有一种出租方式不认识" };
    }
    const price = cents(row.priceCents);
    if (price === "bad" || price == null || price < 100) return { ok: false, message: "每种出租方式的价格至少 1 元" };
    const listing: SpotListingWrite = {
      id: text(row.id, 40) || undefined,
      mode: mode as SpotListingWrite["mode"],
      priceCents: price,
      windowStart: text(row.windowStart, 5),
      windowEnd: text(row.windowEnd, 5),
      startAt: null,
      endAt: null,
      holidayName: text(row.holidayName, 20),
      note: text(row.note, 120),
    };
    if (mode === "day" || mode === "night") {
      if (listing.windowStart && !/^\d{2}:\d{2}$/.test(listing.windowStart)) return { ok: false, message: "时段开始时间写成 08:00" };
      if (listing.windowEnd && !/^\d{2}:\d{2}$/.test(listing.windowEnd)) return { ok: false, message: "时段结束时间写成 20:00" };
      if (!listing.windowStart) listing.windowStart = mode === "day" ? "08:00" : "20:00";
      if (!listing.windowEnd) listing.windowEnd = mode === "day" ? "20:00" : "08:00";
    }
    if (mode === "holiday") {
      const start = typeof row.startAt === "string" ? row.startAt : "";
      const end = typeof row.endAt === "string" ? row.endAt : "";
      const startAt = parseShDateTime(start);
      const endAt = parseShDateTime(end);
      if (!startAt || !endAt || endAt <= startAt) return { ok: false, message: "节假日整段需要填写开始和结束，按北京时间" };
      if (!listing.holidayName) return { ok: false, message: "给这段档期起个名字，例如春节或国庆" };
      listing.startAt = startAt;
      listing.endAt = endAt;
    }
    listings.push(listing);
  }

  return {
    ok: true,
    data: {
      title,
      description: text(body.description, 400),
      city,
      district: text(body.district, 20),
      community: text(body.community, 40),
      address,
      spotCode: text(body.spotCode, 30),
      lat,
      lng,
      spotType,
      vehicleLimit: text(body.vehicleLimit, 30) || "轿车",
      hasCharger: Boolean(body.hasCharger),
      accessGuide: text(body.accessGuide, 400),
      status: status as "active" | "paused",
      listings,
    },
  };
}

export function cleanEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().toLowerCase();
}

export function emailOk(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 80;
}

export function cleanName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 20) return null;
  return name;
}
