import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";

export const metadata = { title: "登录" };

export default function Page() {
  return <Suspense fallback={<div className="page">正在打开登录…</div>}><AuthPanel mode="login" /></Suspense>;
}
