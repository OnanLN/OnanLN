import { GuideCatalog } from "@/components/GuideCatalog";
import { isDemoMode } from "@/lib/config";
import { listGuides } from "@/lib/guides";

export const dynamic = "force-dynamic";

export const metadata = { title: "攻略" };

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>;
}) {
  const params = await searchParams;
  return (
    <GuideCatalog
      guides={listGuides()}
      initialQuery={params.q ?? ""}
      initialRegion={params.region ?? ""}
      demo={isDemoMode()}
    />
  );
}
