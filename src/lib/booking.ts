import { FEE_RATE, POINT_CENTS } from "./constants";
import { addDays, addMonths, floorToHour, formatSh, fromSh, parseShDateTime, parseYmd, shParts } from "./time";

export type ListingMode = "hour" | "day" | "night" | "month" | "year" | "holiday";

export type ListingTerms = {
  mode: ListingMode;
  priceCents: number;
  windowStart: string;
  windowEnd: string;
  startAt: Date | null;
  endAt: Date | null;
  holidayName: string;
};

export type QuoteRequest = {
  date?: string;
  startHour?: number;
  hours?: number;
  days?: number;
  nights?: number;
  months?: number;
  years?: number;
};

export type Interval = { start: Date; end: Date };

export type Quote =
  | { ok: true; intervals: Interval[]; rentCents: number; label: string }
  | { ok: false; message: string };

export type Settlement = {
  pointsUsed: number;
  pointsValueCents: number;
  cashCents: number;
  platformFeeCents: number;
  ownerPayoutCents: number;
  subsidyCents: number;
};

function fail(message: string): Quote {
  return { ok: false, message };
}

export function parseMinutes(value: string | undefined, fallback: string): number | null {
  const source = value && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const match = /^(\d{2}):(\d{2})$/.exec(source);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

export function intervalFromWindow(y: number, m: number, d: number, startMin: number, endMin: number): Interval {
  const start = fromSh(y, m, d, Math.floor(startMin / 60), startMin % 60);
  if (startMin < endMin) {
    return { start, end: fromSh(y, m, d, Math.floor(endMin / 60), endMin % 60) };
  }
  const next = addDays(y, m, d, 1);
  return { start, end: fromSh(next.y, next.m, next.d, Math.floor(endMin / 60), endMin % 60) };
}

function wholeNumber(value: number | undefined, min: number, max: number): number | null {
  if (value == null || !Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function buildQuote(listing: ListingTerms, request: QuoteRequest, now = new Date()): Quote {
  if (!Number.isInteger(listing.priceCents) || listing.priceCents < 100) {
    return fail("这个方案的价格还没有设置好");
  }

  if (listing.mode === "hour") {
    const date = parseYmd(request.date);
    const startHour = wholeNumber(request.startHour, 0, 23);
    const hours = wholeNumber(request.hours, 1, 72);
    if (!date || startHour == null || hours == null) return fail("按小时出租需要选择日期、开始小时和时长");
    const start = fromSh(date.y, date.m, date.d, startHour, 0);
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    if (start < floorToHour(now)) return fail("开始时间不能早于当前这个小时");
    if (end <= now) return fail("这个时段已经结束");
    return {
      ok: true,
      intervals: [{ start, end }],
      rentCents: hours * listing.priceCents,
      label: `${hours} 小时`,
    };
  }

  if (listing.mode === "day" || listing.mode === "night") {
    const date = parseYmd(request.date);
    const count = wholeNumber(listing.mode === "day" ? request.days : request.nights, 1, 31);
    if (!date || count == null) {
      return fail(listing.mode === "day" ? "请选择从哪一天开始，以及连续几个白天" : "请选择从哪一晚开始，以及连续几个夜间");
    }
    const fallbackStart = listing.mode === "day" ? "08:00" : "20:00";
    const fallbackEnd = listing.mode === "day" ? "20:00" : "08:00";
    const startMin = parseMinutes(listing.windowStart, fallbackStart);
    const endMin = parseMinutes(listing.windowEnd, fallbackEnd);
    if (startMin == null || endMin == null) return fail("时段格式需要是 08:00 这样");
    if (listing.mode === "day" && startMin >= endMin) return fail("白天档需要落在同一天里，例如 08:00 到 20:00");
    const intervals: Interval[] = [];
    for (let index = 0; index < count; index += 1) {
      const day = addDays(date.y, date.m, date.d, index);
      intervals.push(intervalFromWindow(day.y, day.m, day.d, startMin, endMin));
    }
    if (intervals.some((item) => item.end <= now)) return fail("选择里包含已经结束的时段，请从还没结束的日期开始");
    return {
      ok: true,
      intervals,
      rentCents: count * listing.priceCents,
      label: listing.mode === "day" ? `${count} 个白天` : `${count} 个夜间`,
    };
  }

  if (listing.mode === "month" || listing.mode === "year") {
    const date = parseYmd(request.date);
    const count =
      listing.mode === "month" ? wholeNumber(request.months, 1, 24) : wholeNumber(request.years, 1, 3);
    if (!date || count == null) return fail(listing.mode === "month" ? "请选择起租日和月数" : "请选择起租日和年数");
    const today = shParts(now);
    const todayStart = fromSh(today.y, today.m, today.d, 0, 0);
    const start = fromSh(date.y, date.m, date.d, 0, 0);
    if (start < todayStart) return fail("起租日不能早于今天");
    const months = listing.mode === "month" ? count : count * 12;
    const endParts = addMonths(date.y, date.m, date.d, months);
    const end = fromSh(endParts.y, endParts.m, endParts.d, 0, 0);
    if (end <= start) return fail("租期长度无效");
    return {
      ok: true,
      intervals: [{ start, end }],
      rentCents: count * listing.priceCents,
      label: listing.mode === "month" ? `${count} 个月` : `${count} 年`,
    };
  }

  if (!listing.startAt || !listing.endAt || listing.endAt <= listing.startAt) {
    return fail("节假日档还没有完整的起止时间");
  }
  if (listing.endAt <= now) return fail("这个档期已经结束");
  if (listing.startAt <= now) return fail("整段档期已经开始，不能中途加入");
  const name = listing.holidayName.trim() || "整段档期";
  return {
    ok: true,
    intervals: [{ start: listing.startAt, end: listing.endAt }],
    rentCents: listing.priceCents,
    label: name,
  };
}

export function rangesOverlap(left: Interval[], right: Interval[]): boolean {
  for (const a of left) {
    for (const b of right) {
      if (a.start < b.end && b.start < a.end) return true;
    }
  }
  return false;
}

export function settle(rentCents: number, pointsAvailable: number, pointsRequested: number): Settlement {
  const cap = Math.min(Math.max(0, Math.floor(pointsAvailable)), Math.floor(rentCents / POINT_CENTS));
  const requested = Number.isFinite(pointsRequested) ? Math.floor(pointsRequested) : 0;
  const pointsUsed = Math.min(Math.max(0, requested), cap);
  const pointsValueCents = pointsUsed * POINT_CENTS;
  const cashCents = rentCents - pointsValueCents;
  const platformFeeCents = Math.round(rentCents * FEE_RATE);
  const ownerPayoutCents = rentCents - platformFeeCents;
  return {
    pointsUsed,
    pointsValueCents,
    cashCents,
    platformFeeCents,
    ownerPayoutCents,
    subsidyCents: pointsValueCents,
  };
}

export function encodeIntervals(intervals: Interval[]): string {
  return JSON.stringify(intervals.map((item) => ({ start: item.start.toISOString(), end: item.end.toISOString() })));
}

export function decodeIntervals(raw: string | null | undefined): Interval[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { start: string; end: string }[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ start: new Date(item.start), end: new Date(item.end) }))
      .filter((item) => !Number.isNaN(item.start.getTime()) && !Number.isNaN(item.end.getTime()));
  } catch {
    return [];
  }
}

