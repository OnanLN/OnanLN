"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/request";
import type { PublicUser } from "@/lib/types";

export function ProfileEditor({ user }: { user: PublicUser }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(user.nickname);
  const [bio, setBio] = useState(user.bio);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);
    try {
      await sendJson("/api/me", "PATCH", { nickname, bio });
      setSaved(true);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "没有保存");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <label className="field">
        <span>称呼</span>
        <input value={nickname} maxLength={16} onChange={(event) => setNickname(event.target.value)} />
      </label>
      <label className="field">
        <span>简介</span>
        <textarea value={bio} maxLength={80} rows={3} onChange={(event) => setBio(event.target.value)} />
        <em className="counter">{bio.trim().length}/80</em>
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="composer-bar">
        <button className="btn btn-small" type="submit" disabled={pending}>
          {pending ? "保存中" : "保存资料"}
        </button>
        {saved ? <span className="help">已保存</span> : null}
      </div>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      退出登录
    </button>
  );
}
