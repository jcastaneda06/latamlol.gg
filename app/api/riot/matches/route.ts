import { NextRequest, NextResponse } from "next/server";
import { getMatchIds, getMatch, getRankedByPuuid } from "@/lib/riot";
import { getCachedMatch, setCachedMatch, getRankSnapshots } from "@/lib/supabase";
import { computeLPDeltas } from "@/lib/lp-delta";
import type { ProcessedMatch } from "@/types/match";
import type { ParticipantDTO } from "@/types/match";

export const runtime = "nodejs";

function processParticipant(
  p: ParticipantDTO,
  matchId: string,
  gameDuration: number,
  queueId: number,
  gameCreation: number,
  gameEndTimestamp?: number
): ProcessedMatch {
  const endTs = gameEndTimestamp ?? gameCreation + gameDuration * 1000;
  return {
    matchId,
    champion: p.championName,
    championId: p.championId,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    csPerMin: gameDuration > 0 ? (p.totalMinionsKilled + p.neutralMinionsKilled) / (gameDuration / 60) : 0,
    visionScore: p.visionScore,
    goldEarned: p.goldEarned,
    totalDamageToChampions: p.totalDamageDealtToChampions,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    trinket: p.item6,
    summoner1Id: p.summoner1Id,
    summoner2Id: p.summoner2Id,
    win: p.win,
    gameMode: "",
    queueId,
    gameDuration,
    gameCreation,
    gameEndTimestamp: endTs,
    teamPosition: p.teamPosition || p.individualPosition,
    champLevel: p.champLevel,
    primaryRune: p.perks?.styles?.[0]?.selections?.[0]?.perk ?? 0,
    perks: p.perks,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const puuid = searchParams.get("puuid");
  const region = searchParams.get("region") ?? "la1";
  const start = parseInt(searchParams.get("start") ?? "0");
  const count = Math.min(parseInt(searchParams.get("count") ?? "10"), 20);
  const queueParam = searchParams.get("queue");
  const queue = queueParam ? parseInt(queueParam) : undefined;

  if (!puuid) {
    return NextResponse.json({ error: "puuid es requerido" }, { status: 400 });
  }

  try {
    const matchIds = await getMatchIds(puuid, region, { start, count, queue });

    const results = await Promise.allSettled(
      matchIds.map(async (matchId) => {
        const cached = await getCachedMatch(matchId);
        if (cached) return cached;

        const match = await getMatch(matchId, region);
        setCachedMatch(matchId, region, match).catch(() => {});
        return match;
      })
    );

    const processed: ProcessedMatch[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const match = result.value;
      const participant = match.info.participants.find(p => p.puuid === puuid);
      if (!participant) continue;

      const p = processParticipant(
      participant,
      match.metadata.matchId,
      match.info.gameDuration,
      match.info.queueId,
      match.info.gameCreation,
      match.info.gameEndTimestamp
    );
      p.gameMode = match.info.gameMode;
      processed.push(p);
    }

    const ranked = await getRankedByPuuid(puuid, region).catch(() => []);
    const snapshots = await getRankSnapshots(puuid, region);
    const currentRankByQueue: Record<string, { tier: string; rank: string; leaguePoints: number; wins: number; losses: number }> = {};
    for (const e of ranked) {
      currentRankByQueue[e.queueType] = {
        tier: e.tier,
        rank: e.rank ?? "I",
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      };
    }

    const lpMap = computeLPDeltas(
      processed.map(m => ({
        matchId: m.matchId,
        queueId: m.queueId,
        win: m.win,
        gameEndTimestamp: m.gameEndTimestamp ?? m.gameCreation + m.gameDuration * 1000,
      })),
      snapshots,
      currentRankByQueue
    );

    for (const m of processed) {
      const delta = lpMap.get(m.matchId);
      if (delta !== undefined) m.lpDelta = delta;
    }

    return NextResponse.json(processed);
  } catch (err: unknown) {
    console.error("Matches error:", err);
    return NextResponse.json({ error: "Error al obtener historial de partidas" }, { status: 500 });
  }
}
