"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { api } from "@/lib/client";
import { CITIES } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import { LOT_TYPE_LABEL, VISITOR_LABEL } from "@/lib/labels";
import { formatYuan } from "@/lib/money";

type Lot = {
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
  allowVisitor: string;
  availableSpots: number | null;
  flexibleSpots: number | null;
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

type SearchResponse = {
  city: string;
  query: string;
  radius: number | null;
  center: { lat: number; lng: number; label: string };
  mapConfigured: boolean;
  lots: Lot[];
  live: Lot[];
};

type Ad = { id: string; title: string; subtitle: string; href: string };

export function HomeView() {
  const params = useSearchParams();
  const router = useRouter();
  const [city, setCity] = useState(params.get("city") || "上海");
  const [query, setQuery] = useState(params.get("q") || "");
  const [draft, setDraft] = useState(params.get("q") || "");
  const [radius, setRadius] = useState(params.get("radius") || "5000");
  const [visitor, setVisitor] = useState(params.get("visitor") === "yes");
  const [ev, setEv] = useState(params.get("ev") === "1");
  const [night, setNight] = useState(params.get("night") === "1");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const search = new URLSearchParams();
    search.set("city", city);
    if (query) search.set("q", query);
    if (query) search.set("radius", radius);
    if (visitor) search.set("visitor", "yes");
    if (ev) search.set("ev", "1");
    if (night) search.set("night", "1");
    api<SearchResponse>(`/api/lots?${search.toString()}`)
      .then((result) => {
        setData(result);
        setError("");
        if (result.city !== city) setCity(result.city);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [city, query, radius, visitor, ev, night]);

  useEffect(() => {
    api<{ ads: Ad[] }>("/api/ads?placement=home").then((result) => setAds(result.ads)).catch(() => setAds([]));
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setQuery(draft.trim());
    const search = new URLSearchParams();
    search.set("city", city);
    if (draft.trim()) search.set("q", draft.trim());
    router.replace(`/?${search.toString()}`);
  }

  const cards = useMemo(() => [...(data?.lots || []), ...(data?.live || [])], [data]);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Public parking · 先看公共车场</p>
          <h1>去之前，先看这附近有没有位。</h1>
          <p className="lede">收费、外来车能不能进、还剩多少临停位。位享把说得清的信息摊开。说不清的，就标明待核实，不替停车场编数字。</p>
          <div className="stat-row">
            <div className="stat"><b>8%</b><span>向车主收取的服务费</span></div>
            <div className="stat"><b>1 小时</b><span>共享车位最短可租</span></div>
            <div className="stat"><b>10 积分</b><span>抵 1 元租金</span></div>
          </div>
        </div>
        <aside className="ticket">
          <div>
            <strong>空着的车位，也可以上岗。</strong>
            <p>家里的固定车位可以按白天、夜间、包月、包年，或者春节、国庆这种整段档期租出去。</p>
          </div>
          <div className="stub"><span>WEIXIANG</span><span>NO. 001</span></div>
        </aside>
      </section>

      <form className="search-panel" onSubmit={submit}>
        <div className="search-row">
          <label className="sr" htmlFor="destination">目的地</label>
          <input id="destination" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="人民广场、陆家嘴、西湖、国贸…" />
          <button className="btn btn-ink" type="submit">查看附近</button>
        </div>
        <div className="chips">
          {CITIES.map((item) => (
            <button key={item} type="button" className={`chip ${city === item ? "on" : ""}`} onClick={() => { setCity(item); setQuery(""); setDraft(""); }}>
              {item}
            </button>
          ))}
          {["1000", "3000", "5000", "8000"].map((item) => (
            <button key={item} type="button" className={`chip ${query && radius === item ? "on" : ""}`} onClick={() => setRadius(item)}>
              {Number(item) / 1000} km
            </button>
          ))}
          <button type="button" className={`chip ${visitor ? "on" : ""}`} onClick={() => setVisitor((value) => !value)}>外来车可进</button>
          <button type="button" className={`chip ${ev ? "on" : ""}`} onClick={() => setEv((value) => !value)}>有充电桩</button>
          <button type="button" className={`chip ${night ? "on" : ""}`} onClick={() => setNight((value) => !value)}>夜间开放</button>
        </div>
      </form>

      {ads[0] ? (
        <Link className="banner" href={ads[0].href || "/market"}>
          <span><b>{ads[0].title}</b><span>{ads[0].subtitle}</span></span>
          <span className="tag">看看</span>
        </Link>
      ) : null}

      {error ? <p className="alert alert-bad">{error}</p> : null}

      <div className="section-title">
        <h2>{data?.center.label || city}</h2>
        <p className="muted">
          {data ? `${query ? `${query} 附近` : "全城浏览"} · 收录 ${data.lots.length} 个` : "正在铺开"}
          {data?.live.length ? ` · 地图实时 ${data.live.length} 条` : ""}
          {data && !data.mapConfigured ? " · 地图开放平台未配置" : ""}
        </p>
      </div>

      <div className="split">
        <div className="list">
          {cards.map((lot) => (
            <Link
              id={`lot-${lot.id}`}
              key={lot.id}
              href={lot.live ? `/lots/live/${lot.source}/${encodeURIComponent(lot.externalId || "")}` : `/lots/${lot.id}`}
              className={`card lot-card ${selected === lot.id ? "selected" : ""}`}
              onMouseEnter={() => setSelected(lot.id)}
              onFocus={() => setSelected(lot.id)}
            >
              <div className="card-top row">
                <span className="chips">
                  <span className="tag">{LOT_TYPE_LABEL[lot.lotType] || "停车场"}</span>
                  <span className={`tag ${lot.allowVisitor === "yes" ? "tag-moss" : lot.allowVisitor === "no" ? "tag-coral" : ""}`}>
                    {VISITOR_LABEL[lot.allowVisitor] || "待核实"}
                  </span>
                  {lot.live ? <span className="tag tag-lime">地图实时</span> : null}
                  {lot.verified ? <span className="tag">已核</span> : null}
                </span>
                <b>{formatDistance(lot.distanceM)}</b>
              </div>
              <strong>{lot.name}</strong>
              <span className="muted">{lot.district} {lot.address}</span>
              <div className="spread">
                <span className="price">{formatYuan(lot.hourlyPrice)}<small>/小时</small></span>
                <span className="muted">
                  {lot.availableSpots == null ? "余位待补充" : `${lot.availabilityMode === "live" ? "接入余位" : "收录可用"} ${lot.availableSpots}`}
                  {lot.dailyCap != null ? ` · 日封顶 ${formatYuan(lot.dailyCap)}` : ""}
                </span>
              </div>
            </Link>
          ))}
          {data && cards.length === 0 ? (
            <div className="card empty">
              这附近还没有收录停车场。你可以第一个上报，审核通过记 80 积分。
              <div style={{ marginTop: 12 }}><Link className="btn btn-lime" href="/report">去上报</Link></div>
            </div>
          ) : null}
        </div>
        <div className="map-sticky">
          <MapCanvas
            caption={data?.center.label}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              document.getElementById(`lot-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }}
            points={cards.map((lot) => ({
              id: lot.id,
              lat: lot.lat,
              lng: lot.lng,
              label: lot.hourlyPrice != null ? formatYuan(lot.hourlyPrice).replace("¥", "") : "?",
              tone: "lot",
            }))}
          />
        </div>
      </div>
      <p className="footer-note">公共车场的余位如果没有车场系统接入，就是人工更新的收录值，不是地磁实时数。共享车位在市场里单独出租。</p>
    </div>
  );
}
