"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { api } from "@/lib/client";
import { SOURCE_LABEL } from "@/lib/labels";

type Live = {
  id: string;
  source: string;
  externalId: string;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
};

export function LiveLotDetail({ source, externalId }: { source: string; externalId: string }) {
  const [lot, setLot] = useState<Live | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ lot: Live }>(`/api/lots/live/${source}/${encodeURIComponent(externalId)}`)
      .then((result) => setLot(result.lot))
      .catch((reason: Error) => setError(reason.message));
  }, [source, externalId]);
  if (error) return <div className="page"><p className="alert alert-bad">{error}</p><Link href="/report">改为手动上报</Link></div>;
  if (!lot) return <div className="page">正在向地图开放平台核对…</div>;
  const href = `/report?name=${encodeURIComponent(lot.name)}&city=${encodeURIComponent(lot.city)}&district=${encodeURIComponent(lot.district)}&address=${encodeURIComponent(lot.address)}&lat=${lot.lat}&lng=${lot.lng}&source=${lot.source}&externalId=${encodeURIComponent(lot.externalId)}&phone=${encodeURIComponent(lot.phone)}`;
  return (
    <div className="page narrow">
      <p className="eyebrow">{SOURCE_LABEL[lot.source] || lot.source} · 实时检索，尚未收录</p>
      <h2 style={{ fontSize: 40, margin: "8px 0" }}>{lot.name}</h2>
      <p className="muted">{lot.city} {lot.district} {lot.address}</p>
      <div className="card" style={{ padding: 16, margin: "16px 0" }}>
        <p>地图开放平台通常只告诉你这里有一个停车场，不告诉你收费标准和外来车能不能进。这两项需要有人补上，审核通过后记 80 积分。</p>
        {lot.phone ? <p>电话 {lot.phone}</p> : null}
        <Link className="btn btn-lime" href={href}>补上收费和车位，赚积分</Link>
      </div>
      <MapCanvas caption={lot.name} points={[{ id: lot.id, lat: lot.lat, lng: lot.lng, label: "?" }]} selectedId={lot.id} />
    </div>
  );
}
