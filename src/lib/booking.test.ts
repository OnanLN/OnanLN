import assert from "node:assert/strict";
import test from "node:test";
import { buildQuote, describePhase, rangesOverlap, settle, type ListingTerms } from "./booking";
import { decideLogin, normalizeIp } from "./ip";
import { bdToWgs, distanceMeters, gcjToWgs, wgsToGcj } from "./geo";
import { addMonths, fromSh } from "./time";
import { hashPassword, verifyPassword } from "./password";

const now = fromSh(2026, 9, 21, 15, 30);

function terms(partial: Partial<ListingTerms> & Pick<ListingTerms, "mode" | "priceCents">): ListingTerms {
  return {
    windowStart: "",
    windowEnd: "",
    startAt: null,
    endAt: null,
    holidayName: "",
    ...partial,
  };
}

test("hourly quote stays on the hour and prices by duration", () => {
  const quote = buildQuote(terms({ mode: "hour", priceCents: 800 }), { date: "2026-10-21", startHour: 16, hours: 3 }, now);
  assert.equal(quote.ok, true);
  if (!quote.ok) return;
  assert.equal(quote.rentCents, 2400);
  assert.equal(quote.label, "3 小时");
  assert.equal(quote.intervals[0].start.toISOString(), fromSh(2026, 9, 21, 16, 0).toISOString());
  assert.equal(quote.intervals[0].end.toISOString(), fromSh(2026, 9, 21, 19, 0).toISOString());
});

test("hourly quote rejects a start before the current hour", () => {
  const quote = buildQuote(terms({ mode: "hour", priceCents: 800 }), { date: "2026-10-21", startHour: 14, hours: 2 }, now);
  assert.equal(quote.ok, false);
});

test("day and night windows touch but do not overlap", () => {
  const day = buildQuote(terms({ mode: "day", priceCents: 3500, windowStart: "08:00", windowEnd: "20:00" }), { date: "2026-10-22", days: 2 }, now);
  const night = buildQuote(terms({ mode: "night", priceCents: 1800, windowStart: "20:00", windowEnd: "08:00" }), { date: "2026-10-22", nights: 1 }, now);
  assert.equal(day.ok && night.ok, true);
  if (!day.ok || !night.ok) return;
  assert.equal(day.rentCents, 7000);
  assert.equal(day.intervals.length, 2);
  assert.equal(rangesOverlap(day.intervals, night.intervals), false);
  const evening = buildQuote(terms({ mode: "hour", priceCents: 800 }), { date: "2026-10-22", startHour: 20, hours: 1 }, now);
  const lateAfternoon = buildQuote(terms({ mode: "hour", priceCents: 800 }), { date: "2026-10-22", startHour: 19, hours: 1 }, now);
  assert.equal(evening.ok && lateAfternoon.ok, true);
  if (!evening.ok || !lateAfternoon.ok) return;
  assert.equal(rangesOverlap(evening.intervals, night.intervals), true);
  assert.equal(rangesOverlap(lateAfternoon.intervals, night.intervals), false);
  assert.equal(rangesOverlap(lateAfternoon.intervals, day.intervals), true);
});

test("month length clamps the end day and multiplies price", () => {
  assert.deepEqual(addMonths(2026, 0, 31, 1), { y: 2026, m: 1, d: 28 });
  const quote = buildQuote(terms({ mode: "month", priceCents: 90000 }), { date: "2026-11-01", months: 2 }, now);
  assert.equal(quote.ok, true);
  if (!quote.ok) return;
  assert.equal(quote.rentCents, 180000);
  assert.equal(quote.intervals[0].end.toISOString(), fromSh(2027, 0, 1, 0, 0).toISOString());
});

test("holiday package uses the landlord window once", () => {
  const quote = buildQuote(
    terms({
      mode: "holiday",
      priceCents: 26000,
      holidayName: "跨年",
      startAt: fromSh(2026, 11, 31, 12, 0),
      endAt: fromSh(2027, 0, 3, 12, 0),
    }),
    {},
    now,
  );
  assert.equal(quote.ok, true);
  if (!quote.ok) return;
  assert.equal(quote.rentCents, 26000);
  assert.equal(quote.label, "跨年");
});

test("points offset cash while the landlord still settles on the full rent", () => {
  const partial = settle(9000, 1000, 250);
  assert.deepEqual(partial, {
    pointsUsed: 250,
    pointsValueCents: 2500,
    cashCents: 6500,
    platformFeeCents: 720,
    ownerPayoutCents: 8280,
    subsidyCents: 2500,
  });
  const full = settle(9000, 5000, 5000);
  assert.equal(full.pointsUsed, 900);
  assert.equal(full.cashCents, 0);
  assert.equal(full.ownerPayoutCents, 8280);
});

test("same network can open another window, a different network cannot", () => {
  assert.equal(decideLogin(["1.1.1.1"], "1.1.1.1", false), "ok");
  assert.equal(decideLogin(["1.1.1.1", "1.1.1.1"], "1.1.1.1", false), "ok");
  assert.equal(decideLogin(["1.1.1.1"], "2.2.2.2", false), "bound");
  assert.equal(decideLogin(["1.1.1.1"], "2.2.2.2", true), "ok");
  assert.equal(decideLogin([], "8.8.8.8", false), "ok");
  assert.equal(normalizeIp("::1"), "127.0.0.1");
  assert.equal(normalizeIp("::ffff:10.0.0.8"), "10.0.0.8");
});

test("map coordinates round-trip inside a few meters", () => {
  const wgs = { lng: 121.4737, lat: 31.2304 };
  const gcj = wgsToGcj(wgs.lng, wgs.lat);
  const back = gcjToWgs(gcj.lng, gcj.lat);
  assert.ok(Math.abs(back.lng - wgs.lng) < 0.0002);
  assert.ok(Math.abs(back.lat - wgs.lat) < 0.0002);
  const bd = bdToWgs(121.481, 31.235);
  assert.ok(distanceMeters(wgs.lat, wgs.lng, bd.lat, bd.lng) < 5000);
  assert.equal(distanceMeters(wgs.lat, wgs.lng, wgs.lat, wgs.lng), 0);
});

test("password hash verifies only the original password", async () => {
  const stored = await hashPassword("Weixiang#2026");
  assert.equal(await verifyPassword("Weixiang#2026", stored), true);
  assert.equal(await verifyPassword("Weixiang#2027", stored), false);
});

test("phase description understands a gap between daytime slices", () => {
  const quote = buildQuote(terms({ mode: "day", priceCents: 3500, windowStart: "08:00", windowEnd: "20:00" }), { date: "2026-10-22", days: 2 }, now);
  assert.equal(quote.ok, true);
  if (!quote.ok) return;
  assert.equal(describePhase("confirmed", quote.intervals, fromSh(2026, 9, 22, 21, 0)).label, "两段之间");
  assert.equal(describePhase("confirmed", quote.intervals, fromSh(2026, 9, 22, 9, 0)).label, "进行中");
  assert.equal(describePhase("cancelled", quote.intervals, now).label, "已取消");
});
