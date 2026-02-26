import { NextRequest, NextResponse } from "next/server";
import { searchSummoners } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const region = req.nextUrl.searchParams.get("region") ?? "la1";
    const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "15", 10);
    const limit = Math.min(isNaN(limitParam) ? 15 : limitParam, 25);

    const results = await searchSummoners(region, q, limit);

    return NextResponse.json(results, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("Summoner search error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
