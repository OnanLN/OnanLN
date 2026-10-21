"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { useSession } from "@/components/shell";
import { ApiError, api } from "@/lib/client";
import { LOT_TYPE_LABEL, MODE_LABEL } from "@/lib/labels";
import { formatCents, formatYuan } from "@/lib/money";
import { formatSh, shParts, tomorrowYmd } from "@/lib/time";

type Listing = {
  id: string;
  mode: string;
  priceCents: number;
  windowStart: string;
  windowEnd: string;
  startAt: string | null;
  endAt: string | null;
  holidayName: string;
  note: string;
};

type Spot = {
  id: string;
  title: string;
  description: string;
  city: string;
  district: string;
  community: string;
  address: string;
  lat: number;
  lng: number;
  spotType: string;
  vehicleLimit: string;
  hasCharger: boolean;
  owner: { id: string; name: string };
  listings: Listing[];
  spotCode: string;
  accessGuide: string;
  privileged: boolean;
  isOwner: boolean;
};

type Quote = {
  label: string;
  rentCents: number;
  cashCents: number;
  pointsUsed: number;
  pointsValueCents: number;
  platformFeeCents: number;
  ownerPayoutCents: number;
  subsidyCents: number;
  pointsAvailable: number;
  available: boolean;
  conflictMessage: string;
  intervals: { start: string; end: string }[];
};

