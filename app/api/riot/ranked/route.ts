import { NextRequest, NextResponse } from "next/server";
import { getChallengerLeaderboard, getGrandmasterLeaderboard, getMasterLeaderboard } from "@/lib/riot";
import type { LeagueListDTO, LeagueItemDTO } from "@/types/riot";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = searchParams.get("region") ?? "la1";
  const queue = searchParams.get("queue") ?? "RANKED_SOLO_5x5";

  try {
    const [challenger, grandmaster, master] = await Promise.allSettled([
      getChallengerLeaderboard(region, queue),
      getGrandmasterLeaderboard(region, queue),
      getMasterLeaderboard(region, queue),
    ]);

    const toEntries = (result: PromiseSettledResult<unknown>, tier: string) => {
      if (result.status !== "fulfilled") return [];
      const list = result.value as LeagueListDTO;
      return (list.entries ?? []).map(e => ({ ...e, tier }));
    };

    const combined = [
      ...toEntries(challenger, "CHALLENGER"),
      ...toEntries(grandmaster, "GRANDMASTER"),
      ...toEntries(master, "MASTER"),
    ].sort((a, b) => {
      const tierOrder: Record<string, number> = { CHALLENGER: 0, GRANDMASTER: 1, MASTER: 2 };
      const tierDiff = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      return (b as LeagueItemDTO).leaguePoints - (a as LeagueItemDTO).leaguePoints;
    });

    return NextResponse.json(
      combined.slice(0, 200),
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=60" } }
    );
  } catch (err) {
    console.error("Ranked error:", err);
    return NextResponse.json({ error: "Error al obtener clasificación" }, { status: 500 });
  }
}
