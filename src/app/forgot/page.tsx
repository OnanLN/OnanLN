import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";

export const metadata = { title: "重置密码" };

export default function Page() {
  return <Suspense fallback={<div className="page">正在打开重置…</div>}><AuthPanel mode="forgot" /></Suspense>;
}
