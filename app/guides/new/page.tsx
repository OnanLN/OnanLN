import { redirect } from "next/navigation";
import { GuideForm } from "@/components/GuideForm";
import { getCurrentUser } from "@/lib/auth";
import { listGuides, listRegions } from "@/lib/guides";

export const dynamic = "force-dynamic";
export const metadata = { title: "写攻略" };

export default async function NewGuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/guides/new");
  const guides = listGuides().map((guide) => ({
    id: guide.id,
    destination: guide.destination,
    title: guide.title,
    lat: guide.lat,
    lng: guide.lng,
    coverTheme: guide.coverTheme,
  }));
  return (
    <div className="page-scroll" id="content">
      <GuideForm mode="create" regions={listRegions()} guides={guides} />
    </div>
  );
}
