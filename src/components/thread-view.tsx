"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { useSession } from "@/components/shell";
import { formatSh } from "@/lib/time";

type Message = { id: string; body: string; senderName: string; createdAt: string; mine: boolean };

export function ThreadView({ id }: { id: string }) {
  const { me } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!me) return;
    let stop = false;
    let timer = 0;
    const tick = async () => {
      if (stop) return;
      try {
        const result = await api<{ messages: Message[] }>(`/api/conversations/${id}/messages`);
        if (!stop) setMessages(result.messages);
      } catch (reason) {
        if (!stop) setError(reason instanceof Error ? reason.message : "对话打不开");
        return;
      }
      if (!stop) timer = window.setTimeout(tick, 4000);
    };
    void tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [id, me]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    const body = text;
    setText("");
    try {
      const result = await api<{ message: Message }>(`/api/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
      setMessages((items) => [...items, result.message]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没发出去");
    }
  }

  if (!me) return <div className="page">请先登录。</div>;
  return (
    <div className="page narrow">
      <p className="eyebrow">Chat</p>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>这段对话</h2>
      {error ? <div className="alert alert-bad">{error}</div> : null}
      <div className="card" style={{ padding: 14 }}>
        <div className="bubble-list">
          {messages.length === 0 ? <p className="muted">跟对方打个招呼，确认怎么进场。</p> : null}
          {messages.map((message) => (
            <div key={message.id} className={`bubble ${message.mine ? "mine" : ""}`}>
              <b>{message.mine ? "我" : message.senderName}</b>
              <div>{message.body}</div>
              <time>{formatSh(new Date(message.createdAt))}</time>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form className="search-row" onSubmit={send} style={{ marginTop: 12 }}>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="写一句" aria-label="消息" />
          <button className="btn btn-ink" type="submit">发送</button>
        </form>
      </div>
    </div>
  );
}
