"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/shell";
import { api } from "@/lib/client";
import { CITIES } from "@/lib/constants";
import { formatSh } from "@/lib/time";
import { MODE_LABEL, type ListingMode } from "@/lib/labels";

type ListingDraft = {
  key: string;
  id?: string;
  mode: ListingMode;
  priceYuan: string;
  windowStart: string;
  windowEnd: string;
  holidayName: string;
  startAt: string;
  endAt: string;
  note: string;
};

type SpotPayload = {
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
  listings: Array<{
    id: string;
    mode: ListingMode;
    priceCents: number;
    windowStart: string;
    windowEnd: string;
    holidayName: string;
    startAt: string | null;
    endAt: string | null;
    note: string;
  }>;
};

const emptyListing = (mode: ListingMode): ListingDraft => ({
  key: `${mode}-${Math.random().toString(36).slice(2, 7)}`,
  mode,
  priceYuan: mode === "hour" ? "8" : mode === "night" ? "18" : mode === "month" ? "900" : mode === "year" ? "9600" : mode === "holiday" ? "260" : "35",
  windowStart: mode === "night" ? "20:00" : "08:00",
  windowEnd: mode === "night" ? "08:00" : "20:00",
  holidayName: "",
  startAt: "",
  endAt: "",
  note: "",
});

function yuanToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

