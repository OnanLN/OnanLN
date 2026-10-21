"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useSession } from "@/components/shell";
import { formatSh } from "@/lib/time";

type Conversation = {
  id: string;
  spotTitle: string;
  other: { name: string } | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  bookingId: string | null;
};

export function MessagesView() {
  const { me } = useSession();
  const [items, setItems] = useState<Conversation[] | null>(null);
  useEffect(() => {
    if (!me) return;
    api<{ conversations: Conversation[] }>("/api/conversations").then((result) => setItems(result.conversations)).catch(() => setItems([]));
  }, [me]);
  if (me === undefined) return <div className="page">正在打开信箱…</div>;
  if (!me) return <div className="page narrow"><div className="card form-card"><h2>登录后才能看对话。</h2><a className="btn btn-ink" href="/login?next=/messages">去登录</a></div></div>;
  return (
    <div className="page narrow">
      <p className="eyebrow">Inbox</p>
      <h2 style={{ fontSize: 40, marginBottom: 14 }}>跟房东或租客说话。</h2>
      <div className="list">
        {(items || []).map((item) => (
          <Link key={item.id} href={`/messages/${item.id}`} className="card lot-card">
            <div className="spread"><b>{item.other?.name || "对方"}</b><span className="muted">{item.bookingId ? "订单对话" : "咨询"}</span></div>
            <span>{item.spotTitle}</span>
            <span className="muted">{item.lastMessage ? `${item.lastMessage.body} · ${formatSh(new Date(item.lastMessage.createdAt))}` : "还没有消息"}</span>
          </Link>
        ))}
        {items && items.length === 0 ? <div className="card empty">还没有对话。在车位页点「咨询房东」，或者锁定一个时段后会自动开一条。</div> : null}
      </div>
    </div>
  );
}
