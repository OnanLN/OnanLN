import { ThreadView } from "@/components/thread-view";

export const metadata = { title: "对话" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadView id={id} />;
}
