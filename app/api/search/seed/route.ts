import { NextRequest, NextResponse } from "next/server";
import { getChallengerLeaderboard } from "@/lib/riot";
import { getSummonerById, getAccountByPuuid } from "@/lib/riot";
import { indexSummonerFromProfile } from "@/lib/supabase";
import type { LeagueListDTO } from "@/types/riot";

export const runtime = "nodejs";

/**
 * Seed the summoner_search table with Challenger leaderboard players.
 * Call once to populate initial search suggestions: POST /api/search/seed?region=la1
 */
export async function POST(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get("region") ?? "la1";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "15", 10), 25);

    const league = (await getChallengerLeaderboard(region)) as LeagueListDTO;
    const entries = league?.entries ?? [];
    const toProcess = entries.slice(0, limit);

    let indexed = 0;
    for (const entry of toProcess) {
      try {
        const summoner = await getSummonerById(entry.summonerId, region);
        const account = await getAccountByPuuid(summoner.puuid, region);
        const riotId = `${account.gameName}#${account.tagLine}`;

        await indexSummonerFromProfile(
          summoner.puuid,
          region,
          riotId,
          summoner.profileIconId
        );
        indexed++;
        await new Promise(r => setTimeout(r, 100));
      } catch {
        // Skip failed entries
      }
    }

    return NextResponse.json({
      ok: true,
      indexed,
      region,
      message: `${indexed} invocadores indexados desde Challenger`,
    });
  } catch (err) {
    console.error("Search seed error:", err);
    return NextResponse.json(
      { error: "Error al poblar el índice" },
      { status: 500 }
    );
  }
}
