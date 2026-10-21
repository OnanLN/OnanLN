import { liveLotDetail } from "@/server/maps";
import { fail, json } from "@/server/http";

export async function GET(_req: Request, ctx: { params: Promise<{ source: string; externalId: string }> }) {
  const { source, externalId } = await ctx.params;
  const lot = await liveLotDetail(source, decodeURIComponent(externalId));
  if (!lot) return fail("地图上的这条记录暂时取不到，可以改用手动上报", 404);
  return json({ lot });
}
