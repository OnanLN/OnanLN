"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyAuth, api, ApiError } from "@/lib/client";
import { useSession } from "@/components/shell";

type Mode = "login" | "register" | "forgot";
type Meta = { devTools: boolean; demoAccounts: { role: string; email: string; password: string }[] };

export function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || (mode === "login" ? "/" : "/me");
  const { refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [releaseCode, setReleaseCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [bound, setBound] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [simIp, setSimIp] = useState("");

  useEffect(() => {
    api<Meta>("/api/meta").then(setMeta).catch(() => setMeta(null));
    setSimIp(sessionStorage.getItem("wx-dev-ip") || "");
  }, []);

  function rememberIp(value: string) {
    setSimIp(value);
    if (value.trim()) sessionStorage.setItem("wx-dev-ip", value.trim());
    else sessionStorage.removeItem("wx-dev-ip");
  }

  async function send(purpose: "register" | "reset" | "release") {
    setError("");
    const result = await api<{ devCode: string | null; delivered: boolean }>("/api/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email, purpose }),
    });
    setDevCode(result.devCode);
    setInfo(result.delivered ? "验证码已发到邮箱。" : "开发环境没有配邮件，验证码显示在下面。");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, name, code }) });
      } else if (mode === "forgot") {
        await api("/api/auth/reset", { method: "POST", body: JSON.stringify({ email, password, code }) });
      } else {
        await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, releaseCode: releaseCode || undefined }) });
      }
      notifyAuth();
      refresh();
      router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "IP_BOUND") setBound(true);
      setError(reason instanceof Error ? reason.message : "没有完成");
    }
  }

  const title = mode === "register" ? "用邮箱领一把钥匙。" : mode === "forgot" ? "把密码换成新的。" : "回到你的车位。";
  const lead = mode === "login"
    ? "同一账号同一时间只绑定一个网络地址。同一台电脑开几个窗口，没问题。"
    : "验证码 10 分钟内有效。注册成功会送 200 积分，10 积分可以抵 1 元租金。";

  return (
    <div className="auth-layout">
      <section className="auth-copy">
        <p className="eyebrow">Account</p>
        <h1>{title}</h1>
        <p className="lede">{lead}</p>
      </section>
      <form className="card form-card" onSubmit={submit}>
        <label className="field"><span>邮箱</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {mode === "register" ? <label className="field"><span>怎么称呼你</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label> : null}
        {mode !== "login" ? (
          <div className="search-row">
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="6 位验证码" inputMode="numeric" aria-label="验证码" />
            <button className="btn btn-ghost" type="button" onClick={() => send(mode === "register" ? "register" : "reset")}>发送验证码</button>
          </div>
        ) : null}
        <label className="field"><span>{mode === "forgot" ? "新密码" : "密码"}</span><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mode === "login" && bound ? (
          <div className="stack">
            <div className="alert">这个账号还绑在另一个网络上。发送验证码后，就能改到当前网络登录。</div>
            <div className="search-row">
              <input value={releaseCode} onChange={(event) => setReleaseCode(event.target.value)} placeholder="解除绑定验证码" aria-label="解除绑定验证码" />
              <button className="btn btn-ghost" type="button" onClick={() => send("release")}>发送验证码</button>
            </div>
          </div>
        ) : null}
        {meta?.devTools ? (
          <label className="field"><span>开发调试：模拟网络地址，留空就是本机</span><input value={simIp} onChange={(event) => rememberIp(event.target.value)} placeholder="例如 1.1.1.1" /></label>
        ) : null}
        {devCode ? <div className="alert alert-ok">开发环境验证码 <b className="dev-note">{devCode}</b></div> : null}
        {info ? <div className="alert">{info}</div> : null}
        {error ? <div className="alert alert-bad">{error}</div> : null}
        <button className="btn btn-ink" type="submit">{mode === "register" ? "注册并登录" : mode === "forgot" ? "重置并登录" : "登录"}</button>
        <p className="muted">
          {mode !== "login" ? <a href="/login">已有账号，去登录</a> : <a href="/register">注册</a>}
          {" · "}
          {mode !== "forgot" ? <a href="/forgot">忘记密码</a> : null}
        </p>
        {meta?.demoAccounts?.length ? (
          <div className="stack">
            <span className="muted">演示账号，生产环境不会出现在这里。</span>
            {meta.demoAccounts.map((account) => (
              <button
                key={account.email}
                className="choice"
                type="button"
                onClick={() => { setEmail(account.email); setPassword(account.password); }}
              >
                {account.role} · {account.email}
              </button>
            ))}
          </div>
        ) : null}
      </form>
    </div>
  );
}
