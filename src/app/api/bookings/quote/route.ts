import { getSession } from "@/server/auth";
import { quoteForUser, readBookingBody } from "@/server/booking-service";
import { fail, json, readJson } from "@/server/http";

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session.ok && session.reason === "ip") {
    return fail("这个登录绑在另一个网络地址上。", 401, "SESSION_IP");
  }
  const result = await quoteForUser(readBookingBody(await readJson(req)), session.ok ? session.user.id : null);
  return json(result.payload, result.status);
}
