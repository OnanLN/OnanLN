"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useSession } from "@/components/shell";
import { CITIES } from "@/lib/constants";
import { formatYuan } from "@/lib/money";

type Overview = {
  users: number;
  lots: number;
  spots: number;
  bookings: number;
  pendingReports: number;
  feeCents: number;
  rentCents: number;
  cashCents: number;
  subsidyCents: number;
  trustProxy: boolean;
  production: boolean;
};

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
  allowVisitor: string;
  totalSpots: number;
  fixedSpots: number;
  flexibleSpots: number;
  availableSpots: number;
  openHours: string;
  lotType: string;
  evChargers: number;
  heightLimitM: number | null;
  nightOpen: boolean;
  reservable: boolean;
  accessibleSpots: number;
  feeNote: string;
  rules: string;
  operatorName: string;
  phone: string;
  paymentMethods: string;
  source: string;
  externalId: string;
  verified: boolean;
};

type Report = {
  id: string;
  payload: string;
  createdAt: string;
  user: { name: string; email: string };
};

type Ad = { id: string; title: string; subtitle: string; href: string; active: boolean };

const empty = {
  name: "", city: "上海", district: "", address: "", lat: "", lng: "", hourly: "", firstHour: "", daily: "", monthly: "",
  visitor: "unknown", total: "", fixed: "", flexible: "", available: "", freeMinutes: "0", openHours: "全天",
  lotType: "underground", ev: "0", height: "", nightOpen: true, reservable: false, accessible: "0", feeNote: "",
  rules: "", operatorName: "", phone: "", payment: "", source: "manual", externalId: "",
};

