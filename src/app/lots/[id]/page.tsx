import { LotDetail } from "@/components/lot-detail";

export const metadata = { title: "停车场" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LotDetail id={id} />;
}
