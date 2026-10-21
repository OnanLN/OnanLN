import { requireAdmin } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const ads = await prisma.adBanner.findMany({ orderBy: { title: "asc" } });
  return json({ ads });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 2) return fail("广告标题至少 2 个字");
  const ad = await prisma.adBanner.create({
    data: {
      title: title.slice(0, 40),
      subtitle: typeof body.subtitle === "string" ? body.subtitle.trim().slice(0, 80) : "",
      href: typeof body.href === "string" && body.href.startsWith("/") ? body.href : "/market",
      active: body.active !== false,
      placement: "home",
    },
  });
  return json({ ad });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const body = await readJson(req);
  if (typeof body.id !== "string") return fail("缺少广告编号");
  const ad = await prisma.adBanner.update({
    where: { id: body.id },
    data: { active: Boolean(body.active) },
  }).catch(() => null);
  if (!ad) return fail("没有找到这条广告", 404);
  return json({ ad });
}