export function AdminView() {
  const { me } = useSession();
  const [tab, setTab] = useState<"overview" | "lots" | "reports" | "ads">("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function reload() {
    const [over, lotRes, reportRes, adRes] = await Promise.all([
      api<Overview>("/api/admin/overview"),
      api<{ lots: Lot[] }>("/api/admin/lots"),
      api<{ reports: Report[] }>("/api/reports?queue=1"),
      api<{ ads: Ad[] }>("/api/admin/ads"),
    ]);
    setOverview(over);
    setLots(lotRes.lots);
    setReports(reportRes.reports);
    setAds(adRes.ads);
  }

  useEffect(() => { if (me?.isAdmin) reload().catch((reason: Error) => setMessage(reason.message)); }, [me]);

  function edit(lot: Lot) {
    setEditing(lot.id);
    setTab("lots");
    setForm({
      name: lot.name, city: lot.city, district: lot.district, address: lot.address, lat: String(lot.lat), lng: String(lot.lng),
      hourly: lot.hourlyPrice == null ? "" : String(lot.hourlyPrice / 100),
      firstHour: lot.firstHourPrice == null ? "" : String(lot.firstHourPrice / 100),
      daily: lot.dailyCap == null ? "" : String(lot.dailyCap / 100),
      monthly: lot.monthlyPrice == null ? "" : String(lot.monthlyPrice / 100),
      visitor: lot.allowVisitor, total: String(lot.totalSpots), fixed: String(lot.fixedSpots), flexible: String(lot.flexibleSpots),
      available: String(lot.availableSpots), freeMinutes: String(lot.freeMinutes), openHours: lot.openHours, lotType: lot.lotType,
      ev: String(lot.evChargers), height: lot.heightLimitM == null ? "" : String(lot.heightLimitM), nightOpen: lot.nightOpen,
      reservable: lot.reservable, accessible: String(lot.accessibleSpots), feeNote: lot.feeNote, rules: lot.rules,
      operatorName: lot.operatorName, phone: lot.phone, payment: lot.paymentMethods, source: lot.source, externalId: lot.externalId,
    });
  }

  async function saveLot(event: React.FormEvent) {
    event.preventDefault();
    const yuan = (value: string) => value.trim() === "" ? null : Math.round(Number(value) * 100);
    const payload = {
      name: form.name, city: form.city, district: form.district, address: form.address, lat: Number(form.lat), lng: Number(form.lng),
      hourlyPrice: yuan(form.hourly), firstHourPrice: yuan(form.firstHour), dailyCap: yuan(form.daily), monthlyPrice: yuan(form.monthly),
      allowVisitor: form.visitor, totalSpots: form.total, fixedSpots: form.fixed, flexibleSpots: form.flexible,
      availableSpots: form.available, freeMinutes: Number(form.freeMinutes || 0), openHours: form.openHours, lotType: form.lotType,
      evChargers: Number(form.ev || 0), heightLimitM: form.height, nightOpen: form.nightOpen, reservable: form.reservable,
      accessibleSpots: Number(form.accessible || 0), feeNote: form.feeNote, rules: form.rules, operatorName: form.operatorName,
      phone: form.phone, paymentMethods: form.payment, source: form.source || "manual", externalId: form.externalId,
    };
    if (editing) await api(`/api/admin/lots/${editing}`, { method: "PATCH", body: JSON.stringify(payload) });
    else await api("/api/admin/lots", { method: "POST", body: JSON.stringify(payload) });
    setForm(empty);
    setEditing(null);
    setMessage("停车场已保存");
    await reload();
  }

  async function remove(id: string) {
    if (!window.confirm("从平台拿掉这个停车场？")) return;
    await api(`/api/admin/lots/${id}`, { method: "DELETE" });
    await reload();
  }

  async function review(id: string, action: "approve" | "reject") {
    const note = action === "reject" ? window.prompt("驳回原因", "") || "" : "";
    await api(`/api/admin/reports/${id}`, { method: "POST", body: JSON.stringify({ action, note }) });
    setMessage(action === "approve" ? "已收录，并给上报人记了积分" : "已驳回");
    await reload();
  }

  if (me === undefined) return <div className="page">正在核对管理员身份…</div>;
  if (!me?.isAdmin) return <div className="page">这里只有管理员能进。</div>;

  return (
    <div className="page">
      <p className="eyebrow">Back office</p>
      <h2 style={{ fontSize: 40 }}>停车场数据后台</h2>
      <p className="muted">地图接口拿不到收费和余位时，就在这里人工维护。车场系统以后用 externalId 回传可用车位。</p>
      {message ? <div className="alert alert-ok">{message}</div> : null}
      <div className="tabs">
        {(["overview", "lots", "reports", "ads"] as const).map((item) => (
          <button key={item} className={`chip ${tab === item ? "on" : ""}`} type="button" onClick={() => setTab(item)}>
            {item === "overview" ? "概览" : item === "lots" ? "停车场" : item === "reports" ? `审核 ${reports.length}` : "广告"}
          </button>
        ))}
      </div>
      {tab === "overview" && overview ? (
        <div className="stat-row">
          <div className="stat"><b>{overview.users}</b><span>用户</span></div>
          <div className="stat"><b>{overview.lots}</b><span>停车场</span></div>
          <div className="stat"><b>{overview.spots}</b><span>共享车位</span></div>
          <div className="stat"><b>{overview.bookings}</b><span>有效订单</span></div>
          <div className="stat"><b>{formatYuan(overview.feeCents)}</b><span>已记服务费</span></div>
          <div className="stat"><b>{formatYuan(overview.subsidyCents)}</b><span>积分补贴</span></div>
          <div className="stat"><b>{overview.production ? "生产" : "开发"}</b><span>{overview.trustProxy ? "已信任代理 IP" : "未开启代理 IP"}</span></div>
        </div>
      ) : null}
      {tab === "lots" ? (
        <div className="detail-layout">
          <form className="card form-card" onSubmit={saveLot}>
            <b>{editing ? "编辑停车场" : "新建停车场"}</b>
            <label className="field"><span>名称</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <div className="grid-2">
              <label className="field"><span>城市</span><input list="cities" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /><datalist id="cities">{CITIES.map((item) => <option key={item} value={item} />)}</datalist></label>
              <label className="field"><span>区</span><input value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></label>
            </div>
            <label className="field"><span>地址</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            <div className="grid-2">
              <label className="field"><span>纬度</span><input value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} /></label>
              <label className="field"><span>经度</span><input value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} /></label>
              <label className="field"><span>小时价（元）</span><input value={form.hourly} onChange={(event) => setForm({ ...form, hourly: event.target.value })} /></label>
              <label className="field"><span>首小时（元）</span><input value={form.firstHour} onChange={(event) => setForm({ ...form, firstHour: event.target.value })} /></label>
              <label className="field"><span>日封顶（元）</span><input value={form.daily} onChange={(event) => setForm({ ...form, daily: event.target.value })} /></label>
              <label className="field"><span>月租参考（元）</span><input value={form.monthly} onChange={(event) => setForm({ ...form, monthly: event.target.value })} /></label>
              <label className="field"><span>总车位</span><input value={form.total} onChange={(event) => setForm({ ...form, total: event.target.value })} /></label>
              <label className="field"><span>固定车位</span><input value={form.fixed} onChange={(event) => setForm({ ...form, fixed: event.target.value })} /></label>
              <label className="field"><span>临停车位</span><input value={form.flexible} onChange={(event) => setForm({ ...form, flexible: event.target.value })} /></label>
              <label className="field"><span>可用车位</span><input value={form.available} onChange={(event) => setForm({ ...form, available: event.target.value })} /></label>
            </div>
            <label className="field"><span>外来车辆</span>
              <select value={form.visitor} onChange={(event) => setForm({ ...form, visitor: event.target.value })}>
                <option value="yes">可进</option><option value="permit">需登记</option><option value="no">不可进</option><option value="unknown">未知</option>
              </select>
            </label>
            <label className="field"><span>收费说明</span><textarea value={form.feeNote} onChange={(event) => setForm({ ...form, feeNote: event.target.value })} /></label>
            <label className="field"><span>停放规则</span><textarea value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} /></label>
            <div className="grid-2">
              <label className="field"><span>管理方</span><input value={form.operatorName} onChange={(event) => setForm({ ...form, operatorName: event.target.value })} /></label>
              <label className="field"><span>电话</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label className="field"><span>支付方式</span><input value={form.payment} onChange={(event) => setForm({ ...form, payment: event.target.value })} /></label>
              <label className="field"><span>限高（米）</span><input value={form.height} onChange={(event) => setForm({ ...form, height: event.target.value })} /></label>
              <label className="field"><span>免费分钟</span><input value={form.freeMinutes} onChange={(event) => setForm({ ...form, freeMinutes: event.target.value })} /></label>
              <label className="field"><span>无障碍车位</span><input value={form.accessible} onChange={(event) => setForm({ ...form, accessible: event.target.value })} /></label>
              <label className="field"><span>营业时间</span><input value={form.openHours} onChange={(event) => setForm({ ...form, openHours: event.target.value })} /></label>
              <label className="field"><span>充电桩</span><input value={form.ev} onChange={(event) => setForm({ ...form, ev: event.target.value })} /></label>
            </div>
            <div className="grid-2">
              <label className="field"><span>来源</span><input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} /></label>
              <label className="field"><span>外部编号</span><input value={form.externalId} onChange={(event) => setForm({ ...form, externalId: event.target.value })} /></label>
            </div>
            <label className="row"><input type="checkbox" checked={form.nightOpen} onChange={(event) => setForm({ ...form, nightOpen: event.target.checked })} /> 夜间开放</label>
            <label className="row"><input type="checkbox" checked={form.reservable} onChange={(event) => setForm({ ...form, reservable: event.target.checked })} /> 可预约</label>
            <div className="chips">
              <button className="btn btn-ink" type="submit">{editing ? "保存修改" : "收录"}</button>
              {editing ? <button className="btn btn-ghost" type="button" onClick={() => { setEditing(null); setForm(empty); }}>取消编辑</button> : null}
            </div>
          </form>
          <div className="list">
            {lots.map((lot) => (
              <article key={lot.id} className="card" style={{ padding: 12 }}>
                <div className="spread"><b>{lot.name}</b><span className="muted">{lot.city}</span></div>
                <p className="muted">{lot.address} · 可用 {lot.availableSpots}/{lot.totalSpots} · {formatYuan(lot.hourlyPrice)}/小时</p>
                <div className="chips">
                  <button className="btn btn-ghost" type="button" onClick={() => edit(lot)}>编辑</button>
                  <button className="btn btn-ghost" type="button" onClick={() => remove(lot.id)}>删除</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "reports" ? (
        <div className="list">
          {reports.map((report) => {
            const payload = JSON.parse(report.payload) as { name?: string; address?: string; feeNote?: string; allowVisitor?: string };
            return (
              <article key={report.id} className="card" style={{ padding: 16 }}>
                <b>{payload.name}</b>
                <p className="muted">{report.user.name} · {payload.address} · 外来车 {payload.allowVisitor}</p>
                <p>{payload.feeNote}</p>
                <div className="chips">
                  <button className="btn btn-lime" type="button" onClick={() => review(report.id, "approve")}>通过并记积分</button>
                  <button className="btn btn-ghost" type="button" onClick={() => review(report.id, "reject")}>驳回</button>
                </div>
              </article>
            );
          })}
          {reports.length === 0 ? <div className="card empty">没有待审上报。</div> : null}
        </div>
      ) : null}
      {tab === "ads" ? (
        <div className="list">
          {ads.map((ad) => (
            <article key={ad.id} className="card spread" style={{ padding: 16 }}>
              <div><b>{ad.title}</b><div className="muted">{ad.subtitle}</div></div>
              <button className="btn btn-ghost" type="button" onClick={async () => { await api("/api/admin/ads", { method: "PATCH", body: JSON.stringify({ id: ad.id, active: !ad.active }) }); await reload(); }}>
                {ad.active ? "下线" : "上线"}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
