import { notFound, redirect } from "next/navigation";
import { GuideForm } from "@/components/GuideForm";
import { getCurrentUser } from "@/lib/auth";
import { getGuide, listGuides, listRegions } from "@/lib/guides";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑攻略" };

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/guides/${id}/edit`);
  const guide = Number.isInteger(id) ? getGuide(id) : null;
  if (!guide || guide.authorId !== user.id) notFound();
  const guides = listGuides().map((item) => ({
    id: item.id,
    destination: item.destination,
    title: item.title,
    lat: item.lat,
    lng: item.lng,
    coverTheme: item.coverTheme,
  }));
  return (
    <div className="page-scroll" id="content">
      <GuideForm mode="edit" initial={guide} regions={listRegions()} guides={guides} />
    </div>
  );
}