export function SpotDetail({ id }: { id: string }) {
  const router = useRouter();
  const { me, refresh } = useSession();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [error, setError] = useState("");
  const [listingId, setListingId] = useState("");
  const [date, setDate] = useState(tomorrowYmd());
  const [startHour, setStartHour] = useState(() => Math.min(23, shParts(new Date()).hh + 1));
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState(1);
  const [nights, setNights] = useState(1);
  const [months, setMonths] = useState(1);
  const [years, setYears] = useState(1);
  const [points, setPoints] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<{ spot: Spot }>(`/api/spots/${id}`)
      .then((result) => {
        setSpot(result.spot);
        setListingId((current) => current || result.spot.listings[0]?.id || "");
      })
      .catch((reason: Error) => setError(reason.message));
  }
  useEffect(load, [id]);

  const listing = spot?.listings.find((item) => item.id === listingId);

  const body = useMemo(() => {
    if (!listing) return null;
    return {
      listingId: listing.id,
      date,
      startHour,
      hours,
      days,
      nights,
      months,
      years,
      pointsToUse: points,
    };
  }, [listing, date, startHour, hours, days, nights, months, years, points]);

  useEffect(() => {
    if (!body) return;
    const timer = window.setTimeout(() => {
      api<Quote>("/api/bookings/quote", { method: "POST", body: JSON.stringify(body) })
        .then((result) => {
          setQuote(result);
          setQuoteError("");
          if (points > result.pointsAvailable) setPoints(result.pointsAvailable);
        })
        .catch((reason: Error) => {
          setQuote(null);
          setQuoteError(reason.message);
        });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [body, points]);

  async function book() {
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(`/market/${id}`)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ conversationId: string }>("/api/bookings", { method: "POST", body: JSON.stringify(body) });
      refresh();
      router.push(`/messages/${result.conversationId}`);
    } catch (reason) {
      setQuoteError(reason instanceof ApiError ? reason.message : "锁定失败");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function ask() {
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(`/market/${id}`)}`);
      return;
    }
    const result = await api<{ id: string }>("/api/conversations", { method: "POST", body: JSON.stringify({ spotId: id }) });
    router.push(`/messages/${result.id}`);
  }

  if (error) return <div className="page"><p className="alert alert-bad">{error}</p></div>;
  if (!spot) return <div className="page">正在打开这个车位…</div>;

  return (
    <div className="page">
      <p className="eyebrow">{spot.city} · 房东 {spot.owner.name}</p>
      <div className="section-title">
        <h2>{spot.title}</h2>
        {spot.isOwner ? <Link className="btn btn-ghost" href={`/publish/${spot.id}`}>编辑</Link> : <button className="btn btn-ghost" type="button" onClick={ask}>咨询房东</button>}
      </div>
      <div className="chips" style={{ marginBottom: 12 }}>
        <span className="tag tag-lime">{LOT_TYPE_LABEL[spot.spotType]}</span>
        <span className="tag">{spot.vehicleLimit}</span>
        {spot.hasCharger ? <span className="tag tag-moss">可充电</span> : null}
      </div>
      <div className="detail-layout">
        <div className="stack">
          <div className="card" style={{ padding: 16 }}>
            <p>{spot.description || "房东还没有写更多介绍。"}</p>
            <p className="muted">{spot.district} {spot.community} · {spot.address}</p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <b>进场说明</b>
            {spot.privileged ? (
              <p>车位编号 {spot.spotCode || "未填"}。{spot.accessGuide || "房东没有留进场说明，可以直接在对话里问。"}</p>
            ) : (
              <p className="muted">锁定时段之后才会显示车位编号和进场方式，避免空门禁码被公开。</p>
            )}
          </div>
          <MapCanvas caption={spot.community || spot.title} points={[{ id: spot.id, lat: spot.lat, lng: spot.lng, label: "租", tone: "spot" }]} selectedId={spot.id} />
        </div>
        <aside className="card booker">
          <b>选择一种租法</b>
          {spot.listings.map((item) => (
            <button key={item.id} type="button" className={`choice ${item.id === listingId ? "on" : ""}`} onClick={() => setListingId(item.id)}>
              <div className="spread"><strong>{MODE_LABEL[item.mode]} {item.holidayName}</strong><span>{formatYuan(item.priceCents)}</span></div>
              <span className="muted">
                {item.mode === "day" || item.mode === "night" ? `${item.windowStart}–${item.windowEnd}` : ""}
                {item.mode === "holiday" && item.startAt && item.endAt ? `${formatSh(new Date(item.startAt))} – ${formatSh(new Date(item.endAt))}` : ""}
                {item.note ? ` ${item.note}` : ""}
              </span>
            </button>
          ))}
          {listing && listing.mode !== "holiday" ? (
            <label className="field"><span>从哪一天开始</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          ) : null}
          {listing?.mode === "hour" ? (
            <div className="grid-2">
              <label className="field"><span>开始小时</span><input type="number" min={0} max={23} value={startHour} onChange={(event) => setStartHour(Number(event.target.value))} /></label>
              <label className="field"><span>连续几小时</span><input type="number" min={1} max={72} value={hours} onChange={(event) => setHours(Number(event.target.value))} /></label>
            </div>
          ) : null}
          {listing?.mode === "day" ? <label className="field"><span>连续几个白天</span><input type="number" min={1} max={31} value={days} onChange={(event) => setDays(Number(event.target.value))} /></label> : null}
          {listing?.mode === "night" ? <label className="field"><span>连续几个夜间</span><input type="number" min={1} max={31} value={nights} onChange={(event) => setNights(Number(event.target.value))} /></label> : null}
          {listing?.mode === "month" ? <label className="field"><span>连续几个月</span><input type="number" min={1} max={24} value={months} onChange={(event) => setMonths(Number(event.target.value))} /></label> : null}
          {listing?.mode === "year" ? <label className="field"><span>连续几年</span><input type="number" min={1} max={3} value={years} onChange={(event) => setYears(Number(event.target.value))} /></label> : null}
          {me && quote ? (
            <label className="field">
              <span>用积分抵扣，最多 {quote.pointsAvailable}</span>
              <input className="range" type="range" min={0} max={quote.pointsAvailable} value={Math.min(points, quote.pointsAvailable)} onChange={(event) => setPoints(Number(event.target.value))} />
            </label>
          ) : <p className="muted">登录后可以用积分抵扣，10 积分 = 1 元。</p>}
          {quoteError ? <div className="alert alert-bad">{quoteError}</div> : null}
          {quote?.conflictMessage ? <div className="alert">{quote.conflictMessage}</div> : null}
          {quote ? (
            <div className="stack">
              <div className="spread"><span>租金 · {quote.label}</span><b>{formatCents(quote.rentCents)}</b></div>
              <div className="spread"><span>积分抵扣</span><b>{quote.pointsValueCents > 0 ? `-${formatCents(quote.pointsValueCents)}` : "¥0"}</b></div>
              <div className="spread"><span>你需要付的现金</span><b>{formatCents(quote.cashCents)}</b></div>
              <p className="muted">平台服务费按租金 8% 记 {formatCents(quote.platformFeeCents)}，车主预计入账 {formatCents(quote.ownerPayoutCents)}。积分抵扣的 {formatCents(quote.subsidyCents)} 由平台补贴给车主，不从车主收入里扣。</p>
              <p className="muted">{quote.intervals.map((item) => `${formatSh(new Date(item.start))} – ${formatSh(new Date(item.end))}`).join("；")}</p>
            </div>
          ) : null}
          <button className="btn btn-ink btn-block" type="button" disabled={busy || !quote?.available || spot.isOwner} onClick={book}>
            {spot.isOwner ? "这是你自己的车位" : me ? "锁定这个时段" : "登录后锁定"}
          </button>
          <p className="muted">开始前可以取消并退回积分。现金部分这一版先记账，接入微信支付后再扣款。</p>
        </aside>
      </div>
    </div>
  );
}
