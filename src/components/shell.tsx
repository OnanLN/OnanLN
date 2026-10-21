"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  points: number;
  isAdmin: boolean;
  bio: string;
};

type SessionValue = {
  me: SessionUser | null | undefined;
  ip: string;
  ipError: string;
  refresh: () => void;
};

const SessionContext = createContext<SessionValue>({
  me: undefined,
  ip: "",
  ipError: "",
  refresh: () => undefined,
});

export function useSession() {
  return useContext(SessionContext);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<SessionUser | null | undefined>(undefined);
  const [ip, setIp] = useState("");
  const [ipError, setIpError] = useState("");

  function refresh() {
    api<{ user: SessionUser | null; ip: string }>("/api/me")
      .then((data) => {
        setMe(data.user);
        setIp(data.ip);
        setIpError("");
      })
      .catch((error: unknown) => {
        setMe(null);
        if (error instanceof ApiError && error.code === "SESSION_IP") setIpError(error.message);
      });
  }

  useEffect(() => {
    refresh();
    window.addEventListener("wx-auth", refresh);
    return () => window.removeEventListener("wx-auth", refresh);
  }, []);

  const item = (href: string, label: string, extra = "") => {
    const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link className={`${on ? "on" : ""} ${extra}`} href={href}>
        {label}
      </Link>
    );
  };

  return (
    <SessionContext.Provider value={{ me, ip, ipError, refresh }}>
      <div className="app">
        <a className="sr" href="#content">跳到内容</a>
        <header className="header">
          <Link href="/" className="logo" aria-label="位享首页">
            <span className="mark">位</span>
            位享
          </Link>
          <nav className="desktop-nav">
            {item("/", "找车位")}
            {item("/market", "共享市场")}
            {item("/report", "上报")}
            {item("/rules", "规则")}
          </nav>
          <div className="header-spacer" />
          {me ? (
            <Link href="/me" className="points-pill">
              <b>{me.points}</b> 积分
            </Link>
          ) : (
            <Link href="/login" className="ghost-pill login-desktop">登录</Link>
          )}
        </header>
        {ipError ? (
          <div className="page" style={{ paddingBottom: 0 }}>
            <div className="alert alert-bad">
              {ipError} <Link href="/login">去验证邮箱并换到这个网络</Link>
            </div>
          </div>
        ) : null}
        <main id="content">{children}</main>
        <nav className="tabbar" aria-label="主导航">
          {item("/", "找位")}
          {item("/market", "市场")}
          {item("/publish", "发布", "plus")}
          {item("/messages", "消息")}
          {item("/me", "我的")}
        </nav>
      </div>
    </SessionContext.Provider>
  );
}
