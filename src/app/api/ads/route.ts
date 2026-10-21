import { json } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const placement = new URL(req.url).searchParams.get("placement") || "home";
  const ads = await prisma.adBanner.findMany({ where: { active: true, placement }, orderBy: { title: "asc" } });
  return json({ ads });
}