export function PublishForm({ spotId }: { spotId?: string }) {
  const router = useRouter();
  const { me } = useSession();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("上海");
  const [district, setDistrict] = useState("");
  const [community, setCommunity] = useState("");
  const [address, setAddress] = useState("");
  const [spotCode, setSpotCode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [spotType, setSpotType] = useState("underground");
  const [vehicleLimit, setVehicleLimit] = useState("轿车");
  const [hasCharger, setHasCharger] = useState(false);
  const [description, setDescription] = useState("");
  const [accessGuide, setAccessGuide] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [listings, setListings] = useState<ListingDraft[]>([emptyListing("day"), emptyListing("night")]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!spotId || !me) return;
    api<{ spot: SpotPayload }>(`/api/spots/${spotId}`).then((result) => {
      const spot = result.spot;
      setTitle(spot.title);
      setCity(spot.city);
      setDistrict(spot.district);
      setCommunity(spot.community);
      setAddress(spot.address);
      setSpotCode(spot.spotCode);
      setLat(String(spot.lat));
      setLng(String(spot.lng));
      setSpotType(spot.spotType);
      setVehicleLimit(spot.vehicleLimit);
      setHasCharger(spot.hasCharger);
      setDescription(spot.description);
      setAccessGuide(spot.accessGuide);
      setStatus(spot.status);
      setListings(spot.listings.map((item) => ({
        key: item.id,
        id: item.id,
        mode: item.mode,
        priceYuan: String(item.priceCents / 100),
        windowStart: item.windowStart,
        windowEnd: item.windowEnd,
        holidayName: item.holidayName,
        startAt: item.startAt ? formatSh(new Date(item.startAt)).replace(" ", "T") : "",
        endAt: item.endAt ? formatSh(new Date(item.endAt)).replace(" ", "T") : "",
        note: item.note,
      })));
    }).catch((reason: Error) => setError(reason.message));
  }, [spotId, me]);

  async function locate() {
    const result = await api<{ best: { lat: number; lng: number; name: string } | null; suggestions: { lat: number; lng: number; name: string }[]; live: { lat: number; lng: number } | null }>(`/api/geocode?q=${encodeURIComponent(landmark)}&city=${encodeURIComponent(city)}`);
    const hit = result.best || result.live || result.suggestions[0];
    if (!hit) setError("没有对上这个地标，换一个近一点的试试");
    else {
      setLat(String(hit.lat));
      setLng(String(hit.lng));
      setError("");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      title, city, district, community, address, spotCode, lat: Number(lat), lng: Number(lng), spotType, vehicleLimit, hasCharger, description, accessGuide, status,
      listings: listings.map((item) => ({
        id: item.id,
        mode: item.mode,
        priceCents: yuanToCents(item.priceYuan),
        windowStart: item.windowStart,
        windowEnd: item.windowEnd,
        holidayName: item.holidayName,
        startAt: item.mode === "holiday" ? item.startAt.replace("T", " ") : "",
        endAt: item.mode === "holiday" ? item.endAt.replace("T", " ") : "",
        note: item.note,
      })),
    };
    try {
      if (spotId) {
        await api(`/api/spots/${spotId}`, { method: "PATCH", body: JSON.stringify(payload) });
        router.push(`/market/${spotId}`);
      } else {
        const created = await api<{ id: string }>("/api/spots", { method: "POST", body: JSON.stringify(payload) });
        router.push(`/market/${created.id}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  if (me === undefined) return <div className="page">正在确认账号…</div>;
  if (me === null) {
    return <div className="page narrow"><div className="card form-card"><h2>先登录，再把车位放出来。</h2><a className="btn btn-ink" href={`/login?next=${encodeURIComponent(spotId ? `/publish/${spotId}` : "/publish")}`}>去登录</a></div></div>;
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Landlord · 你既是车主，也可以是租客</p>
      <h2 style={{ fontSize: 42, marginBottom: 8 }}>{spotId ? "改一改这个车位" : "放出一个空车位"}</h2>
      <p className="muted">车位编号和进场说明只有锁定成功的租客能看到。价格按元填写，时长可以精确到小时。</p>
      <form className="stack" onSubmit={submit} style={{ marginTop: 16 }}>
        <div className="card form-card">
          <label className="field"><span>车位叫什么</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="衡复路地面车位，白天大多空着" /></label>
          <div className="grid-2">
            <label className="field"><span>城市</span><input list="cities" value={city} onChange={(event) => setCity(event.target.value)} /><datalist id="cities">{CITIES.map((item) => <option key={item} value={item} />)}</datalist></label>
            <label className="field"><span>区</span><input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="徐汇区" /></label>
          </div>
          <div className="grid-2">
            <label className="field"><span>小区或楼</span><input value={community} onChange={(event) => setCommunity(event.target.value)} /></label>
            <label className="field"><span>车位编号，租客锁定后可见</span><input value={spotCode} onChange={(event) => setSpotCode(event.target.value)} placeholder="B2-086" /></label>
          </div>
          <label className="field"><span>地址</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="衡复路靠近乌鲁木齐路" /></label>
          <div className="search-row">
            <input value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="用地标定位，例如武康路" aria-label="地标" />
            <button className="btn btn-ghost" type="button" onClick={locate}>定位</button>
          </div>
          <p className="muted">{lat && lng ? `已定位 ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "还没有坐标"}</p>
        </div>
        <div className="card form-card">
          <div className="grid-2">
            <label className="field"><span>类型</span>
              <select value={spotType} onChange={(event) => setSpotType(event.target.value)}>
                <option value="underground">地下</option>
                <option value="ground">地面</option>
                <option value="mechanical">机械</option>
                <option value="roadside">路边</option>
              </select>
            </label>
            <label className="field"><span>适合车型</span><input value={vehicleLimit} onChange={(event) => setVehicleLimit(event.target.value)} /></label>
          </div>
          <label className="row"><input type="checkbox" checked={hasCharger} onChange={(event) => setHasCharger(event.target.checked)} /> 有充电桩</label>
          <label className="field"><span>给租客看的介绍</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="field"><span>进场说明，锁定后才公开</span><textarea value={accessGuide} onChange={(event) => setAccessGuide(event.target.value)} placeholder="从哪道闸进，找谁开门" /></label>
          <label className="field"><span>状态</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "paused")}>
              <option value="active">上架</option>
              <option value="paused">暂停出租</option>
            </select>
          </label>
        </div>
        <div className="stack">
          {listings.map((listing, index) => (
            <div className="card form-card" key={listing.key}>
              <div className="spread"><b>出租方式 {index + 1}</b><button className="btn btn-ghost" type="button" onClick={() => setListings((items) => items.filter((item) => item.key !== listing.key))}>移除</button></div>
              <div className="grid-2">
                <label className="field"><span>粒度</span>
                  <select value={listing.mode} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, mode: event.target.value as ListingMode } : item))}>
                    {Object.entries(MODE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label className="field"><span>价格（元）</span><input value={listing.priceYuan} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, priceYuan: event.target.value } : item))} /></label>
              </div>
              {listing.mode === "day" || listing.mode === "night" ? (
                <div className="grid-2">
                  <label className="field"><span>开始</span><input value={listing.windowStart} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, windowStart: event.target.value } : item))} placeholder="08:00" /></label>
                  <label className="field"><span>结束</span><input value={listing.windowEnd} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, windowEnd: event.target.value } : item))} placeholder="20:00" /></label>
                </div>
              ) : null}
              {listing.mode === "holiday" ? (
                <>
                  <label className="field"><span>档期名字</span><input value={listing.holidayName} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, holidayName: event.target.value } : item))} placeholder="春节、国庆、跨年" /></label>
                  <div className="grid-2">
                    <label className="field"><span>开始（北京时间）</span><input type="datetime-local" value={listing.startAt} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, startAt: event.target.value } : item))} /></label>
                    <label className="field"><span>结束（北京时间）</span><input type="datetime-local" value={listing.endAt} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, endAt: event.target.value } : item))} /></label>
                  </div>
                </>
              ) : null}
              <label className="field"><span>补充一句</span><input value={listing.note} onChange={(event) => setListings((items) => items.map((item) => item.key === listing.key ? { ...item, note: event.target.value } : item))} /></label>
            </div>
          ))}
          <button className="btn btn-ghost" type="button" onClick={() => setListings((items) => [...items, emptyListing("hour")])}>再加一种租法</button>
        </div>
        {error ? <div className="alert alert-bad">{error}</div> : null}
        <button className="btn btn-ink" disabled={busy} type="submit">{busy ? "正在保存…" : "保存车位"}</button>
      </form>
    </div>
  );
}
