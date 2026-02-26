"use server";

import type { ChampionRole } from "@/types/champion";
import {
  getChallengerLeaderboard,
  getSummonerById,
  getMatchIds,
  getMatch,
} from "@/lib/riot";
import { getChampionNameById } from "@/lib/ddragon";
import {
  getCachedMatch,
  setCachedMatch,
  getCachedTierList,
  setCachedTierList,
} from "@/lib/supabase";
import type { MatchDTO } from "@/types/match";

const WINRATE_CACHE_KEY = "winrate_aggregate";
const RANKED_SOLO_QUEUE = 420;

// Riot teamPosition -> our ChampionRole
const TEAM_POSITION_TO_ROLE: Record<string, ChampionRole> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "support",
};

// Rate limit: ~1 req/sec to stay under 100/2min on dev key
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type WinrateAggregate = Record<
  string,
  Partial<Record<ChampionRole, { wins: number; losses: number }>>
>;

function normalizeChampionKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").trim() || name;
}

async function fetchAndCacheMatch(matchId: string, region: string): Promise<MatchDTO | null> {
  const cached = await getCachedMatch(matchId);
  if (cached) return cached;
  try {
    await delay(1200);
    const match = await getMatch(matchId, region);
    await setCachedMatch(matchId, region, match);
    return match;
  } catch {
    return null;
  }
}

export async function getCachedWinrates(): Promise<WinrateAggregate | null> {
  const data = await getCachedTierList("latest", WINRATE_CACHE_KEY);
  if (!data || typeof data !== "object") return null;
  return data as WinrateAggregate;
}

export async function aggregateWinratesFromRiot(
  region = "la1"
): Promise<WinrateAggregate> {
  const platform = region.toLowerCase().replace(/^na$/, "na1").replace(/^la$/, "la1");

  const agg: WinrateAggregate = {};

  try {
    const leaderboard = await getChallengerLeaderboard(platform, "RANKED_SOLO_5x5");
    const entries = (leaderboard as { entries?: Array<{ summonerId: string }> }).entries ?? [];
    const sample = entries.slice(0, 10);

    const matchIds = new Set<string>();
    for (const entry of sample) {
      const summonerId = (entry as { summonerId?: string }).summonerId;
      if (!summonerId) continue;
      try {
        await delay(1200);
        const summoner = await getSummonerById(summonerId, platform);
        await delay(1200);
        const ids = await getMatchIds(summoner.puuid, platform, {
          count: 12,
          queue: RANKED_SOLO_QUEUE,
        });
        ids.forEach((id) => matchIds.add(id));
      } catch {
        // Skip failed summoners
      }
    }

    for (const matchId of matchIds) {
      const match = await fetchAndCacheMatch(matchId, platform);
      if (!match?.info?.participants?.length || match.info.queueId !== RANKED_SOLO_QUEUE)
        continue;

      for (const p of match.info.participants) {
        const role = TEAM_POSITION_TO_ROLE[p.teamPosition ?? p.individualPosition ?? ""];
        if (!role) continue;

        let champName = p.championName?.trim() || "";
        if (!champName && p.championId) champName = await getChampionNameById(p.championId);
        const key = normalizeChampionKey(champName);
        if (!key || key === "Unknown") continue;

        if (!agg[key]) agg[key] = {};
        if (!agg[key][role]) agg[key][role] = { wins: 0, losses: 0 };

        if (p.win) agg[key][role]!.wins++;
        else agg[key][role]!.losses++;
      }
    }

    return agg;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[aggregateWinratesFromRiot]", err);
    }
    return {};
  }
}

export async function getOrFetchWinrates(
  region = "la1"
): Promise<WinrateAggregate> {
  const cached = await getCachedWinrates();
  if (cached && Object.keys(cached).length > 0) return cached;

  const data = await aggregateWinratesFromRiot(region);
  if (Object.keys(data).length > 0) {
    await setCachedTierList("latest", WINRATE_CACHE_KEY, data);
  }
  return data;
}
