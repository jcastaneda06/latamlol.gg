import { NextResponse } from "next/server";
import { aggregateWinratesFromRiot } from "@/lib/champion-winrate";
import { setCachedTierList } from "@/lib/supabase";

const WINRATE_CACHE_KEY = "winrate_aggregate";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 min for aggregation

export async function POST() {
  try {
    const data = await aggregateWinratesFromRiot("la1");
    if (Object.keys(data).length > 0) {
      await setCachedTierList("latest", WINRATE_CACHE_KEY, data);
      return NextResponse.json({
        ok: true,
        champions: Object.keys(data).length,
        message: "Winrates updated. Reload the tier list.",
      });
    }
    return NextResponse.json(
      { ok: false, message: "No winrate data collected. Check RIOT_API_KEY and LA1 challenger leaderboard." },
      { status: 503 }
    );
  } catch (err) {
    console.error("[winrates/refresh]", err);
    return NextResponse.json(
      { ok: false, message: "Failed to aggregate winrates." },
      { status: 500 }
    );
  }
}
