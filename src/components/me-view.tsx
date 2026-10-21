"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notifyAuth, api } from "@/lib/client";
import { useSession } from "@/components/shell";
import { formatYuan } from "@/lib/money";
import { formatSh } from "@/lib/time";
import { MODE_LABEL } from "@/lib/labels";

type Entry = { id: string; delta: number; reason: string; createdAt: string };
type Spot = { id: string; title: string; city: string; status: string; community: string; listings: { mode: string; priceCents: number }[] };
type Report = { id: string; status: string; pointsAwarded: number; reviewNote: string; createdAt: string; payload: string };

export function MeView() {
  const { me, ip, refresh } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [simIp, setSimIp] = useState("");
  const [dev, setDev] = useState(false);

  useEffect(() => {
    if (!me) return;
    setName(me.name);
    setBio(me.bio || "");
    api<{ entries: Entry[]; spots: Spot[] }>("/api/me/ledger").then((result) => {
      setEntries(result.entries);
      setSpots(result.spots);
    }).catch(() => undefined);
    api<{ reports: Report[] }>("/api/reports").then((result) => setReports(result.reports)).catch(() => undefined);
    api<{ devTools: boolean }>("/api/meta").then((result) => {
      setDev(result.devTools);
      setSimIp(sessionStorage.getItem("wx-dev-ip") || "");
    }).catch(() => undefined);
  }, [me]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/me", { method: "PATCH", body: JSON.stringify({ name, bio }) });
    refresh();
  }

  async function logout(all = false) {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({ all }) });
    notifyAuth();
    refresh();
  }

  if (me === undefined) return <div className="page">正在打开账户…</div>;
  if (!me) return <div className="page narrow"><div className="card form-card"><h2>登录后，找车位、出租和租用是同一个人。</h2><a className="btn btn-ink" href="/login?next=/me">去登录</a></div></div>;

  return (
    <div className="page">
      <p className="eyebrow">You · {me.email}</p>
      <div className="section-title">
        <h2>{me.name}</h2>
        <div className="chips">
          <Link className="btn btn-ghost" href="/me/bookings">订单</Link>
          <Link className="btn btn-lime" href="/publish">发布车位</Link>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat"><b>{me.points}</b><span>可用积分</span></div>
        <div className="stat"><b>{spots.length}</b><span>我发布的车位</span></div>
        <div className="stat"><b>{ip || "local"}</b><span>当前登录网络</span></div>
      </div>
      <div className="detail-layout" style={{ marginTop: 16 }}>
        <div className="stack">
          <form className="card form-card" onSubmit={save}>
            <label className="field"><span>名字</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field"><span>一句话</span><input value={bio} onChange={(event) => setBio(event.target.value)} /></label>
            <button className="btn btn-ink" type="submit">保存资料</button>
          </form>
          <div className="card" style={{ padding: 16 }}>
            <b>我的车位</b>
            <div className="list" style={{ marginTop: 10 }}>
              {spots.map((spot) => (
                <Link key={spot.id} href={`/publish/${spot.id}`} className="choice">
                  <div className="spread"><strong>{spot.title}</strong><span>{spot.status === "active" ? "在租" : "暂停"}</span></div>
                  <span className="muted">{spot.city} {spot.community} · {spot.listings.map((item) => `${MODE_LABEL[item.mode]} ${formatYuan(item.priceCents)}`).join(" / ") || "没有在售方案"}</span>
                </Link>
              ))}
              {spots.length === 0 ? <p className="muted">还没有发布。空着的固定车位可以从白天和夜间两档开始。</p> : null}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <b>积分流水</b>
            {entries.map((entry) => (
              <div key={entry.id} className="spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <span>{entry.reason}<br /><span className="muted">{formatSh(new Date(entry.createdAt))}</span></span>
                <b>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="card" style={{ padding: 16 }}>
            <b>上报记录</b>
            {reports.map((report) => {
              const payload = JSON.parse(report.payload) as { name?: string };
              return <p key={report.id}>{payload.name || "资料"} · {report.status === "pending" ? "审核中" : report.status === "approved" ? `已收录 +${report.pointsAwarded}` : `未通过 ${report.reviewNote}`}</p>;
            })}
            {reports.length === 0 ? <p className="muted">上报停车场并通过审核，可以拿到积分。</p> : null}
            <Link className="btn btn-ghost" href="/report">去上报</Link>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <b>登录网络</b>
            <p className="muted">这个账号现在绑在 {ip || "local"}。同一地址的多个窗口共用这次登录。换到别的网络需要先退出，或在登录页用邮箱验证码改绑。</p>
            <div className="chips">
              <button className="btn btn-ghost" type="button" onClick={() => logout(false)}>退出这个窗口</button>
              <button className="btn btn-coral" type="button" onClick={() => logout(true)}>退出所有窗口</button>
            </div>
            {dev ? (
              <label className="field" style={{ marginTop: 12 }}>
                <span>开发调试：模拟网络地址</span>
                <input value={simIp} onChange={(event) => { setSimIp(event.target.value); if (event.target.value.trim()) sessionStorage.setItem("wx-dev-ip", event.target.value.trim()); else sessionStorage.removeItem("wx-dev-ip"); }} />
              </label>
            ) : null}
          </div>
          {me.isAdmin ? <Link className="btn btn-lime" href="/admin">打开数据后台</Link> : null}
        </div>
      </div>
    </div>
  );
}
