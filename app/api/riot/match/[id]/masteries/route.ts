import { NextRequest, NextResponse } from "next/server";
import { getMatch, getChampionMastery } from "@/lib/riot";
import { getCachedMatch } from "@/lib/supabase";

export const runtime = "nodejs";

export type ParticipantMastery = {
  championLevel: number;
  championPoints: number;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const region = req.nextUrl.searchParams.get("region") ?? "la1";

  if (!matchId) {
    return NextResponse.json({ error: "matchId es requerido" }, { status: 400 });
  }

  try {
    const cached = await getCachedMatch(matchId);
    const match = cached ?? await getMatch(matchId, region);
    const participants = match.info.participants;
    const platformId = (match.info.platformId ?? region).toLowerCase();
    const platform = platformId.replace(/^na$/, "na1").replace(/^la$/, "la1");

    const map: Record<string, ParticipantMastery> = {};
    for (const p of participants) {
      const m = await getChampionMastery(p.puuid, p.championId, platform);
      map[p.puuid] = {
        championLevel: m?.championLevel ?? 0,
        championPoints: m?.championPoints ?? 0,
      };
    }

    return NextResponse.json(map, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Match masteries error:", err);
    return NextResponse.json(
      { error: "Error al cargar maestrías" },
      { status: 500 }
    );
  }
}
