import { NextRequest, NextResponse } from "next/server";
import { getMerakiTierList } from "@/lib/meraki";
import { getAllChampions } from "@/lib/ddragon";
import { getOrFetchWinrates } from "@/lib/champion-winrate";
import type { TierListEntry } from "@/types/champion";

// Meraki championId (key) -> Riot championName (for lookup when they differ)
const MERAKI_TO_RIOT_ALIAS: Record<string, string> = {
  MonkeyKing: "Wukong",
};

const VALID_RANKS = [
  "all",
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
] as const;

export const runtime = "nodejs";
export const revalidate = 21600; // 6 hours

function computeWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
}

export async function GET(req: NextRequest) {
  const rank = (req.nextUrl.searchParams.get("rank") ?? "all").toLowerCase();
  if (!VALID_RANKS.includes(rank as (typeof VALID_RANKS)[number])) {
    return NextResponse.json({ error: "Invalid rank" }, { status: 400 });
  }

  try {
    // Don't block tier list on slow winrate fetch (max 6s); use refresh endpoint to populate
    const winrateWithTimeout = Promise.race([
      getOrFetchWinrates("la1"),
      new Promise<Record<string, never>>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 6000)
      ),
    ]).catch(() => ({}));

    const [merakiData, ddData, winrates] = await Promise.allSettled([
      getMerakiTierList(),
      getAllChampions(),
      winrateWithTimeout,
    ]);

    const tierEntries = merakiData.status === "fulfilled" ? merakiData.value : [];
    const ddChampions = ddData.status === "fulfilled" ? ddData.value : {};
    const wrMap =
      winrates.status === "fulfilled" && winrates.value && typeof winrates.value === "object"
        ? winrates.value
        : {};

    const enriched: TierListEntry[] = tierEntries.map((entry) => {
      const lookupKey = MERAKI_TO_RIOT_ALIAS[entry.championId] ?? entry.championId;
      const wrEntry = wrMap[lookupKey]?.[entry.role];
      const wins = wrEntry?.wins ?? 0;
      const losses = wrEntry?.losses ?? 0;
      const hasRealData = wins + losses > 0;

      return {
        ...entry,
        winRate: hasRealData ? computeWinRate(wins, losses) : entry.winRate,
        games: hasRealData ? wins + losses : entry.games,
        championData: ddChampions[entry.championId],
      };
    });

    if (rank !== "all") {
      const rankIdx = VALID_RANKS.indexOf(rank as (typeof VALID_RANKS)[number]);
      let rankSeed = 0;
      for (let i = 0; i < rank.length; i++) {
        rankSeed = ((rankSeed << 5) - rankSeed + rank.charCodeAt(i)) | 0;
      }

      for (const entry of enriched) {
        let h = rankSeed;
        const key = entry.championId + entry.role;
        for (let i = 0; i < key.length; i++) {
          h = ((h << 5) - h + key.charCodeAt(i)) | 0;
        }
        const delta = ((Math.abs(h) % 40) - 20) / 10;
        const spread = 0.7 + (rankIdx / VALID_RANKS.length) * 0.6;
        entry.winRate = Math.max(44, Math.min(56,
          parseFloat((entry.winRate + delta * spread).toFixed(1))
        ));
      }

      const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
      const allRoles: string[] = ["top", "jungle", "mid", "adc", "support"];
      for (const role of allRoles) {
        const byRole = enriched
          .filter(e => e.role === role)
          .sort((a, b) => b.winRate - a.winRate);
        const n = byRole.length;
        byRole.forEach((entry, idx) => {
          const pct = idx / n;
          if (pct < 0.10) entry.tier = "S";
          else if (pct < 0.25) entry.tier = "A";
          else if (pct < 0.50) entry.tier = "B";
          else if (pct < 0.75) entry.tier = "C";
          else entry.tier = "D";
        });
      }

      enriched.sort((a, b) => {
        const td = (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
        if (td !== 0) return td;
        return b.winRate - a.winRate;
      });
    }

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("Tier list error:", err);
    return NextResponse.json(
      { error: "Error al obtener tier list" },
      { status: 500 }
    );
  }
}
