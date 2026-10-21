"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/request";

export function LoginForm({ nextPath, demo }: { nextPath: string; demo: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"code" | "enter" | null>(null);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfter((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter > 0]);

  async function sendCode() {
    setError("");
    setDemoCode("");
    setPending("code");
    try {
      const data = (await sendJson("/api/auth/send-code", "POST", { phone })) as {
        demoCode?: string;
        retryAfter?: number;
      };
      if (data.demoCode) setDemoCode(data.demoCode);
      setRetryAfter(data.retryAfter ?? 60);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "验证码没有发出");
    } finally {
      setPending(null);
    }
  }

  async function enter(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending("enter");
    try {
      await sendJson("/api/auth/verify", "POST", { phone, code, nickname });
      router.push(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有登录成功");
      setPending(null);
    }
  }

  return (
    <form className="login-card" onSubmit={enter}>
      <h2>手机号登录</h2>
      <p className="help">新号码会自动注册。登录状态保留 30 天，不用每天收一次验证码。</p>
      <label className="field">
        <span>手机号</span>
        <input
          inputMode="tel"
          autoComplete="tel"
          maxLength={11}
          placeholder="11 位大陆手机号"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value.replace(/\D/g, "").slice(0, 11));
            setDemoCode("");
          }}
        />
      </label>
      <button type="button" className="btn btn-ghost" onClick={() => void sendCode()} disabled={pending !== null || retryAfter > 0}>
        {pending === "code" ? "发送中" : retryAfter > 0 ? `${retryAfter} 秒后可重发` : "获取验证码"}
      </button>
      {demoCode ? (
        <p className="demo-code" role="status">
          <span>演示环境不发送短信，验证码是</span>
          <strong>{demoCode}</strong>
        </p>
      ) : null}
      <label className="field">
        <span>验证码</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6 位数字"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </label>
      <label className="field">
        <span>称呼，第一次来时填写</span>
        <input
          maxLength={16}
          placeholder="例如：林夏。老用户会沿用原来的称呼"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-sienna" type="submit" disabled={pending !== null}>
        {pending === "enter" ? "进入中" : "进入途记"}
      </button>
      {demo ? (
        <p className="help">
          正式上线后，国内验证码短信大约几分钱一条。这里没有接入短信网关，所以不会产生费用。也可以用 13800000001 进入已经写过攻略的林夏。
        </p>
      ) : (
        <p className="help">验证码 5 分钟内有效。同一号码 60 秒只能获取一次。</p>
      )}
    </form>
  );
}
