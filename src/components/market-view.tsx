"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { api } from "@/lib/client";
import { CITIES } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import { LOT_TYPE_LABEL, MODE_LABEL } from "@/lib/labels";
import { formatYuan } from "@/lib/money";

type Listing = { id: string; mode: string; priceCents: number; holidayName: string };
type Spot = {
  id: string;
  title: string;
  city: string;
  district: string;
  community: string;
  address: string;
  lat: number;
  lng: number;
  spotType: string;
  hasCharger: boolean;
  owner: { name: string };
  listings: Listing[];
  fromPrice: number | null;
  distanceM: number | null;
};

export function MarketView() {
  const [city, setCity] = useState("上海");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [center, setCenter] = useState("共享车位");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const search = new URLSearchParams({ city });
    if (query) search.set("q", query);
    if (mode) search.set("mode", mode);
    api<{ spots: Spot[]; center: { label: string } }>(`/api/spots?${search.toString()}`).then((result) => {
      setSpots(result.spots);
      setCenter(result.center.label);
      if (result.spots[0]) setCity(result.spots[0].city);
    }).catch(() => setSpots([]));
  }, [city, query, mode]);

  return (
    <div className="page">
      <p className="eyebrow">Share a bay · 私人车位</p>
      <div className="section-title">
        <h2>把空车位租给正好需要的人。</h2>
        <Link className="btn btn-lime" href="/publish">发布我的车位</Link>
      </div>
      <form className="search-panel" onSubmit={(event) => { event.preventDefault(); setQuery(draft.trim()); }}>
        <div className="search-row">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="武康路、西湖、科技园…" aria-label="想停车的地方" />
          <button className="btn btn-ink" type="submit">找可租车位</button>
        </div>
        <div className="chips">
          {CITIES.map((item) => (
            <button key={item} type="button" className={`chip ${city === item && !query ? "on" : ""}`} onClick={() => { setCity(item); setQuery(""); setDraft(""); }}>{item}</button>
          ))}
          <button type="button" className={`chip ${mode === "" ? "on" : ""}`} onClick={() => setMode("")}>全部方式</button>
          {Object.entries(MODE_LABEL).map(([key, label]) => (
            <button key={key} type="button" className={`chip ${mode === key ? "on" : ""}`} onClick={() => setMode(key)}>{label}</button>
          ))}
        </div>
      </form>
      <div className="section-title"><h2 style={{ fontSize: 24 }}>{center}</h2><p className="muted">{spots.length} 个在租</p></div>
      <div className="split">
        <div className="list">
          {spots.map((spot) => (
            <Link key={spot.id} href={`/market/${spot.id}`} className={`card spot-card ${selected === spot.id ? "selected" : ""}`} onMouseEnter={() => setSelected(spot.id)}>
              <div className="row spread">
                <span className="chips">
                  <span className="tag tag-lime">{LOT_TYPE_LABEL[spot.spotType] || "车位"}</span>
                  {spot.hasCharger ? <span className="tag tag-moss">可充电</span> : null}
                </span>
                <b>{spot.distanceM != null ? formatDistance(spot.distanceM) : ""}</b>
              </div>
              <strong>{spot.title}</strong>
              <span className="muted">{spot.district} {spot.community} · 房东 {spot.owner.name}</span>
              <div className="chips">
                {spot.listings.map((listing) => (
                  <span key={listing.id} className="tag">{MODE_LABEL[listing.mode] || listing.mode} {listing.holidayName} {formatYuan(listing.priceCents)}</span>
                ))}
              </div>
            </Link>
          ))}
          {spots.length === 0 ? <div className="card empty">这个范围还没有房东放出车位。</div> : null}
        </div>
        <div className="map-sticky">
          <MapCanvas
            caption={center}
            selectedId={selected}
            onSelect={setSelected}
            points={spots.map((spot) => ({ id: spot.id, lat: spot.lat, lng: spot.lng, label: "租", tone: "spot" as const }))}
          />
        </div>
      </div>
    </div>
  );
}
