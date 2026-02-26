import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId, getSummonerByPuuid } from "@/lib/riot";
import { indexSummonerFromProfile } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Manually index a summoner into the search table.
 * Call this when a user searches - index them so they appear in future searches.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gameName = body.gameName as string | undefined;
    const tagLine = body.tagLine as string | undefined;
    const region = (body.region as string) ?? "la1";

    if (!gameName?.trim() || !tagLine?.trim()) {
      return NextResponse.json(
        { error: "gameName and tagLine are required" },
        { status: 400 }
      );
    }

    const account = await getAccountByRiotId(gameName.trim(), tagLine.trim(), region);
    const summoner = await getSummonerByPuuid(account.puuid, region);
    const riotIdFull = `${account.gameName}#${account.tagLine}`;

    await indexSummonerFromProfile(
      account.puuid,
      region,
      riotIdFull,
      summoner.profileIconId
    );

    return NextResponse.json({ ok: true, riot_id: riotIdFull });
  } catch (err) {
    console.error("Search index error:", err);
    return NextResponse.json(
      { error: "Failed to index summoner" },
      { status: 500 }
    );
  }
}
