import { Suspense } from "react";
import { ReportForm } from "@/components/report-form";

export const metadata = { title: "上报停车场" };

export default function Page() {
  return (
    <Suspense fallback={<div className="page">正在打开上报表…</div>}>
      <ReportForm />
    </Suspense>
  );
}
