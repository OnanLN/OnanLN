import { matchPlace, suggestPlaces } from "@/lib/places";
import { geocodeLive } from "@/server/maps";
import { json } from "@/server/http";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const query = params.get("q")?.trim() || "";
  const city = params.get("city")?.trim() || "";
  const suggestions = suggestPlaces(query, city || undefined);
  const best = query ? matchPlace(query, city || undefined) : null;
  const live = !best && query ? await geocodeLive(query, city || "上海") : null;
  return json({
    suggestions: suggestions.map((item) => ({ name: item.name, city: item.city, lat: item.lat, lng: item.lng })),
    best: best ? { name: best.name, city: best.city, lat: best.lat, lng: best.lng } : null,
    live,
  });
}
