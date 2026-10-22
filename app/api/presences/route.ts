import { NextResponse } from "next/server";
import { listPresences } from "@/lib/presence";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ presences: listPresences() });
}
