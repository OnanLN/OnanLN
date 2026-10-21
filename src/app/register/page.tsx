import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";

export const metadata = { title: "注册" };

export default function Page() {
  return <Suspense fallback={<div className="page">正在打开注册…</div>}><AuthPanel mode="register" /></Suspense>;
}
