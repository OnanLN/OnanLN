"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { api } from "@/lib/client";
import { LOT_TYPE_LABEL, SOURCE_LABEL, VISITOR_LABEL } from "@/lib/labels";
import { formatYuan } from "@/lib/money";
import { formatSh } from "@/lib/time";

type Lot = {
  id: string;
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
  allowVisitor: string;
  totalSpots: number;
  fixedSpots: number;
  flexibleSpots: number;
  availableSpots: number;
  availabilityMode: string;
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
  verified: boolean;
  updatedAt: string;
};

export function LotDetail({ id }: { id: string }) {
  const [lot, setLot] = useState<Lot | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ lot: Lot }>(`/api/lots/${id}`).then((result) => setLot(result.lot)).catch((reason: Error) => setError(reason.message));
  }, [id]);
  if (error) return <div className="page"><p className="alert alert-bad">{error}</p></div>;
  if (!lot) return <div className="page">正在读停车场资料…</div>;
  const facts = [
    ["外来车辆", VISITOR_LABEL[lot.allowVisitor]],
    ["类型", LOT_TYPE_LABEL[lot.lotType]],
    ["营业", lot.openHours],
    ["夜间", lot.nightOpen ? "开放" : "不开放"],
    ["总车位", String(lot.totalSpots)],
    ["固定车位", String(lot.fixedSpots)],
    ["临停车位", String(lot.flexibleSpots)],
    ["可用", `${lot.availableSpots} · ${lot.availabilityMode === "live" ? "车场接入" : "人工更新"}`],
    ["充电桩", String(lot.evChargers)],
    ["无障碍", String(lot.accessibleSpots)],
    ["限高", lot.heightLimitM ? `${lot.heightLimitM} 米` : "未提供"],
    ["可预约", lot.reservable ? "可以" : "未标明"],
    ["支付", lot.paymentMethods || "未提供"],
    ["电话", lot.phone || "未提供"],
    ["管理方", lot.operatorName || "未提供"],
    ["来源", SOURCE_LABEL[lot.source] || lot.source],
  ];
  return (
    <div className="page">
      <p className="eyebrow">{lot.city} · {lot.district || "公共停车场"}</p>
      <div className="section-title">
        <h2>{lot.name}</h2>
        <Link className="btn btn-ghost" href={`/?city=${encodeURIComponent(lot.city)}&q=${encodeURIComponent(lot.name)}`}>回到附近</Link>
      </div>
      <p className="muted">{lot.address}</p>
      <div className="chips" style={{ margin: "12px 0" }}>
        {lot.verified ? <span className="tag tag-moss">已审核</span> : <span className="tag">待核实</span>}
        <span className="tag">{VISITOR_LABEL[lot.allowVisitor]}</span>
      </div>
      <div className="detail-layout">
        <div className="stack">
          <div className="card" style={{ padding: 16 }}>
            <div className="spread">
              <div><span className="muted">小时价</span><div className="price">{formatYuan(lot.hourlyPrice)}</div></div>
              <div><span className="muted">首小时</span><div className="price">{formatYuan(lot.firstHourPrice)}</div></div>
              <div><span className="muted">日封顶</span><div className="price">{formatYuan(lot.dailyCap)}</div></div>
              <div><span className="muted">月租参考</span><div className="price">{formatYuan(lot.monthlyPrice)}</div></div>
            </div>
            <p>{lot.feeNote || "收费说明还没有人补充。"}</p>
            {lot.freeMinutes ? <p className="muted">{lot.freeMinutes} 分钟内离场免费。</p> : null}
          </div>
          <div className="kv">
            {facts.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}
          </div>
          {lot.rules ? <div className="card" style={{ padding: 16 }}><b>停放规则</b><p>{lot.rules}</p></div> : null}
          <p className="muted">更新于 {formatSh(new Date(lot.updatedAt))}。数字有出入可以更正，审核通过会记积分。</p>
          <Link className="btn btn-lime" href={`/report?lotId=${lot.id}&name=${encodeURIComponent(lot.name)}&city=${encodeURIComponent(lot.city)}&address=${encodeURIComponent(lot.address)}&lat=${lot.lat}&lng=${lot.lng}`}>更正这条资料</Link>
        </div>
        <MapCanvas caption={lot.name} points={[{ id: lot.id, lat: lot.lat, lng: lot.lng, label: "P" }]} selectedId={lot.id} />
      </div>
    </div>
  );
}
