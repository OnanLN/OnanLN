import { FEE_RATE, POINT_CENTS, REPORT_POINTS, WELCOME_POINTS } from "@/lib/constants";
import { enabledProviders } from "@/server/maps";
import { json } from "@/server/http";

export async function GET() {
  const dev = process.env.NODE_ENV !== "production";
  const providers = enabledProviders();
  return json({
    feeRate: FEE_RATE,
    pointCents: POINT_CENTS,
    welcomePoints: WELCOME_POINTS,
    reportPoints: REPORT_POINTS,
    devTools: dev,
    mapConfigured: providers.length > 0,
    mapProvider: providers[0] || null,
    trustProxy: process.env.TRUST_PROXY === "true",
    demoAccounts: dev
      ? [
          { role: "车主林可", email: "lin@weixiang.app", password: "Weixiang#2026" },
          { role: "租客周屿", email: "zhou@weixiang.app", password: "Weixiang#2026" },
          { role: "管理员", email: "admin@weixiang.app", password: "Weixiang#2026" },
        ]
      : [],
  });
}
