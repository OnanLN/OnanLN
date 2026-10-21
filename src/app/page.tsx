import { Suspense } from "react";
import { HomeView } from "@/components/home-view";

export default function Page() {
  return (
    <Suspense fallback={<div className="page">正在打开地图…</div>}>
      <HomeView />
    </Suspense>
  );
}
