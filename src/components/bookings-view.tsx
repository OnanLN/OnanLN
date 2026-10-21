"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useSession } from "@/components/shell";
import { formatYuan } from "@/lib/money";

type Booking = {
  id: string;
  role: "renter" | "owner";
  label: string;
  phaseLabel: string;
  rentCents: number;
  cashCents: number;
  pointsUsed: number;
  platformFeeCents: number;
  ownerPayoutCents: number;
  spot: { id: string; title: string };
  renter: { name: string };
  owner: { name: string };
  conversationId: string | null;
  startLabel: string;
  endLabel: string;
  status: string;
};

export function BookingsView() {
  const { me, refresh } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  function load() {
    api<{ bookings: Booking[] }>("/api/bookings").then((result) => setBookings(result.bookings)).catch((reason: Error) => setError(reason.message));
  }
  useEffect(() => { if (me) load(); }, [me]);

  async function cancel(id: string) {
    setError("");
    try {
      await api(`/api/bookings/${id}/cancel`, { method: "POST" });
      refresh();
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "取消失败");
    }
  }

  if (!me) return <div className="page">请先登录。</div>;
  return (
    <div className="page narrow">
      <p className="eyebrow">Orders</p>
      <h2 style={{ fontSize: 40, marginBottom: 12 }}>我租的，和我出租的。</h2>
      {error ? <div className="alert alert-bad">{error}</div> : null}
      <div className="list">
        {bookings.map((item) => (
          <article key={item.id} className="card" style={{ padding: 16 }}>
            <div className="spread">
              <b>{item.role === "renter" ? "我租下" : "我出租"} · {item.spot.title}</b>
              <span className="tag">{item.phaseLabel}</span>
            </div>
            <p className="muted">{item.label} · {item.startLabel} 到 {item.endLabel}</p>
            <p>{item.role === "renter" ? `付给 ${item.owner.name}` : `租客 ${item.renter.name}`} · 租金 {formatYuan(item.rentCents)} · 现金 {formatYuan(item.cashCents)} · 积分 {item.pointsUsed}</p>
            <p className="muted">服务费 {formatYuan(item.platformFeeCents)} · 车主入账 {formatYuan(item.ownerPayoutCents)}</p>
            <div className="chips">
              <Link className="btn btn-ghost" href={`/market/${item.spot.id}`}>看车位</Link>
              {item.conversationId ? <Link className="btn btn-ghost" href={`/messages/${item.conversationId}`}>对话</Link> : null}
              {item.status === "confirmed" && item.phaseLabel === "未开始" ? <button className="btn btn-coral" type="button" onClick={() => cancel(item.id)}>取消</button> : null}
            </div>
          </article>
        ))}
        {bookings.length === 0 ? <div className="card empty">还没有订单。</div> : null}
      </div>
    </div>
  );
}
