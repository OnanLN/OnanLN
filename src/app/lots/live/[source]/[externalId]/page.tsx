import { LiveLotDetail } from "@/components/live-lot-detail";

export const metadata = { title: "地图上的停车场" };

export default async function Page({ params }: { params: Promise<{ source: string; externalId: string }> }) {
  const { source, externalId } = await params;
  return <LiveLotDetail source={source} externalId={externalId} />;
}