export type Phase = "cancelled" | "upcoming" | "active" | "gap" | "ended";

export function describePhase(status: string, intervals: Interval[], now = new Date()): { phase: Phase; label: string } {
  if (status === "cancelled") return { phase: "cancelled", label: "已取消" };
  if (intervals.length === 0) return { phase: "ended", label: "已结束" };
  const first = intervals[0].start;
  const last = intervals[intervals.length - 1].end;
  if (now < first) return { phase: "upcoming", label: "未开始" };
  if (now >= last) return { phase: "ended", label: "已结束" };
  if (intervals.some((item) => item.start <= now && now < item.end)) return { phase: "active", label: "进行中" };
  return { phase: "gap", label: "两段之间" };
}

export function canCancel(status: string, intervals: Interval[], now = new Date()): boolean {
  if (status !== "confirmed" || intervals.length === 0) return false;
  return now < intervals[0].start;
}

export function formatSpan(intervals: Interval[]): string {
  if (intervals.length === 0) return "";
  if (intervals.length === 1) return `${formatSh(intervals[0].start)} – ${formatSh(intervals[0].end)}`;
  return intervals.map((item) => `${formatSh(item.start)} – ${formatSh(item.end, true).slice(11)}`).join("，");
}

export function holidayInputToDate(input: string | null | undefined): Date | null {
  return parseShDateTime(input);
}
