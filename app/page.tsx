import { Explorer } from "@/components/Explorer";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { listGuides } from "@/lib/guides";
import { listPresences } from "@/lib/presence";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  return (
    <Explorer
      guides={listGuides()}
      presences={listPresences()}
      initialQuery={params.q ?? ""}
      initialRegion={params.region ?? ""}
      currentUser={user ? { id: user.id, nickname: user.nickname } : null}
      demo={isDemoMode()}
    />
  );
}
