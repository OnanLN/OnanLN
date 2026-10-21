import { searchLots } from "@/server/search";
import { json } from "@/server/http";

export async function GET(req: Request) {
  const result = await searchLots(new URL(req.url).searchParams);
  return json(result);
}
