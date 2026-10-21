import { PublishForm } from "@/components/publish-form";

export const metadata = { title: "编辑车位" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublishForm spotId={id} />;
}
